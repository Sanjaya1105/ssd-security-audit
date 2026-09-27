const fs = require("fs");
const path = require("path");

const logDir = path.join(__dirname, "..", "logs");
const logFile = path.join(logDir, "security.log");
const failedLogins = new Map();
const ALERT_WINDOW_MS = 15 * 60 * 1000;
const ALERT_AFTER = 5;

function clientIp(req) {
    if (!req) return "unknown";
    return req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
}

function logSecurityEvent(event, details = {}, req) {
    const entry = {
        ts: new Date().toISOString(),
        event,
        ip: clientIp(req),
        method: req?.method,
        path: req?.originalUrl,
        actor_id: req?.user?.user_id,
        actor_role: req?.user?.role,
        ...details
    };

    delete entry.password;
    delete entry.token;
    delete entry.cookie;
    delete entry.newPassword;
    delete entry.code;

    const line = JSON.stringify(entry);

    try {
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        fs.appendFileSync(logFile, line + "\n");
    } catch (err) {
        console.error("[SECURITY] Failed to write security log:", err.message);
    }

    if (String(event).startsWith("ALERT_")) {
        console.warn("[SECURITY-ALERT]", line);
    } else {
        console.log("[SECURITY]", line);
    }
}

function noteFailedLogin(req, email) {
    logSecurityEvent("LOGIN_FAILURE", { email }, req);

    const ip = clientIp(req);
    const now = Date.now();
    const record = failedLogins.get(ip) || { count: 0, resetAt: now + ALERT_WINDOW_MS };

    if (now > record.resetAt) {
        record.count = 0;
        record.resetAt = now + ALERT_WINDOW_MS;
    }

    record.count += 1;
    failedLogins.set(ip, record);

    if (record.count >= ALERT_AFTER) {
        logSecurityEvent(
            "ALERT_BRUTE_FORCE",
            { email, failures: record.count },
            req
        );
    }
}

module.exports = {
    logSecurityEvent,
    noteFailedLogin,
    logFile
};
