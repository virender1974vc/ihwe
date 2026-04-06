const heroService = require('../services/heroService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle Hero slide requests.
 */
class HeroController {
    /**
     * Get all hero slides.
     */
    async getAllSlides(req, res) {
        try {
            const data = await heroService.getAllSlides();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch hero slides error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Create a new hero slide.
     */
    async createSlide(req, res) {
        try {
            const { subtitle, title, description, altText, button1Name, button1Url, button2Name, button2Url, isActive, schedule } = req.body;

            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Please upload an image' });
            }

            const slideData = {
                image: `/uploads/hero/${req.file.filename}`,
                subtitle,
                title,
                description,
                altText,
                button1Name,
                button1Url,
                button2Name,
                button2Url,
                isActive: isActive === 'true' || isActive === true,
                schedule: schedule ? JSON.parse(schedule) : undefined
            };

            const data = await heroService.createSlide(slideData);
            await logActivity(req, 'Created', 'Home Slider', `Added new hero slide: ${title}`);
            res.status(201).json({ success: true, data });
        } catch (error) {
            console.error('Create hero slide error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update a hero slide.
     */
    async updateSlide(req, res) {
        try {
            const { subtitle, title, description, altText, button1Name, button1Url, button2Name, button2Url, isActive, schedule } = req.body;

            let updateData = {
                subtitle,
                title,
                description,
                altText,
                button1Name,
                button1Url,
                button2Name,
                button2Url,
                isActive: isActive === 'true' || isActive === true,
                schedule: schedule ? JSON.parse(schedule) : undefined
            };

            if (req.file) {
                updateData.image = `/uploads/hero/${req.file.filename}`;
            }

            const data = await heroService.updateSlide(req.params.id, updateData);
            await logActivity(req, 'Updated', 'Home Slider', `Updated hero slide: ${title || 'ID: ' + req.params.id}`);
            res.json({ success: true, data });
        } catch (error) {
            console.error('Update hero slide error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }

    /**
     * Delete a hero slide.
     */
    async deleteSlide(req, res) {
        try {
            await heroService.deleteSlide(req.params.id);
            await logActivity(req, 'Deleted', 'Home Slider', `Deleted hero slide ID: ${req.params.id}`);
            res.json({ success: true, message: 'Slide deleted successfully' });
        } catch (error) {
            console.error('Delete hero slide error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }
}

module.exports = new HeroController();
