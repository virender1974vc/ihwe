const conferenceTestimonialsService = require('../services/conferenceTestimonialsService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle Conference Testimonials requests.
 */
class ConferenceTestimonialsController {
    /**
     * Get all testimonials data.
     */
    async getTestimonials(req, res) {
        try {
            const data = await conferenceTestimonialsService.getTestimonials();
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
            const data = await conferenceTestimonialsService.updateHeadings(req.body);
            await logActivity(req, 'Updated', 'Conference Testimonials', 'Updated conference testimonials section headings');
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
            const cardData = { ...req.body };
            if (req.file) {
                cardData.image = `/uploads/conference-testimonials/${req.file.filename}`;
            }
            const data = await conferenceTestimonialsService.addCard(cardData);
            await logActivity(req, 'Created', 'Conference Testimonials', `Added new conference testimonial: ${req.body.name || 'Untitled'}`);
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
            const cardData = { ...req.body };
            if (req.file) {
                cardData.image = `/uploads/conference-testimonials/${req.file.filename}`;
            }
            const data = await conferenceTestimonialsService.updateCard(req.params.id, cardData);
            await logActivity(req, 'Updated', 'Conference Testimonials', `Updated conference testimonial: ${req.body.name || 'ID: ' + req.params.id}`);
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
            const data = await conferenceTestimonialsService.deleteCard(req.params.id);
            await logActivity(req, 'Deleted', 'Conference Testimonials', `Deleted conference testimonial ID: ${req.params.id}`);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new ConferenceTestimonialsController();
