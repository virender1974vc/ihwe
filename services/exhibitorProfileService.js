const ExhibitorProfile = require('../models/ExhibitorProfile');

/**
 * Service to handle Exhibitor Profile operations.
 */
class ExhibitorProfileService {
    /**
     * Get profile, creates default if none exists.
     */
    async getProfile() {
        let profile = await ExhibitorProfile.findOne();
        if (!profile) {
            profile = new ExhibitorProfile();
            await profile.save();
        }
        return profile;
    }

    /**
     * Update metadata.
     */
    async updateMeta(data) {
        const { subheading, heading, eventDate, eventDay, venueHall, venueCity } = data;
        const profile = await this.getProfile();
        if (subheading !== undefined) profile.subheading = subheading;
        if (heading !== undefined) profile.heading = heading;
        if (eventDate !== undefined) profile.eventDate = eventDate;
        if (eventDay !== undefined) profile.eventDay = eventDay;
        if (venueHall !== undefined) profile.venueHall = venueHall;
        if (venueCity !== undefined) profile.venueCity = venueCity;
        return await profile.save();
    }

    /**
     * Add profile segment.
     */
    async addSegment(data) {
        const { title, accent } = data;
        const profile = await this.getProfile();
        profile.segments.push({ title, accent });
        return await profile.save();
    }

    /**
     * Delete profile segment.
     */
    async deleteSegment(segmentId) {
        const profile = await this.getProfile();
        profile.segments = profile.segments.filter(s => s._id.toString() !== segmentId);
        return await profile.save();
    }

    /**
     * Update profile segment.
     */
    async updateSegment(segmentId, data) {
        const { title, accent } = data;
        const profile = await this.getProfile();
        const segment = profile.segments.id(segmentId);
        if (!segment) throw { status: 404, message: 'Segment not found' };
        if (title !== undefined) segment.title = title;
        if (accent !== undefined) segment.accent = accent;
        return await profile.save();
    }

    /**
     * Add product category.
     */
    async addCategory(data) {
        const { title } = data;
        const profile = await this.getProfile();
        profile.productCategories.push({ title });
        return await profile.save();
    }

    /**
     * Delete product category.
     */
    async deleteCategory(categoryId) {
        const profile = await this.getProfile();
        profile.productCategories = profile.productCategories.filter(c => c._id.toString() !== categoryId);
        return await profile.save();
    }

    /**
     * Update product category.
     */
    async updateCategory(categoryId, data) {
        const { title } = data;
        const profile = await this.getProfile();
        const category = profile.productCategories.id(categoryId);
        if (!category) throw { status: 404, message: 'Category not found' };
        if (title !== undefined) category.title = title;
        return await profile.save();
    }
}

module.exports = new ExhibitorProfileService();
