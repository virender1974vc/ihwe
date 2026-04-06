const eventHighlightsService = require('../services/eventHighlightsService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle Event Highlights requests.
 */
class EventHighlightsController {
    /**
     * Get event highlights data.
     */
    async getContent(req, res) {
        try {
            const data = await eventHighlightsService.getContent();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch event highlights error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update event highlights text data.
     */
    async updateContent(req, res) {
        try {
            const data = await eventHighlightsService.updateContent(req.body);
            await logActivity(req, 'Updated', 'Event Highlights', 'Updated event highlights content');
            res.json({ success: true, data, message: 'Event highlights updated successfully' });
        } catch (error) {
            console.error('Update event highlights error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Upload event highlight image.
     */
    async uploadImage(req, res) {
        try {
            if (!req.file) return res.status(400).json({ success: false, message: 'Please upload an image' });
            const imagePath = `/uploads/event-highlights/${req.file.filename}`;
            const data = await eventHighlightsService.updateImage(imagePath);
            await logActivity(req, 'Updated', 'Event Highlights', 'Updated event highlights image');
            res.json({ success: true, imagePath, message: 'Image uploaded successfully' });
        } catch (error) {
            console.error('Upload image error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Upload brochure PDF.
     */
    async uploadPdf(req, res) {
        try {
            if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a PDF' });
            const pdfPath = `/uploads/event-highlights/pdf/${req.file.filename}`;
            const data = await eventHighlightsService.updatePdf(pdfPath);
            res.json({ success: true, pdfPath, message: 'PDF uploaded successfully' });
        } catch (error) {
            console.error('Upload PDF error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new EventHighlightsController();
