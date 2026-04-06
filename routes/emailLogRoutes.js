const express = require('express');
const router = express.Router();
const emailLogController = require('../controllers/emailLogController');
const { verifyToken } = require('../utils/verifyToken');

/**
 * @route GET /api/email-logs
 * @desc Get all email logs with pagination
 * @access Private/Admin
 */
router.get('/', verifyToken, emailLogController.getAllLogs.bind(emailLogController));

/**
 * @route DELETE /api/email-logs/:id
 * @desc Delete an email log entry
 * @access Private/Admin
 */
router.delete('/:id', verifyToken, emailLogController.deleteLog.bind(emailLogController));

module.exports = router;
