const express = require('express');
const router = express.Router();

// For now, return empty roles list
// In future, create a Role model and manage roles from DB
router.get('/', async (req, res) => {
    try {
        // Return an empty array — roles can be expanded later
        res.json([]);
    } catch (error) {
        console.error('Roles fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
