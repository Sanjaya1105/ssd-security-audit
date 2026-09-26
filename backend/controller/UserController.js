const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { sendVerificationCode } = require("../utils/emailService");
const { logSecurityEvent, noteFailedLogin } = require("../utils/securityLogger");
require("dotenv").config();

const VALID_ROLES = ["customer", "manager", "admin", "cashier"];
const USER_SAFE_COLUMNS = "user_id, first_name, last_name, address, phone_number, email, role";

const isPrivilegedActor = (user) => user && ["admin", "manager"].includes(user.role);

const canAccessUserRecord = (actor, targetId) => {
    if (!actor) return false;
    if (isPrivilegedActor(actor)) return true;
    return String(actor.user_id) === String(targetId);
};

const isValidResetCode = (user, code) => {
    if (!user || !user.reset_code || !user.reset_code_expiry) {
        return false;
    }
    const now = new Date();
    const expiryTime = new Date(user.reset_code_expiry);
    return now <= expiryTime && String(user.reset_code) === String(code);
};

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ✅ Create a New User (Auto-Increment `user_id`)
exports.createUser = async (req, res) => {
    try {
        const { first_name, last_name, address, phone_number, email, password, role } = req.body;
        const db = req.db;

        // Public signup (and Google) cannot pick a role. Only a logged-in admin/manager can create staff.
        let assignedRole = "customer";
        if (isPrivilegedActor(req.user)) {
            if (role && !VALID_ROLES.includes(role)) {
                return res.status(400).json({ message: "🚨 Invalid role. Must be one of: customer, manager, admin, cashier" });
            }
            assignedRole = role || "customer";
        } else if (role && role !== "customer") {
            logSecurityEvent(
                "ALERT_PRIVILEGE_ATTEMPT",
                { email, requested_role: role },
                req
            );
        }

        // Check if email already exists
        db.execute("SELECT user_id FROM user WHERE email = ?", [email], async (err, existingUser) => {
            if (err) return res.status(500).json({ message: "Server Error" });

            if (existingUser.length > 0) {
                return res.status(400).json({ message: "🚨 Email already in use!" });
            }

            // ✅ Check if phone number already exists
            db.execute("SELECT user_id FROM user WHERE phone_number = ?", [phone_number], async (err, existingPhone) => {
                if (err) return res.status(500).json({ message: "Server Error" });

                if (existingPhone.length > 0) {
                    return res.status(400).json({ message: "🚨 Phone number already in use!" });
                }

                // ✅ Hash password
                const hashedPassword = await bcrypt.hash(password, 10);

                // ✅ Insert user
                db.execute(
                    "INSERT INTO user (first_name, last_name, address, phone_number, email, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [first_name, last_name, address, phone_number, email, hashedPassword, assignedRole],
                    (err, result) => {
                        if (err) return res.status(500).json({ message: "Server Error" });

                        logSecurityEvent(
                            "REGISTER_SUCCESS",
                            { email, user_id: result.insertId, role: assignedRole },
                            req
                        );
                        res.status(201).json({
                            message: "✅ User created successfully",
                            user_id: result.insertId,
                            role: assignedRole
                        });
                    }
                );
            });
        });

    } catch (error) {
        console.error("Create User Error:", error);
        res.status(500).json({ message: "Server Error"});
    }
};


