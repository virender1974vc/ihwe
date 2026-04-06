const downloadPdfService = require('../services/downloadPdfService');
const { logActivity } = require('../utils/logger');


/**
 * Controller to handle Download PDF requests.
 */
class DownloadPdfController {
    /**
     * Get resources section data.
     */
    async getResourcesData(req, res) {
        try {
            const data = await downloadPdfService.getResourcesData();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch download-pdf error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update headings.
     */
    async updateHeadings(req, res) {
        try {
            const data = await downloadPdfService.updateHeadings(req.body, req.user?.username);
            await logActivity(req, 'Updated', 'PDF Resources', 'Updated section headings');
            res.json({ success: true, data, message: 'Headings updated successfully' });
        } catch (error) {

            console.error('Update headings error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Add card.
     */
    async addCard(req, res) {
        try {
            const data = await downloadPdfService.addCard(req.body, req.user?.username);
            await logActivity(req, 'Created', 'PDF Resources', `Added new PDF: ${req.body.title}`);
            res.json({ success: true, data, message: 'Card added successfully' });
        } catch (error) {

            console.error('Add card error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update card.
     */
    async updateCard(req, res) {
        try {
            const data = await downloadPdfService.updateCard(req.params.id, req.body, req.user?.username);
            await logActivity(req, 'Updated', 'PDF Resources', `Updated PDF: ${req.body.title || 'ID: ' + req.params.id}`);
            res.json({ success: true, data, message: 'Card updated successfully' });
        } catch (error) {

            console.error('Update card error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }

    /**
     * Delete card.
     */
    async deleteCard(req, res) {
        try {
            await downloadPdfService.deleteCard(req.params.id, req.user?.username);
            await logActivity(req, 'Deleted', 'PDF Resources', `Deleted PDF card ID: ${req.params.id}`);
            res.json({ success: true, message: 'Card deleted successfully' });
        } catch (error) {

            console.error('Delete card error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }

    /**
     * Upload image.
     */
    async uploadImage(req, res) {
        if (!req.file) return res.status(400).json({ success: false, message: 'Please upload an image' });
        const imagePath = `/uploads/downloads/images/${req.file.filename}`;
        res.json({ success: true, url: imagePath, message: 'Image uploaded successfully' });
    }

    /**
     * Upload PDF.
     */
    async uploadPdf(req, res) {
        if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a PDF' });
        const pdfPath = `/uploads/downloads/pdf/${req.file.filename}`;
        res.json({ success: true, url: pdfPath, message: 'PDF uploaded successfully' });
    }
}

module.exports = new DownloadPdfController();
