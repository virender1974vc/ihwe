const testimonialsService = require('../services/testimonialsService');

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
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new TestimonialsController();
