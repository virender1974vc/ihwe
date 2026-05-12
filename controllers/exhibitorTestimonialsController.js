const exhibitorTestimonialsService = require('../services/exhibitorTestimonialsService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle Exhibitor Testimonials section requests.
 */
class ExhibitorTestimonialsController {
    /**
     * Get all exhibitor testimonials.
     */
    async getExhibitorTestimonials(req, res) {
        try {
            const data = await exhibitorTestimonialsService.getExhibitorTestimonials();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch exhibitor testimonials error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update section headings.
     */
    async updateHeadings(req, res) {
        try {
            const data = await exhibitorTestimonialsService.updateHeadings(req.body, req.user?.username);
            await logActivity(req, 'Updated', 'Exhibitor Testimonials', 'Updated section headings');
            res.json({ success: true, data, message: 'Headings updated successfully' });
        } catch (error) {
            console.error('Update headings error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Add a testimonial card.
     */
    async addCard(req, res) {
        try {
            const data = await exhibitorTestimonialsService.addCard(req.body, req.user?.username);
            await logActivity(req, 'Created', 'Exhibitor Testimonials', `Added new testimonial from: ${req.body.companyName1}`);
            res.json({ success: true, data, message: 'Testimonial added successfully' });
        } catch (error) {
            console.error('Add card error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update a testimonial card.
     */
    async updateCard(req, res) {
        try {
            const data = await exhibitorTestimonialsService.updateCard(req.params.cardId, req.body, req.user?.username);
            await logActivity(req, 'Updated', 'Exhibitor Testimonials', `Updated testimonial: ${req.body.companyName1 || 'ID: ' + req.params.cardId}`);
            res.json({ success: true, data, message: 'Testimonial updated successfully' });
        } catch (error) {
            console.error('Update card error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }

    /**
     * Delete a testimonial card.
     */
    async deleteCard(req, res) {
        try {
            await exhibitorTestimonialsService.deleteCard(req.params.cardId, req.user?.username);
            await logActivity(req, 'Deleted', 'Exhibitor Testimonials', `Deleted testimonial ID: ${req.params.cardId}`);
            res.json({ success: true, message: 'Testimonial deleted successfully' });
        } catch (error) {
            console.error('Delete card error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }

    /**
     * Handle image upload.
     */
    async uploadImage(req, res) {
        try {
            if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
            const imageUrl = `/uploads/exhibitor-testimonials/${req.file.filename}`;
            res.json({ success: true, imageUrl, message: 'Image uploaded successfully' });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new ExhibitorTestimonialsController();
