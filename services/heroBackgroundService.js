const HeroBackground = require('../models/HeroBackground');

/**
 * Service to handle Hero Background operations.
 */
class HeroBackgroundService {
    /**
     * Get all hero backgrounds.
     */
    async getAllHeroBackgrounds() {
        return await HeroBackground.find().sort({ createdAt: -1 });
    }

    /**
     * Get hero background by ID.
     */
    async getHeroBackgroundById(id) {
        const data = await HeroBackground.findById(id);
        if (!data) throw { status: 404, message: 'Not found' };
        return data;
    }

    /**
     * Create hero background.
     */
    async createHeroBackground(data) {
        const newHero = new HeroBackground(data);
        return await newHero.save();
    }

    /**
     * Update hero background.
     */
    async updateHeroBackground(id, data) {
        const updated = await HeroBackground.findByIdAndUpdate(id, data, { new: true });
        if (!updated) throw { status: 404, message: 'Not found' };
        return updated;
    }

    /**
     * Delete hero background.
     */
    async deleteHeroBackground(id) {
        const data = await HeroBackground.findByIdAndDelete(id);
        if (!data) throw { status: 404, message: 'Not found' };
        return data;
    }
}

module.exports = new HeroBackgroundService();
