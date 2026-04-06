const faqService = require('../services/faqService');
const { logActivity } = require('../utils/logger');


class FAQController {
    async getFAQ(req, res) {
        try {
            const data = await faqService.getFAQ();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch FAQ error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    async updateHeadings(req, res) {
        try {
            const data = await faqService.updateHeadings(req.body, req.user?.username);
            await logActivity(req, 'Updated', 'FAQ Management', 'Updated section headings');
            res.json({ success: true, data, message: 'Headings updated successfully' });
        } catch (error) {

            console.error('Update headings error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    async addItem(req, res) {
        try {
            const data = await faqService.addItem(req.body, req.user?.username);
            await logActivity(req, 'Created', 'FAQ Management', `Added new FAQ question: ${req.body.question}`);
            res.json({ success: true, data, message: 'FAQ item added successfully' });
        } catch (error) {

            console.error('Add FAQ item error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    async updateItem(req, res) {
        try {
            const data = await faqService.updateItem(req.params.itemId, req.body, req.user?.username);
            await logActivity(req, 'Updated', 'FAQ Management', `Updated FAQ question: ${req.body.question}`);
            res.json({ success: true, data, message: 'FAQ item updated successfully' });
        } catch (error) {

            console.error('Update FAQ item error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }

    async deleteItem(req, res) {
        try {
            await faqService.deleteItem(req.params.itemId, req.user?.username);
            await logActivity(req, 'Deleted', 'FAQ Management', `Deleted FAQ item ID: ${req.params.itemId}`);
            res.json({ success: true, message: 'FAQ item deleted successfully' });
        } catch (error) {

            console.error('Delete FAQ item error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }

    async uploadImage(req, res) {
        try {
            if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
            const imageUrl = `/uploads/faq/${req.file.filename}`;
            res.json({ success: true, imageUrl, message: 'Image uploaded successfully' });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new FAQController();