// ✅ LOGIN USER (Using Cookie-Based Authentication)
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = req.db;

        // ✅ Fetch user from MySQL database
        db.execute("SELECT * FROM user WHERE email = ?", [email], async (err, users) => {
            if (err) return res.status(500).json({ message: "Server Error" });

            if (users.length === 0) {
                noteFailedLogin(req, email);
                return res.status(400).json({ message: "❌ Invalid credentials" });
            }

            const user = users[0];

            // ✅ Compare hashed password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                noteFailedLogin(req, email);
                return res.status(400).json({ message: "❌ Invalid credentials" });
            }

            // ✅ Generate JWT Token with enhanced security
            const token = jwt.sign(
                { 
                    user_id: user.user_id, 
                    email: user.email,
                    role: user.role
                }, 
                process.env.JWT_SECRET, 
                { 
                    expiresIn: "3h",
                    algorithm: 'HS256'
                }
            );

            // ✅ Send token as HTTP-Only Cookie
            logSecurityEvent(
                "LOGIN_SUCCESS",
                { email, user_id: user.user_id, role: user.role },
                req
            );
            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: 'strict',
                maxAge: 3 * 60 * 60 * 1000,
                path: '/'
            }).status(200).json({
                message: "✅ Login successful",
                user: {
                    id: user.user_id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role,
                    address: user.address,
                    phone_number: user.phone_number
                }
            });
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server Error"});
    }
};

// ✅ LOGOUT USER (Clear Cookie)
exports.logout = (req, res) => {
    logSecurityEvent("LOGOUT", {}, req);
    res.cookie('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: 'strict',
        expires: new Date(0),
        path: '/'
    }).status(200).json({ message: "✅ Logged out successfully" });
};

// ✅ Get All Users
exports.getUsers = async (req, res) => {
    try {
        const db = req.db;
        db.execute(`SELECT ${USER_SAFE_COLUMNS} FROM user`, (err, results) => {
            if (err) return res.status(500).json({ message: "Server Error" });

            res.status(200).json(results);
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error"});
    }
};

// ✅ Get a Single User by ID
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!canAccessUserRecord(req.user, id)) {
            logSecurityEvent("ACCESS_DENIED", { target_user_id: id, reason: "view_other_user" }, req);
            return res.status(403).json({ message: "Forbidden: You can only view your own profile" });
        }

        const db = req.db;
        db.execute(`SELECT ${USER_SAFE_COLUMNS} FROM user WHERE user_id = ?`, [id], (err, results) => {
            if (err) return res.status(500).json({ message: "Server Error" });

            if (results.length === 0) {
                return res.status(404).json({ message: "❌ User not found!" });
            }

            res.status(200).json(results[0]);
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error"});
    }
};

// ✅ Update User
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, address, phone_number, email } = req.body;

        if (!canAccessUserRecord(req.user, id)) {
            logSecurityEvent("ACCESS_DENIED", { target_user_id: id, reason: "update_other_user" }, req);
            return res.status(403).json({ message: "Forbidden: You can only update your own profile" });
        }

        const db = req.db;

        // ✅ Check if user exists
        db.execute("SELECT user_id FROM user WHERE user_id = ?", [id], (err, results) => {
            if (err) return res.status(500).json({ message: "Server Error" });

            if (results.length === 0) {
                return res.status(404).json({ message: "❌ User not found!" });
            }

            // ✅ Update user details
            db.execute(
                "UPDATE user SET first_name=?, last_name=?, address=?, phone_number=?, email=? WHERE user_id=?",
                [first_name, last_name, address, phone_number, email, id],
                (err, result) => {
                    if (err) return res.status(500).json({ message: "Server Error" });

                    res.status(200).json({ message: "✅ User updated successfully" });
                }
            );
        });

    } catch (error) {
        res.status(500).json({ message: "Server Error"});
    }
};

// ✅ Delete User
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.db;

        // ✅ Check if user exists
        db.execute("SELECT user_id FROM user WHERE user_id = ?", [id], (err, results) => {
            if (err) return res.status(500).json({ message: "Server Error" });

            if (results.length === 0) {
                return res.status(404).json({ message: "❌ User not found!" });
            }

            // ✅ Delete user
            db.execute("DELETE FROM user WHERE user_id = ?", [id], (err, result) => {
                if (err) return res.status(500).json({ message: "Server Error" });

                res.status(200).json({ message: "✅ User deleted successfully" });
                logSecurityEvent("USER_DELETED", { target_user_id: id }, req);
            });
        });

    } catch (error) {
        res.status(500).json({ message: "Server Error"});
    }
};

