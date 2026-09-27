const hits = new Map();
const { logSecurityEvent } = require("../utils/securityLogger");

function rateLimiter({ windowMs = 15 * 60 * 1000, max = 8, action = "auth" } = {}) {
    return (req, res, next) => {
        const key = `${action}:${req.ip}`;
        const now = Date.now();
        const record = hits.get(key) || { count: 0, resetAt: now + windowMs };

        if (now > record.resetAt) {
            record.count = 0;
            record.resetAt = now + windowMs;
        }

        record.count += 1;
        hits.set(key, record);

        if (record.count > max) {
            logSecurityEvent(
                "ALERT_RATE_LIMIT",
                { action, attempts: record.count },
                req
            );
            return res.status(429).json({
                message: "Too many attempts. Please try again later."
            });
        }

        next();
    };
}

module.exports = { rateLimiter };
