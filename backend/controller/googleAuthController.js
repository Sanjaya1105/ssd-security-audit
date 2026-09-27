const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { logSecurityEvent } = require("../utils/securityLogger");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const REDIRECT_URI =
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:3000/api/users/auth/google/callback";

function getOAuthClient() {
    return new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        REDIRECT_URI
    );
}

function redirectWithError(res, reason, req) {
    if (req) {
        logSecurityEvent("OAUTH_FAILURE", { reason }, req);
    }
    const url = `${FRONTEND_URL}/login?oauth=error&reason=${encodeURIComponent(reason)}`;
    return res.redirect(url);
}

function toClientUser(user) {
    return {
        id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        address: user.address,
        phone_number: user.phone_number
    };
}

function setSessionCookie(res, user) {
    const token = jwt.sign(
        {
            user_id: user.user_id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "3h",
            algorithm: "HS256"
        }
    );

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 3 * 60 * 60 * 1000,
        path: "/"
    });
}

async function ensureGoogleColumns(db) {
    const statements = [
        "ALTER TABLE user ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'local'",
        "ALTER TABLE user ADD COLUMN google_sub VARCHAR(255) NULL"
    ];

    for (const sql of statements) {
        try {
            await db.promise().execute(sql);
        } catch (err) {
            if (err.code !== "ER_DUP_FIELDNAME" && err.errno !== 1060) {
                console.error("Google OpenID schema update:", err.message);
            }
        }
    }
}

function googlePhonePlaceholder(sub) {
    const digits = String(sub).replace(/\D/g, "").slice(-10).padStart(10, "0");
    return `g${digits}`;
}

exports.startGoogleLogin = (req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return redirectWithError(res, "google_not_configured", req);
    }

    const state = crypto.randomBytes(24).toString("hex");
    res.cookie("oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 10 * 60 * 1000,
        path: "/"
    });

    const url = getOAuthClient().generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: ["openid", "email", "profile"],
        state
    });

    return res.redirect(url);
};

exports.handleGoogleCallback = async (req, res) => {
    try {
        const { code, state, error } = req.query;

        if (error) {
            return redirectWithError(res, String(error), req);
        }

        if (!code || !state || state !== req.cookies.oauth_state) {
            return redirectWithError(res, "invalid_state", req);
        }

        res.clearCookie("oauth_state", { path: "/" });

        const client = getOAuthClient();
        const { tokens } = await client.getToken(String(code));

        if (!tokens.id_token) {
            return redirectWithError(res, "missing_id_token", req);
        }

        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        if (!payload?.email || payload.email_verified === false) {
            return redirectWithError(res, "email_not_verified", req);
        }

        const db = req.db;
        await ensureGoogleColumns(db);

        const email = payload.email;
        const sub = payload.sub;
        const firstName = payload.given_name || "Google";
        const lastName = payload.family_name || "User";

        const [bySub] = await db.promise().execute(
            "SELECT * FROM user WHERE google_sub = ? LIMIT 1",
            [sub]
        );

        let user = bySub[0];

        if (!user) {
            const [byEmail] = await db.promise().execute(
                "SELECT * FROM user WHERE email = ? LIMIT 1",
                [email]
            );
            user = byEmail[0];

            if (user) {
                await db.promise().execute(
                    "UPDATE user SET google_sub = ?, auth_provider = CASE WHEN auth_provider = 'local' THEN 'local' ELSE 'google' END WHERE user_id = ?",
                    [sub, user.user_id]
                );
            } else {
                const hashedPassword = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
                const phone = googlePhonePlaceholder(sub);

                const [insertResult] = await db.promise().execute(
                    `INSERT INTO user (first_name, last_name, address, phone_number, email, password, role, auth_provider, google_sub)
                     VALUES (?, ?, ?, ?, ?, ?, 'customer', 'google', ?)`,
                    [firstName, lastName, "Signed in with Google", phone, email, hashedPassword, sub]
                );

                const [created] = await db.promise().execute(
                    "SELECT * FROM user WHERE user_id = ?",
                    [insertResult.insertId]
                );
                user = created[0];
            }
        }

        setSessionCookie(res, user);
        logSecurityEvent(
            "OAUTH_SUCCESS",
            { email: user.email, user_id: user.user_id, role: user.role },
            req
        );
        return res.redirect(`${FRONTEND_URL}/auth/google/callback`);
    } catch (err) {
        console.error("Google OpenID callback error:", err);
        return redirectWithError(res, "oauth_failed", req);
    }
};

exports.getMe = (req, res) => {
    const db = req.db;
    db.execute(
        "SELECT user_id, first_name, last_name, address, phone_number, email, role FROM user WHERE user_id = ?",
        [req.user.user_id],
        (err, results) => {
            if (err) {
                console.error("getMe error:", err);
                return res.status(500).json({ message: "Server Error" });
            }
            if (!results.length) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            res.status(200).json({ user: toClientUser(results[0]) });
        }
    );
};
