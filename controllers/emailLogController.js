const EmailLog = require('../models/EmailLog');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle Email Logs retrieval.
 */
class EmailLogController {
    /**
     * Get all email logs with pagination.
     */
    async getAllLogs(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 25;
            const skip = (page - 1) * limit;
            const { type, search } = req.query;

            let query = {};
            if (search) {
                query.$or = [
                    { recipient: { $regex: search, $options: 'i' } },
                    { subject: { $regex: search, $options: 'i' } },
                    { name: { $regex: search, $options: 'i' } },
                    { message: { $regex: search, $options: 'i' } }
                ];
            }

            if (type === 'admin') {
                query.subject = { $regex: /CONTACT ENQUIRY|NEW SPEAKER NOMINATION|NEW VISITOR LEAD|NEW EXHIBITOR REGISTRATION/i };
            } else if (type === 'user') {
                query.$or = [
                    { subject: { $regex: /RECEIVED YOUR MESSAGE|REGISTRATION CONFIRMED|WELCOME TO IHWE/i } },
                    { subject: { $regex: /REGISTRATION FORM|OFFICIAL PAYMENT RECEIPT|REGISTRATION APPROVED|BOOKING CONFIRMED/i } }
                ];
            }

            const total = await EmailLog.countDocuments(query);
            const logs = await EmailLog.find(query)
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
            console.error('Error fetching email logs:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch email logs'
            });
        }
    }

    /**
     * Delete an email log entry.
     */
    async deleteLog(req, res) {
        try {
            const { id } = req.params;
            const deletedLog = await EmailLog.findByIdAndDelete(id);
            if (!deletedLog) {
                return res.status(404).json({ success: false, message: 'Log not found' });
            }
            await logActivity(req, 'Deleted', 'Email Logs', `Deleted email log ID: ${id}`);
            res.status(200).json({ success: true, message: 'Log deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to delete log' });
        }
    }
}

module.exports = new EmailLogController();
