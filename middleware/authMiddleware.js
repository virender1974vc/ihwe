const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ihwe_secret_2026');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Token expired or invalid' });
    }
};

const adminMiddleware = (req, res, next) => {
    const userRole = req.user?.role
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    const adminRoles = ['admin', 'super-admin', 'super-administrator', 'ihwe-super-administrator'];

    if (req.user && adminRoles.includes(userRole)) {
        next();
    } else {
        return res.status(403).json({ success: false, message: 'Admin access only' });
    }
};

module.exports = { authMiddleware, adminMiddleware };
