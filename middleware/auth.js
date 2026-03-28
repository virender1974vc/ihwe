const jwt = require('jsonwebtoken');

const protectExhibitor = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
            
            if (decoded.role !== 'exhibitor') {
                return res.status(403).json({ success: false, message: 'Not authorized as exhibitor' });
            }

            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

module.exports = { protectExhibitor };
