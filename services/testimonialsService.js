const Testimonial = require('../models/Testimonial');

/**
 * Service to handle Testimonials operations.
 */
class TestimonialsService {
    /**
     * Get or create singleton testimonials data.
     */
    async getTestimonials() {
        let data = await Testimonial.findOne();
        if (!data) {
            data = new Testimonial({
                subheading: 'Testimonials',
                heading: 'What Global Leaders Are Saying',
                highlightText: 'Are Saying',
                description: 'Voices of trust from healthcare innovators, clinical experts, and industry pioneers across the globe.',
                cards: []
            });
            await data.save();
        }
        return data;
    }

    /**
     * Update headings.
     */
    async updateHeadings(updateData) {
        const { subheading, heading, highlightText, description } = updateData;
        const data = await this.getTestimonials();
        
        if (subheading !== undefined) data.subheading = subheading;
        if (heading !== undefined) data.heading = heading;
        if (highlightText !== undefined) data.highlightText = highlightText;
        if (description !== undefined) data.description = description;
        
        return await data.save();
    }

    /**
     * Add a testimonial card.
     */
    async addCard(cardData) {
        const { name, role, company, feedback, rating } = cardData;
        const data = await this.getTestimonials();
        
        const initials = this._generateInitials(name);
        data.cards.push({ name, role, company, initials, feedback, rating });
        return await data.save();
    }

    /**
     * Update a testimonial card.
     */
    async updateCard(cardId, cardData) {
        const { name, role, company, feedback, rating } = cardData;
        const data = await this.getTestimonials();
        
        const card = data.cards.id(cardId);
        if (!card) throw { status: 404, message: 'Card not found' };
        
        if (name !== undefined) {
            card.name = name;
            card.initials = this._generateInitials(name);
        }
        if (role !== undefined) card.role = role;
        if (company !== undefined) card.company = company;
        if (feedback !== undefined) card.feedback = feedback;
        if (rating !== undefined) card.rating = rating;
        
        return await data.save();
    }

    /**
     * Delete a testimonial card.
     */
    async deleteCard(cardId) {
        const data = await this.getTestimonials();
        data.cards.pull({ _id: cardId });
        return await data.save();
    }

    /**
     * Helper to generate initials from a name.
     */
    _generateInitials(name) {
        const nameParts = name.trim().split(' ');
        let initials = '';
        if (nameParts.length > 0) {
            initials = nameParts[0][0].toUpperCase();
            if (nameParts.length > 1) {
                initials += nameParts[nameParts.length - 1][0].toUpperCase();
            }
        }
        return initials;
    }
}

module.exports = new TestimonialsService();
