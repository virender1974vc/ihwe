const HealthcareSectors = require('../models/HealthcareSectors');

/**
 * Service to handle Healthcare Sectors section operations.
 */
class HealthcareSectorsService {
    /**
     * Get all healthcare sectors, creates default if none exists.
     */
    async getHealthcareSectors() {
        let data = await HealthcareSectors.findOne();
        if (!data) {
            data = await new HealthcareSectors({}).save();
        }
        return data;
    }

    /**
     * Update section headings.
     */
    async updateHeadings(updateData, adminName) {
        const { heading, subtitle } = updateData;
        let data = await HealthcareSectors.findOne();
        if (!data) {
            data = new HealthcareSectors({ heading, subtitle });
        } else {
            if (heading !== undefined) data.heading = heading;
            if (subtitle !== undefined) data.subtitle = subtitle;
        }
        data.updatedBy = adminName || 'System';
        return await data.save();
    }

    /**
     * Add a sector card.
     */
    async addCard(cardData, adminName) {
        const { title, description, icon, image, imageAlt } = cardData;
        let data = await this.getHealthcareSectors();
        const order = data.cards.length;
        data.cards.push({ title, description, icon, image, imageAlt, order, updatedBy: adminName || 'System', updatedAt: new Date() });
        data.updatedBy = adminName || 'System';
        return await data.save();
    }

    /**
     * Update a sector card.
     */
    async updateCard(cardId, cardData, adminName) {
        const { title, description, icon, image, imageAlt } = cardData;
        const data = await HealthcareSectors.findOne();
        if (!data) throw { status: 404, message: 'Not found' };
        
        const card = data.cards.id(cardId);
        if (!card) throw { status: 404, message: 'Card not found' };
        
        if (title !== undefined) card.title = title;
        if (description !== undefined) card.description = description;
        if (icon !== undefined) card.icon = icon;
        if (image !== undefined) card.image = image;
        if (imageAlt !== undefined) card.imageAlt = imageAlt;
        
        card.updatedBy = adminName || 'System';
        card.updatedAt = new Date();
        data.updatedBy = adminName || 'System';
        return await data.save();
    }

    /**
     * Delete a sector card.
     */
    async deleteCard(cardId, adminName) {
        const data = await HealthcareSectors.findOne();
        if (!data) throw { status: 404, message: 'Not found' };
        data.cards = data.cards.filter(c => c._id.toString() !== cardId);
        data.updatedBy = adminName || 'System';
        return await data.save();
    }
}

module.exports = new HealthcareSectorsService();
