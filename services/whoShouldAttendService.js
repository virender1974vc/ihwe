const WhoShouldAttend = require('../models/WhoShouldAttend');

/**
 * Service to handle Who Should Attend section operations.
 */
class WhoShouldAttendService {
    /**
     * Get content, creates default if none exists.
     */
    async getContent() {
        let content = await WhoShouldAttend.findOne();
        if (!content) {
            content = await WhoShouldAttend.create({
                subheading: 'Target Audience',
                heading: 'Who Should Attend?',
                highlightText: 'Attend?',
                image: '/images/who2.png',
                imageAlt: 'Expo Attendees',
                groups: [
                    "Healthcare Professionals & AYUSH Practitioners",
                    "Wellness Coaches & Yoga Experts",
                    "Organic Product Companies",
                    "Hospitals, Clinics, and Medical Institutions",
                    "Pharma & Nutraceutical Brands",
                    "Health-Conscious Public"
                ]
            });
        }
        return content;
    }

    /**
     * Update headings and image.
     */
    async updateHeadings(data) {
        const { subheading, heading, highlightText, imageAlt, image } = data;
        let updateData = { subheading, heading, highlightText, imageAlt, lastUpdated: Date.now() };
        if (image) updateData.image = image;

        return await WhoShouldAttend.findOneAndUpdate({}, updateData, { upsert: true, new: true });
    }

    /**
     * Add a group.
     */
    async addGroup(group) {
        return await WhoShouldAttend.findOneAndUpdate(
            {},
            { $push: { groups: group }, lastUpdated: Date.now() },
            { upsert: true, new: true }
        );
    }

    /**
     * Update a group by index.
     */
    async updateGroup(index, group) {
        const content = await WhoShouldAttend.findOne();
        if (content) {
            content.groups[index] = group;
            content.lastUpdated = Date.now();
            await content.save();
        }
        return content;
    }

    /**
     * Delete a group by index.
     */
    async deleteGroup(index) {
        const content = await WhoShouldAttend.findOne();
        if (content) {
            content.groups.splice(index, 1);
            content.lastUpdated = Date.now();
            await content.save();
        }
        return content;
    }
}

module.exports = new WhoShouldAttendService();
