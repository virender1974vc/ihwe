const heroBackgroundService = require('../services/heroBackgroundService');

/**
 * Controller to handle Hero Background requests.
 */
class HeroBackgroundController {
    /**
     * Get all hero backgrounds.
     */
    async getAllHeroBackgrounds(req, res) {
        try {
            const data = await heroBackgroundService.getAllHeroBackgrounds();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch hero-background error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Get hero background by ID.
     */
    async getHeroBackgroundById(req, res) {
        try {
            const data = await heroBackgroundService.getHeroBackgroundById(req.params.id);
            res.json({ success: true, data });
        } catch (error) {
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }

    /**
     * Create hero background.
     */
    async createHeroBackground(req, res) {
        try {
            const { pageName, imageAltText, title, heading, shortDescription, status } = req.body;
            
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Please upload a background image' });
            }

            const heroData = {
                pageName,
                backgroundImage: `/uploads/hero-bg/${req.file.filename}`,
                imageAltText,
                title,
                heading,
                shortDescription,
                status: status || 'Active'
            };

            const data = await heroBackgroundService.createHeroBackground(heroData);
            res.status(201).json({ success: true, data, message: 'Hero background created successfully' });
        } catch (error) {
            console.error('Create hero-background error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update hero background.
     */
    async updateHeroBackground(req, res) {
        try {
            const { pageName, imageAltText, title, heading, shortDescription, status } = req.body;
            const updateData = { pageName, imageAltText, title, heading, shortDescription, status };

            if (req.file) {
                updateData.backgroundImage = `/uploads/hero-bg/${req.file.filename}`;
            }

            const data = await heroBackgroundService.updateHeroBackground(req.params.id, updateData);
            res.json({ success: true, data, message: 'Hero background updated successfully' });
        } catch (error) {
            console.error('Update hero-background error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }

    /**
     * Delete hero background.
     */
    async deleteHeroBackground(req, res) {
        try {
            await heroBackgroundService.deleteHeroBackground(req.params.id);
            res.json({ success: true, message: 'Hero background deleted successfully' });
        } catch (error) {
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }
}

module.exports = new HeroBackgroundController();
