const express = require('express');
const router = express.Router();
const whatsAppLogController = require('../controllers/whatsAppLogController');
const { verifyToken } = require('../utils/verifyToken');

// @route   GET /api/whatsapp-logs
// @desc    Get all WhatsApp logs with pagination
// @access  Private
router.get('/', verifyToken, whatsAppLogController.getAllLogs.bind(whatsAppLogController));

// @route   DELETE /api/whatsapp-logs/:id
// @desc    Delete a WhatsApp log entry
// @access  Private
router.delete('/:id', verifyToken, whatsAppLogController.deleteLog.bind(whatsAppLogController));

module.exports = router;
