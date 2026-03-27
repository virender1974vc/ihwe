const EPromotionContent = require('../models/EPromotionContent');
const EPromotionEnquiry = require('../models/EPromotionEnquiry');

/**
 * Service to handle E-Promotion operations.
 */
class EPromotionService {
    /**
     * Get content.
     */
    async getContent() {
        let content = await EPromotionContent.findOne();
        if (!content) {
            content = new EPromotionContent({
                cards: [
                    { icon: 'MessageCircle', title: 'WhatsApp Campaigns', description: 'Targeted WhatsApp marketing to our registered visitors & groups.', color: '#25D366' },
                    { icon: 'Mail', title: 'Email Blasts', description: 'Promote your brand via our curated mailing lists of 100k+.', color: '#1a73e8' },
                    { icon: 'Share2', title: 'Social Media Shoutouts', description: 'Brand features on our Instagram, Facebook & YouTube handles.', color: '#d26019' }
                ]
            });
            await content.save();
        }
        return content;
    }

    /**
     * Update content.
     */
    async updateContent(data) {
        let content = await EPromotionContent.findOne();
        if (content) {
            Object.assign(content, data);
            content.updatedAt = Date.now();
            return await content.save();
        } else {
            content = new EPromotionContent(data);
            return await content.save();
        }
    }

    /**
     * Submit enquiry.
     */
    async submitEnquiry(data) {
        const enquiry = new EPromotionEnquiry(data);
        return await enquiry.save();
    }

    /**
     * Get all enquiries.
     */
    async getAllEnquiries() {
        return await EPromotionEnquiry.find().sort({ createdAt: -1 });
    }

    /**
     * Delete enquiry.
     */
    async deleteEnquiry(id) {
        return await EPromotionEnquiry.findByIdAndDelete(id);
    }
}

module.exports = new EPromotionService();
