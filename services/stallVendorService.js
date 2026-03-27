const StallVendor = require('../models/StallVendor');

/**
 * Service to handle Stall Vendor operations.
 */
class StallVendorService {
    /**
     * Get all content.
     */
    async getContent() {
        let content = await StallVendor.findOne();
        if (!content) {
            content = await StallVendor.create({});
        }
        return content;
    }

    /**
     * Update headings.
     */
    async updateHeadings(data) {
        const { subheading, heading, highlightText, description } = data;
        let content = await StallVendor.findOne();
        if (!content) {
            content = new StallVendor();
        }
        content.subheading = subheading;
        content.heading = heading;
        content.highlightText = highlightText;
        content.description = description;
        content.updatedAt = Date.now();
        return await content.save();
    }

    /**
     * Add card.
     */
    async addCard(cardData) {
        let content = await StallVendor.findOne();
        if (!content) {
            content = new StallVendor();
        }
        content.cards.push(cardData);
        content.updatedAt = Date.now();
        await content.save();
        return content.cards[content.cards.length - 1];
    }

    /**
     * Update card.
     */
    async updateCard(cardId, updateData) {
        const content = await StallVendor.findOne();
        if (!content) throw { status: 404, message: 'Content not found' };
        
        const cardIndex = content.cards.findIndex(c => c._id.toString() === cardId);
        if (cardIndex === -1) throw { status: 404, message: 'Card not found' };
        
        content.cards[cardIndex] = { ...content.cards[cardIndex].toObject(), ...updateData };
        content.updatedAt = Date.now();
        return await content.save();
    }

    /**
     * Delete card.
     */
    async deleteCard(cardId) {
        const content = await StallVendor.findOne();
        if (!content) throw { status: 404, message: 'Content not found' };
        
        content.cards = content.cards.filter(c => c._id.toString() !== cardId);
        content.updatedAt = Date.now();
        return await content.save();
    }
}

module.exports = new StallVendorService();
