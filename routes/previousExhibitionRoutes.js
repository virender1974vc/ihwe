const express = require('express');
const controller = require('../controllers/previousExhibitionController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/public', controller.getPublic);
router.get('/', authMiddleware, adminMiddleware, controller.getAll);
router.post('/', authMiddleware, adminMiddleware, controller.create);
router.put('/:id', authMiddleware, adminMiddleware, controller.update);
router.delete('/:id', authMiddleware, adminMiddleware, controller.remove);

module.exports = router;
