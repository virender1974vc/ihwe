const WhatsAppLog = require('../models/WhatsAppLog');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle WhatsApp Logs retrieval.
 */
class WhatsAppLogController {
    /**
     * Get all WhatsApp logs with pagination.
     */
    async getAllLogs(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 25;
            const skip = (page - 1) * limit;
            const { search, status, type } = req.query;

            let query = {};
            if (search) {
                query.$or = [
                    { recipient: { $regex: search, $options: 'i' } },
                    { name: { $regex: search, $options: 'i' } },
                    { message: { $regex: search, $options: 'i' } }
                ];
            }
            if (status) {
                query.status = status;
            }

            if (type === 'admin') {
                query.message = { $regex: /NEW CONTACT ENQUIRY/i };
            } else if (type === 'otp') {
                query.message = { $regex: /OTP/i };
            } else if (type === 'user') {
                // messages with "Thank you" but NOT containing "OTP"
                query.message = { $regex: /Thank you/i, $not: /OTP/i };
            }

            const total = await WhatsAppLog.countDocuments(query);
            const logs = await WhatsAppLog.find(query)
                .sort({ sentAt: -1 })
                .skip(skip)
                .limit(limit);

            res.status(200).json({
                success: true,
                count: logs.length,
                total,
                data: logs
            });
        } catch (error) {
            console.error('Error fetching WhatsApp logs:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch WhatsApp logs'
            });
        }
    }

    /**
     * Delete a WhatsApp log entry.
     */
    async deleteLog(req, res) {
        try {
            const { id } = req.params;
            const deletedLog = await WhatsAppLog.findByIdAndDelete(id);
            if (!deletedLog) {
                return res.status(404).json({ success: false, message: 'Log not found' });
            }
            await logActivity(req, 'Deleted', 'WhatsApp Logs', `Deleted WhatsApp log ID: ${id}`);
            res.status(200).json({ success: true, message: 'Log deleted successfully' });
        } catch (error) {
            console.error('Error deleting WhatsApp log:', error);
            res.status(500).json({ success: false, message: 'Failed to delete log' });
        }
    }
}

module.exports = new WhatsAppLogController();
