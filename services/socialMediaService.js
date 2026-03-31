const SocialMedia = require('../models/SocialMedia');

/**
 * Service to handle Social Media operations.
 */
class SocialMediaService {
    /**
     * Get social media links.
     */
    async getSocialMedia() {
        let socialMedia = await SocialMedia.findOne();
        if (!socialMedia) {
            return {
                facebook: "",
                instagram: "",
                twitter: "",
                linkedin: "",
                youtube: "",
                whatsappNumber: "",
                whatsappMessage: "",
                callNumber: ""
            };
        }
        return socialMedia;
    }

    /**
     * Update social media links.
     */
    async updateSocialMedia(updateData) {
        return await SocialMedia.findOneAndUpdate(
            {},
            updateData,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
    }
}

module.exports = new SocialMediaService();
