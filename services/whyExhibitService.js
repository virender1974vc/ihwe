const WhyExhibit = require('../models/WhyExhibit');

/**
 * Service to handle Why Exhibit section operations.
 */
class WhyExhibitService {
    /**
     * Get content, creates default if none exists.
     */
    async getContent() {
        let content = await WhyExhibit.findOne();
        if (!content) {
            content = await WhyExhibit.create({
                subheading: 'Empower Your Business',
                heading: 'Drive Growth & Innovation',
                highlightText: 'Growth & Innovation',
                shortDescription: 'Join IHWE 2026 to connect with global innovators and access new market opportunities through our specialized exhibitor platforms and elite networking events.',
                benefits: []
            });
        }
        return content;
    }

    /**
     * Update Headings.
     */
    async updateHeadings(data) {
        return await WhyExhibit.findOneAndUpdate(
            {},
            { ...data, lastUpdated: Date.now() },
            { upsert: true, new: true }
        );
    }

    /**
     * Add a Benefit.
     */
    async addBenefit(benefitData) {
        return await WhyExhibit.findOneAndUpdate(
            {},
            { $push: { benefits: benefitData }, lastUpdated: Date.now() },
            { upsert: true, new: true }
        );
    }

    /**
     * Update a Benefit.
     */
    async updateBenefit(benefitId, benefitData) {
        const content = await WhyExhibit.findOne();
        if (!content) throw { status: 404, message: 'Content not found' };
        
        const benefit = content.benefits.id(benefitId);
        if (!benefit) throw { status: 404, message: 'Benefit not found' };
        
        if (benefitData.title !== undefined) benefit.title = benefitData.title;
        if (benefitData.description !== undefined) benefit.description = benefitData.description;
        if (benefitData.buttonName !== undefined) benefit.buttonName = benefitData.buttonName;
        if (benefitData.buttonLink !== undefined) benefit.buttonLink = benefitData.buttonLink;
        if (benefitData.imageAlt !== undefined) benefit.imageAlt = benefitData.imageAlt;
        if (benefitData.accent !== undefined) benefit.accent = benefitData.accent;
        if (benefitData.icon !== undefined) benefit.icon = benefitData.icon;
        if (benefitData.image !== undefined) benefit.image = benefitData.image;
        
        content.lastUpdated = Date.now();
        return await content.save();
    }

    /**
     * Delete a Benefit.
     */
    async deleteBenefit(benefitId) {
        return await WhyExhibit.findOneAndUpdate(
            {},
            { $pull: { benefits: { _id: benefitId } }, lastUpdated: Date.now() },
            { new: true }
        );
    }

    /**
     * Update CTA Section.
     */
    async updateCTA(ctaData) {
        return await WhyExhibit.findOneAndUpdate(
            {},
            { ...ctaData, lastUpdated: Date.now() },
            { upsert: true, new: true }
        );
    }
}

module.exports = new WhyExhibitService();
