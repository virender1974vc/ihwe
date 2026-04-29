const ServiceDetail = require('../models/ServiceDetail');
const FeaturedServices = require('../models/FeaturedServices');
const { logActivity } = require('../utils/logger');

class ServiceDetailController {
    /**
     * Get all service details
     */
    async getAll(req, res) {
        try {
            const details = await ServiceDetail.find().sort({ updatedAt: -1 });
            res.json({ success: true, data: details });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Get detail by serviceCardId
     */
    async getByCardId(req, res) {
        try {
            const detail = await ServiceDetail.findOne({ serviceCardId: req.params.cardId });
            res.json({ success: true, data: detail });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getBySlug(req, res) {
        try {
            const detail = await ServiceDetail.findOne({ slug: req.params.slug });
            res.json({ success: true, data: detail });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Create or update service detail
     */
    async save(req, res) {
        try {
            const { serviceCardId, serviceTitle, slug, heroImage, heroImageAlt, heroOverlayOpacity, h1Heading, content } = req.body;
            
            let detail = await ServiceDetail.findOne({ serviceCardId });
            
            if (detail) {
                // Update
                detail.serviceTitle = serviceTitle;
                detail.slug = slug || '';
                detail.heroImage = heroImage;
                detail.heroImageAlt = heroImageAlt;
                detail.heroOverlayOpacity = heroOverlayOpacity !== undefined ? heroOverlayOpacity : 0.7;
                detail.h1Heading = h1Heading;
                detail.content = content;
                detail.updatedBy = req.user?.username || 'Admin';
                await detail.save();
                await logActivity(req, 'Updated', 'Service Page', `Updated detail page for: ${serviceTitle}`);
            } else {
                // Create
                detail = new ServiceDetail({
                    serviceCardId,
                    serviceTitle,
                    slug: slug || '',
                    heroImage,
                    heroImageAlt,
                    heroOverlayOpacity: heroOverlayOpacity !== undefined ? heroOverlayOpacity : 0.7,
                    h1Heading,
                    content,
                    updatedBy: req.user?.username || 'Admin'
                });
                await detail.save();
                await logActivity(req, 'Created', 'Service Page', `Created detail page for: ${serviceTitle}`);
            }
            
            res.json({ success: true, data: detail, message: 'Service detail saved successfully' });

            // Sync with FeaturedServices card to update the "Learn More" link
            try {
                const featuredSection = await FeaturedServices.findOne({ "cards._id": serviceCardId });
                if (featuredSection) {
                    const card = featuredSection.cards.id(serviceCardId);
                    if (card) {
                        card.buttonUrl = `/industry-zone/${slug || serviceCardId}`;
                        await featuredSection.save();
                    }
                }
            } catch (syncError) {
                console.error('FeaturedServices Sync Error:', syncError);
                // We don't fail the request if sync fails, but we log it
            }
        } catch (error) {
            console.error('Save service detail error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Delete service detail
     */
    async delete(req, res) {
        try {
            await ServiceDetail.findByIdAndDelete(req.params.id);
            await logActivity(req, 'Deleted', 'Service Page', `Deleted detail page ID: ${req.params.id}`);
            res.json({ success: true, message: 'Deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new ServiceDetailController();
