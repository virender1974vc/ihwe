const WhyAttend = require('../models/WhyAttend');

/**
 * Service to handle Why Attend section operations.
 */
class WhyAttendService {
    /**
     * Get content, creates default if none exists.
     */
    async getContent() {
        let content = await WhyAttend.findOne();
        if (!content) {
            content = await WhyAttend.create({
                subheading: 'Why Attend?',
                heading: 'Expo Highlights',
                highlightText: 'Highlights',
                cards: [
                    { title: '200+ Exhibitors', icon: 'Globe', desc: 'Across Health & Wellness sectors' },
                    { title: 'Yoga & Meditation', icon: 'Sun', desc: 'Live sessions and demonstrations' },
                    { title: 'Seminars', icon: 'BookOpen', desc: 'Expert-led panel discussions' },
                    { title: 'Checkup Camps', icon: 'Stethoscope', desc: 'Free health screening zones' },
                    { title: 'Networking', icon: 'Users', desc: 'Premium B2B meeting spaces' },
                    { title: 'Product Launches', icon: 'Zap', desc: 'New healthcare innovations' }
                ]
            });
        }
        return content;
    }

    /**
     * Update headings.
     */
    async updateHeadings(data) {
        return await WhyAttend.findOneAndUpdate(
            {},
            { ...data, lastUpdated: Date.now() },
            { new: true, upsert: true }
        );
    }

    /**
     * Add a card.
     */
    async addCard(data) {
        return await WhyAttend.findOneAndUpdate(
            {},
            { $push: { cards: data }, lastUpdated: Date.now() },
            { new: true, upsert: true }
        );
    }

    /**
     * Update a card.
     */
    async updateCard(cardId, data) {
        return await WhyAttend.findOneAndUpdate(
            { 'cards._id': cardId },
            { 
                $set: { 
                    'cards.$.title': data.title,
                    'cards.$.icon': data.icon,
                    'cards.$.desc': data.desc
                },
                lastUpdated: Date.now()
            },
            { new: true }
        );
    }

    /**
     * Delete a card.
     */
    async deleteCard(cardId) {
        return await WhyAttend.findOneAndUpdate(
            {},
            { $pull: { cards: { _id: cardId } }, lastUpdated: Date.now() },
            { new: true }
        );
    }
}

module.exports = new WhyAttendService();
