const jwt = require("jsonwebtoken");
const { logSecurityEvent } = require("../utils/securityLogger");

const authenticateUser = (req, res, next) => {
    try {
        const token = req.cookies.token || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            logSecurityEvent("AUTH_FAILURE", { reason: "no_token" }, req);
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                logSecurityEvent("AUTH_FAILURE", { reason: "invalid_token" }, req);
                return res.status(401).json({ message: "Unauthorized: Invalid token" });
            }

            req.user = decoded;
            next();
        });
    } catch (error) {
        logSecurityEvent("AUTH_FAILURE", { reason: "token_verification_failed" }, req);
        res.status(401).json({ message: "Unauthorized: Token verification failed" });
    }
};

// Lets public register still work, but an admin cookie can assign staff roles.
const optionalAuthenticate = (req, res, next) => {
    const token = req.cookies.token || req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (!err) {
            req.user = decoded;
        }
        next();
    });
};

const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            logSecurityEvent(
                "ACCESS_DENIED",
                {
                    required_roles: roles,
                    reason: "insufficient_role"
                },
                req
            );
            return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
        }
        next();
    };
};

module.exports = { authenticateUser, optionalAuthenticate, authorizeRole };
