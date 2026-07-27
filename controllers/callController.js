const cloudinary = require('cloudinary').v2;
const CallLog = require('../models/CallLog');
const Company = require('../models/Company');
const { logActivity } = require('../utils/logger');
const { resolveEventIdForCompany } = require('../utils/whatsapp');

// 1. Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Handle call recording audio upload & database log logging.
 */
const uploadCallLog = async (req, res) => {
    try {
        const {
            callerId,
            callerName,
            companyId,
            companyName,
            clientName,
            mobile,
            duration,
            companyStatus,
            newStatus,
            notes
        } = req.body;

        if (!callerId || !callerName || !companyId || !companyName || !clientName || !mobile) {
            return res.status(400).json({ success: false, message: 'Missing required calling parameters.' });
        }

        let recordingUrl = '';

        // Check if audio file was uploaded
        if (req.file) {
            try {
                // Upload audio buffer to Cloudinary (audio is treated as video resource type in Cloudinary)
                const result = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        {
                            resource_type: 'video',
                            folder: 'call-recordings',
                            format: 'webm'
                        },
                        (error, uploadResult) => {
                            if (error) reject(error);
                            else resolve(uploadResult);
                        }
                    );
                    stream.end(req.file.buffer);
                });
                recordingUrl = result.secure_url;
            } catch (cloudErr) {
                console.error('Cloudinary Upload Failed, falling back to empty URL:', cloudErr.message);
            }
        }

        // Save CallLog record
        const eventId = await resolveEventIdForCompany(companyId);
        const callLog = await CallLog.create({
            callerId,
            callerName,
            companyId,
            companyName,
            clientName,
            mobile,
            duration: Number(duration || 0),
            recordingUrl,
            companyStatus: newStatus || companyStatus || 'New Lead',
            notes: notes || '',
            eventId
        });

        // Update Client/Company status if a new one is selected
        if (newStatus && newStatus !== companyStatus) {
            await Company.findByIdAndUpdate(companyId, { companyStatus: newStatus });
        }

        // Setup user context fallback for logger
        if (!req.user) {
            req.user = { id: callerId, username: callerName };
        }

        // Create Dashboard Activity Log using core logger utility
        await logActivity(req, 'Called Client', 'Calling System', `Called ${clientName} (${companyName}) - Duration: ${duration}s, Status: ${newStatus || companyStatus}`);

        res.status(201).json({ success: true, data: callLog });
    } catch (err) {
        console.error('Error saving call log:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Retrieve call logs history with role filtering.
 */
const getCallHistory = async (req, res) => {
    try {
        const adminUsername = req.query.adminUsername || '';
        const adminRole = req.query.adminRole?.toLowerCase().replace(/\s+/g, '-') || '';
        const isSuperAdmin = adminRole === 'IHWE–Super Administrator';
        const { eventId } = req.query;

        let filter = {};
        // Regular RMs only see their own calls, Super Admin sees all calls
        if (!isSuperAdmin && adminUsername) {
            filter = { callerName: { $regex: new RegExp(`^${adminUsername.trim()}$`, 'i') } };
        }
        // Scope to a single event when one is selected (multi-event support).
        if (eventId) {
            filter.eventId = eventId;
        }

        const logs = await CallLog.find(filter)
            .sort({ callDate: -1 });

        res.json({ success: true, data: logs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    uploadCallLog,
    getCallHistory
};
