const jwt = require('jsonwebtoken');

const authenticateUser = (req, res, next) => {
    try {
        const token = req.cookies.token || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: "Unauthorized: Invalid token" });
            }

            req.user = decoded; // Store user details in req.user
            next(); // Continue to the next middleware or route
        });
    } catch (error) {
        res.status(401).json({ message: "Unauthorized: Token verification failed" });
    }
};

module.exports = authenticateUser;

const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};

module.exports = { authenticateUser, authorizeRole };
