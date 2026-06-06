const express = require('express');
const router = express.Router();
const userTargetController = require('../controllers/userTargetController');
const { authToken } = require('../middlewares/authToken');

router.get('/', authToken, userTargetController.getAllTargets);
router.get('/stats/dashboard', authToken, userTargetController.getDashboardStats);
router.get('/logs/recent', authToken, userTargetController.getRecentLogs);
router.get('/logs/table', authToken, userTargetController.getTableLogs);
router.get('/:username', authToken, userTargetController.getTargetByUsername);
router.post('/', authToken, userTargetController.createOrUpdateTarget);
router.delete('/:id', authToken, userTargetController.deleteTarget);

module.exports = router;
