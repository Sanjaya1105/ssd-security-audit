const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const STATE_COOKIE = "oauth_state";
const TEN_MINUTES_MS = 10 * 60 * 1000;
const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

function frontendBase() {
    return (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
}

function googleConfigured() {
    return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function createClient() {
    return new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
}

function query(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
}

function clearStateCookie(res) {
    res.clearCookie(STATE_COOKIE, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
    });
}

function redirectLoginError(res, reason) {
    if (res.headersSent) return;
    clearStateCookie(res);
    const url = new URL("/login", frontendBase());
    url.searchParams.set("oauth", "error");
    url.searchParams.set("reason", reason);
    return res.redirect(url.toString());
}

function safeEqual(a, b) {
    if (typeof a !== "string" || typeof b !== "string") return false;
    if (a.length > 128 || b.length > 128) return false;
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    if (left.length !== right.length) return false;
    return crypto.timingSafeEqual(left, right);
}

function phoneFromSub(sub) {
    const digits = String(sub || "").replace(/\D/g, "");
    const last10 = (digits || "0").slice(-10).padStart(10, "0");
    return `g${last10}`;
}

async function ensureGoogleColumns(db) {
    const statements = [
        "ALTER TABLE user ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'local'",
        "ALTER TABLE user ADD COLUMN google_sub VARCHAR(255) NULL",
    ];

    for (const sql of statements) {
        try {
            await query(db, sql);
        } catch (err) {
            if (err.code !== "ER_DUP_FIELDNAME" && err.errno !== 1060) {
                throw err;
            }
        }
    }
}

async function findOrCreateGoogleUser(db, payload) {
    const sub = String(payload.sub);
    const email = String(payload.email).trim();

    const bySub = await query(db, "SELECT * FROM user WHERE google_sub = ? LIMIT 1", [sub]);
    if (bySub.length > 0) {
        return bySub[0];
    }

    const byEmail = await query(db, "SELECT * FROM user WHERE email = ? LIMIT 1", [email]);
    if (byEmail.length > 0) {
        await query(db, "UPDATE user SET google_sub = ? WHERE user_id = ?", [sub, byEmail[0].user_id]);
        return { ...byEmail[0], google_sub: sub };
    }

    const firstName = payload.given_name && String(payload.given_name).trim()
        ? String(payload.given_name).trim()
        : "Google";
    const lastName = payload.family_name && String(payload.family_name).trim()
        ? String(payload.family_name).trim()
        : "User";
    const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
    const role = "customer";

    const result = await query(
        db,
        "INSERT INTO user (first_name, last_name, address, phone_number, email, password, role, auth_provider, google_sub) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [firstName, lastName, "Signed in with Google", phoneFromSub(sub), email, passwordHash, role, "google", sub]
    );

    return {
        user_id: result.insertId,
        email,
        role,
    };
}

function issueSession(res, user) {
    const token = jwt.sign(
        {
            user_id: user.user_id,
            email: user.email,
            role: user.role,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "3h",
            algorithm: "HS256",
        }
    );

    clearStateCookie(res);
    res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: THREE_HOURS_MS,
        path: "/",
    });
    return res.redirect(`${frontendBase()}/auth/google/callback`);
}

exports.startGoogleLogin = (req, res) => {
    try {
        if (!googleConfigured()) {
            return redirectLoginError(res, "google_not_configured");
        }

        const state = crypto.randomBytes(32).toString("hex");
        res.cookie(STATE_COOKIE, state, {
            httpOnly: true,
            sameSite: "lax",
            maxAge: TEN_MINUTES_MS,
            path: "/",
        });

        const client = createClient();
        const url = client.generateAuthUrl({
            access_type: "offline",
            prompt: "consent",
            scope: ["openid", "email", "profile"],
            state,
        });

        return res.redirect(url);
    } catch (err) {
        console.error("Google login start error:", err && err.message ? err.message : err);
        return redirectLoginError(res, "server_error");
    }
};

exports.handleGoogleCallback = async (req, res) => {
    try {
        const code = req.query.code;
        const state = req.query.state;
        const error = req.query.error;
        const expectedState = req.cookies ? req.cookies[STATE_COOKIE] : undefined;

        if (error) {
            return redirectLoginError(res, "google_error");
        }

        if (typeof state !== "string" || typeof expectedState !== "string" || !safeEqual(state, expectedState)) {
            return redirectLoginError(res, "invalid_state");
        }

        if (!code || typeof code !== "string") {
            return redirectLoginError(res, "missing_code");
        }

        if (!googleConfigured()) {
            return redirectLoginError(res, "google_not_configured");
        }

        const client = createClient();
        const { tokens } = await client.getToken(code);
        if (!tokens || !tokens.id_token) {
            return redirectLoginError(res, "missing_id_token");
        }

        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload || !payload.sub) {
            return redirectLoginError(res, "invalid_token");
        }

        if (!payload.email || payload.email_verified === false) {
            return redirectLoginError(res, "email_not_verified");
        }

        await ensureGoogleColumns(req.db);
        const user = await findOrCreateGoogleUser(req.db, payload);
        return issueSession(res, user);
    } catch (err) {
        console.error("Google callback error:", err && err.message ? err.message : err);
        return redirectLoginError(res, "server_error");
    }
};

exports.getMe = (req, res) => {
    const db = req.db;
    const userId = req.user && req.user.user_id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    db.query(
        "SELECT user_id, first_name, last_name, email, role, address, phone_number FROM user WHERE user_id = ? LIMIT 1",
        [userId],
        (err, rows) => {
            if (err) {
                console.error("getMe error:", err && err.message ? err.message : err);
                return res.status(500).json({ message: "Server Error" });
            }

            if (!rows || rows.length === 0) {
                return res.status(404).json({ message: "User not found" });
            }

            const user = rows[0];
            return res.status(200).json({
                user: {
                    id: user.user_id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role,
                    address: user.address,
                    phone_number: user.phone_number,
                },
            });
        }
    );
};
