const WhyVisit = require('../models/WhyVisit');

/**
 * Service to handle Why Visit section operations.
 */
class WhyVisitService {
    /**
     * Get content, creates default if none exists.
     */
    async getContent() {
        let data = await WhyVisit.findOne();
        if (!data) {
            data = await new WhyVisit({}).save();
        }
        return data;
    }

    /**
     * Update section headings.
     */
    async updateHeadings(updateData) {
        const { subheading, heading, highlightText, shortDescription } = updateData;
        let data = await WhyVisit.findOne();
        if (!data) {
            data = new WhyVisit({ subheading, heading, highlightText, shortDescription });
        } else {
            if (subheading !== undefined) data.subheading = subheading;
            if (heading !== undefined) data.heading = heading;
            if (highlightText !== undefined) data.highlightText = highlightText;
            if (shortDescription !== undefined) data.shortDescription = shortDescription;
            data.lastUpdated = Date.now();
        }
        return await data.save();
    }

    /**
     * Add a reason card.
     */
    async addReason(reasonData) {
        const { title, description, icon, image, imageAlt, accent, buttonName, buttonLink } = reasonData;
        let data = await this.getContent();
        data.reasons.push({ title, description, icon, image, imageAlt, accent, buttonName, buttonLink });
        data.lastUpdated = Date.now();
        return await data.save();
    }

    /**
     * Update a reason card.
     */
    async updateReason(reasonId, reasonData) {
        const { title, description, icon, image, imageAlt, accent, buttonName, buttonLink } = reasonData;
        const data = await WhyVisit.findOne();
        if (!data) throw { status: 404, message: 'Not found' };
        
        const reason = data.reasons.id(reasonId);
        if (!reason) throw { status: 404, message: 'Reason not found' };
        
        if (title !== undefined) reason.title = title;
        if (description !== undefined) reason.description = description;
        if (icon !== undefined) reason.icon = icon;
        if (image !== undefined) reason.image = image;
        if (imageAlt !== undefined) reason.imageAlt = imageAlt;
        if (accent !== undefined) reason.accent = accent;
        if (buttonName !== undefined) reason.buttonName = buttonName;
        if (buttonLink !== undefined) reason.buttonLink = buttonLink;
        
        data.lastUpdated = Date.now();
        return await data.save();
    }

    /**
     * Delete a reason card.
     */
    async deleteReason(reasonId) {
        const data = await WhyVisit.findOne();
        if (!data) throw { status: 404, message: 'Not found' };
        data.reasons = data.reasons.filter(r => r._id.toString() !== reasonId);
        data.lastUpdated = Date.now();
        return await data.save();
    }
}

module.exports = new WhyVisitService();
