const Hero = require('../models/Hero');

/**
 * Service to handle Hero slide operations.
 */
class HeroService {
    /**
     * Get all hero slides.
     */
    async getAllSlides() {
        return await Hero.find().sort({ order: 1, createdAt: 1 });
    }

    /**
     * Create a new hero slide.
     */
    async createSlide(data) {
        const newSlide = new Hero(data);
        return await newSlide.save();
    }

    /**
     * Update a hero slide.
     */
    async updateSlide(id, data) {
        const updatedSlide = await Hero.findByIdAndUpdate(id, data, { new: true });
        if (!updatedSlide) throw { status: 404, message: 'Slide not found' };
        return updatedSlide;
    }

    /**
     * Delete a hero slide.
     */
    async deleteSlide(id) {
        const slide = await Hero.findByIdAndDelete(id);
        if (!slide) throw { status: 404, message: 'Slide not found' };
        return slide;
    }
}

module.exports = new HeroService();
