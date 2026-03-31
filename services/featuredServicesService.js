const FeaturedServices = require('../models/FeaturedServices');

/**
 * Service to handle Featured Services section operations.
 */
class FeaturedServicesService {
    /**
     * Get all featured services, creates default if none exists.
     */
    async getFeaturedServices() {
        let data = await FeaturedServices.findOne();
        if (!data) {
            data = await new FeaturedServices({}).save();
        }
        return data;
    }

    /**
     * Update section headings.
     */
    async updateHeadings(updateData) {
        const { subheading, heading, highlightText, description, mainButtonText, mainButtonUrl, mainSubText } = updateData;
        let data = await FeaturedServices.findOne();
        if (!data) {
            data = new FeaturedServices({ subheading, heading, highlightText, description, mainButtonText, mainButtonUrl, mainSubText });
        } else {
            data.subheading = subheading;
            data.heading = heading;
            data.highlightText = highlightText;
            data.description = description;
            if (mainButtonText !== undefined) data.mainButtonText = mainButtonText;
            if (mainButtonUrl !== undefined) data.mainButtonUrl = mainButtonUrl;
            if (mainSubText !== undefined) data.mainSubText = mainSubText;
            data.updatedAt = Date.now();
        }
        return await data.save();
    }

    /**
     * Add a service card.
     */
    async addCard(cardData) {
        const { title, description, icon, image, imageAlt, accent, buttonText, buttonUrl } = cardData;
        let data = await this.getFeaturedServices();
        const order = data.cards.length;
        data.cards.push({ title, description, icon, image, imageAlt, accent, buttonText, buttonUrl, order });
        data.updatedAt = Date.now();
        return await data.save();
    }

    /**
     * Update a service card.
     */
    async updateCard(cardId, cardData) {
        const { title, description, icon, image, imageAlt, accent, buttonText, buttonUrl } = cardData;
        const data = await FeaturedServices.findOne();
        if (!data) throw { status: 404, message: 'Not found' };
        
        const card = data.cards.id(cardId);
        if (!card) throw { status: 404, message: 'Card not found' };
        
        if (title !== undefined) card.title = title;
        if (description !== undefined) card.description = description;
        if (icon !== undefined) card.icon = icon;
        if (image !== undefined) card.image = image;
        if (imageAlt !== undefined) card.imageAlt = imageAlt;
        if (accent !== undefined) card.accent = accent;
        if (buttonText !== undefined) card.buttonText = buttonText;
        if (buttonUrl !== undefined) card.buttonUrl = buttonUrl;
        
        data.updatedAt = Date.now();
        return await data.save();
    }

    /**
     * Delete a service card.
     */
    async deleteCard(cardId) {
        const data = await FeaturedServices.findOne();
        if (!data) throw { status: 404, message: 'Not found' };
        data.cards = data.cards.filter(c => c._id.toString() !== cardId);
        data.updatedAt = Date.now();
        return await data.save();
    }
}

module.exports = new FeaturedServicesService();
