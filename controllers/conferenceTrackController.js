const conferenceTrackService = require('../services/conferenceTrackService');
const { logActivity } = require('../utils/logger');

class ConferenceTrackController {
    async getAll(req, res) {
        try {
            const data = await conferenceTrackService.getAll();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async create(req, res) {
        try {
            const trackData = { ...req.body };
            if (req.file) {
                trackData.image = `/uploads/conference-tracks/${req.file.filename}`;
            }
            if (trackData.sessions && typeof trackData.sessions === 'string') {
                trackData.sessions = JSON.parse(trackData.sessions);
            }
            const data = await conferenceTrackService.create(trackData);
            await logActivity(req, 'Created', 'Conference Track', `Created track: ${data.title}`);
            res.status(201).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async update(req, res) {
        try {
            const trackData = { ...req.body };
            if (req.file) {
                trackData.image = `/uploads/conference-tracks/${req.file.filename}`;
            }
            if (trackData.sessions && typeof trackData.sessions === 'string') {
                trackData.sessions = JSON.parse(trackData.sessions);
            }
            const data = await conferenceTrackService.update(req.params.id, trackData);
            await logActivity(req, 'Updated', 'Conference Track', `Updated track: ${data.title}`);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async delete(req, res) {
        try {
            const data = await conferenceTrackService.delete(req.params.id);
            await logActivity(req, 'Deleted', 'Conference Track', `Deleted track: ${req.params.id}`);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateOrder(req, res) {
        try {
            await conferenceTrackService.updateOrder(req.body.orders);
            res.json({ success: true, message: 'Order updated successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new ConferenceTrackController();
