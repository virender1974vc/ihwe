const testimonialsService = require('../services/testimonialsService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle Testimonials requests.
 */
class TestimonialsController {
    /**
     * Get all testimonials data.
     */
    async getTestimonials(req, res) {
        try {
            const data = await testimonialsService.getTestimonials();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update headings.
     */
    async updateHeadings(req, res) {
        try {
            const data = await testimonialsService.updateHeadings(req.body);
            await logActivity(req, 'Updated', 'Testimonials', 'Updated testimonials section headings');
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Add a new card.
     */
    async addCard(req, res) {
        try {
            const data = await testimonialsService.addCard(req.body);
            await logActivity(req, 'Created', 'Testimonials', `Added new testimonial: ${req.body.name || 'Untitled'}`);
            res.status(201).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update a card.
     */
    async updateCard(req, res) {
        try {
            const data = await testimonialsService.updateCard(req.params.id, req.body);
            await logActivity(req, 'Updated', 'Testimonials', `Updated testimonial: ${req.body.name || 'ID: ' + req.params.id}`);
            res.json({ success: true, data });
        } catch (error) {
            res.status(error.status || 500).json({ success: false, message: error.message });
        }
    }

    /**
     * Delete a card.
     */
    async deleteCard(req, res) {
        try {
            const data = await testimonialsService.deleteCard(req.params.id);
            await logActivity(req, 'Deleted', 'Testimonials', `Deleted testimonial ID: ${req.params.id}`);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new TestimonialsController();