// ✅ Verify token
exports.verifyToken = async (req, res) => {
    try {
        // If we get here, it means the token was valid (checked by authenticateUser middleware)
        res.status(200).json({ 
            message: "✅ Token is valid",
            user: {
                id: req.user.user_id,
                email: req.user.email,
                role: req.user.role
            }
        });
    } catch (error) {
        console.error("Token Verification Error:", error);
        res.status(401).json({ message: "❌ Token verification failed" });
    }
};

// ✅ Get Users by Role
exports.getUsersByRole = async (req, res) => {
    try {
        const { role } = req.params;
        const db = req.db;

        if (!VALID_ROLES.includes(role)) {
            return res.status(400).json({ message: "🚨 Invalid role. Must be one of: customer, manager, admin, cashier" });
        }

        db.execute(`SELECT ${USER_SAFE_COLUMNS} FROM user WHERE role = ?`, [role], (err, results) => {
            if (err) return res.status(500).json({ message: "Server Error" });

            res.status(200).json(results);
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error"});
    }
};

// Forget Password
exports.forgetPassword = async (req, res) => {
  const genericMessage = {
    success: true,
    message: "If an account exists for that email, a verification code has been sent"
  };

  try {
    const { email } = req.body;
    const db = req.db;

    db.execute("SELECT user_id FROM user WHERE email = ?", [email], async (err, results) => {
      if (err) return res.status(500).json({ message: "Server Error" });

      if (results.length === 0) {
        logSecurityEvent("PASSWORD_RESET_REQUEST", { email, found: false }, req);
        return res.status(200).json(genericMessage);
      }

      const verificationCode = crypto.randomInt(100000, 1000000).toString();
      const expiryTime = new Date(Date.now() + 10 * 60000);

      db.execute(
        "UPDATE user SET reset_code = ?, reset_code_expiry = ? WHERE email = ?",
        [verificationCode, expiryTime, email],
        async (updateErr) => {
          if (updateErr) return res.status(500).json({ message: "Server Error" });

          try {
            await sendVerificationCode(email, verificationCode);
            logSecurityEvent("PASSWORD_RESET_REQUEST", { email, found: true }, req);
            res.status(200).json(genericMessage);
          } catch (mailErr) {
            console.error("Error sending verification email:", mailErr);
            res.status(500).json({ message: "Failed to send verification email" });
          }
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error"});
  }
};

// Verify Code
exports.verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const db = req.db;

    db.execute(
      "SELECT reset_code, reset_code_expiry FROM user WHERE email = ?",
      [email],
      (err, results) => {
        if (err) return res.status(500).json({ message: "Server Error" });

        if (results.length === 0 || !isValidResetCode(results[0], code)) {
          logSecurityEvent("RESET_CODE_FAILURE", { email }, req);
          return res.status(400).json({ message: "Invalid or expired verification code" });
        }

        res.status(200).json({ success: true, message: "Code verified successfully" });
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Server Error"});
  }
};

// Reset Password — email + OTP + new password are all required
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const db = req.db;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: "Email, verification code, and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    db.execute(
      "SELECT reset_code, reset_code_expiry FROM user WHERE email = ?",
      [email],
      async (err, results) => {
        if (err) return res.status(500).json({ message: "Server Error" });

        if (results.length === 0 || !isValidResetCode(results[0], code)) {
          logSecurityEvent("PASSWORD_RESET_FAILURE", { email }, req);
          return res.status(400).json({ message: "Invalid or expired verification code" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        db.execute(
          "UPDATE user SET password = ?, reset_code = NULL, reset_code_expiry = NULL WHERE email = ?",
          [hashedPassword, email],
          (updateErr) => {
            if (updateErr) return res.status(500).json({ message: "Server Error" });
            logSecurityEvent("PASSWORD_RESET_SUCCESS", { email }, req);
            res.status(200).json({ success: true, message: "Password reset successfully" });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Server Error"});
  }
};
