const ExhibitorTestimonials = require('../models/ExhibitorTestimonials');

/**
 * Service to handle Exhibitor Testimonials section operations.
 */
class ExhibitorTestimonialsService {
    /**
     * Get all exhibitor testimonials, creates default if none exists.
     */
    async getExhibitorTestimonials() {
        let data = await ExhibitorTestimonials.findOne();
        if (!data) {
            data = await new ExhibitorTestimonials({}).save();
        }
        return data;
    }

    /**
     * Update section headings.
     */
    async updateHeadings(updateData, adminName) {
        const { heading } = updateData;
        let data = await ExhibitorTestimonials.findOne();
        if (!data) {
            data = new ExhibitorTestimonials({ heading });
        } else {
            if (heading !== undefined) data.heading = heading;
        }
        data.updatedBy = adminName || 'System';
        return await data.save();
    }

    /**
     * Add a testimonial card.
     */
    async addCard(cardData, adminName) {
        const { image, imageAlt, quote, companyName1, companyName2, location, order } = cardData;
        let data = await this.getExhibitorTestimonials();
        const finalOrder = order !== undefined ? order : data.cards.length;
        data.cards.push({ 
            image, 
            imageAlt, 
            quote, 
            companyName1, 
            companyName2, 
            location, 
            order: finalOrder, 
            updatedBy: adminName || 'System', 
            updatedAt: new Date() 
        });
        data.updatedBy = adminName || 'System';
        return await data.save();
    }

    /**
     * Update a testimonial card.
     */
    async updateCard(cardId, cardData, adminName) {
        const { image, imageAlt, quote, companyName1, companyName2, location, order } = cardData;
        const data = await ExhibitorTestimonials.findOne();
        if (!data) throw { status: 404, message: 'Not found' };
        
        const card = data.cards.id(cardId);
        if (!card) throw { status: 404, message: 'Card not found' };
        
        if (image !== undefined) card.image = image;
        if (imageAlt !== undefined) card.imageAlt = imageAlt;
        if (quote !== undefined) card.quote = quote;
        if (companyName1 !== undefined) card.companyName1 = companyName1;
        if (companyName2 !== undefined) card.companyName2 = companyName2;
        if (location !== undefined) card.location = location;
        if (order !== undefined) card.order = order;
        
        card.updatedBy = adminName || 'System';
        card.updatedAt = new Date();
        data.updatedBy = adminName || 'System';
        return await data.save();
    }

    /**
     * Delete a testimonial card.
     */
    async deleteCard(cardId, adminName) {
        const data = await ExhibitorTestimonials.findOne();
        if (!data) throw { status: 404, message: 'Not found' };
        data.cards = data.cards.filter(c => c._id.toString() !== cardId);
        data.updatedBy = adminName || 'System';
        return await data.save();
    }
}

module.exports = new ExhibitorTestimonialsService();
