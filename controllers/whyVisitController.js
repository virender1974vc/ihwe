const whyVisitService = require('../services/whyVisitService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle Why Visit section requests.
 */
class WhyVisitController {
    /**
     * Get Why Visit content.
     */
    async getContent(req, res) {
        try {
            const data = await whyVisitService.getContent();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch why visit error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update section headings.
     */
    async updateHeadings(req, res) {
        try {
            const data = await whyVisitService.updateHeadings(req.body);
            await logActivity(req, 'Updated', 'Why Visit', 'Updated why visit section headings');
            res.json({ success: true, data, message: 'Headings updated' });
        } catch (error) {
            console.error('Update headings error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Add a reason card.
     */
    async addReason(req, res) {
        try {
            const data = await whyVisitService.addReason(req.body);
            await logActivity(req, 'Created', 'Why Visit', `Added new reason: ${req.body.title || 'Untitled'}`);
            res.json({ success: true, data, message: 'Reason card added' });
        } catch (error) {
            console.error('Add reason card error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update a reason card.
     */
    async updateReason(req, res) {
        try {
            const data = await whyVisitService.updateReason(req.params.reasonId, req.body);
            await logActivity(req, 'Updated', 'Why Visit', `Updated reason: ${req.body.title || 'ID: ' + req.params.reasonId}`);
            res.json({ success: true, data, message: 'Reason updated' });
        } catch (error) {
            console.error('Update reason error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }

    /**
     * Delete a reason card.
     */
    async deleteReason(req, res) {
        try {
            await whyVisitService.deleteReason(req.params.reasonId);
            await logActivity(req, 'Deleted', 'Why Visit', `Deleted reason ID: ${req.params.reasonId}`);
            res.json({ success: true, message: 'Reason deleted' });
        } catch (error) {
            console.error('Delete reason error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }

    /**
     * Handle image upload.
     */
    async uploadImage(req, res) {
        try {
            if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
            const imageUrl = `/uploads/why-visit/${req.file.filename}`;
            res.json({ success: true, imageUrl, message: 'Image uploaded' });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new WhyVisitController();
