const whyExhibitService = require('../services/whyExhibitService');

/**
 * Controller to handle Why Exhibit section requests.
 */
class WhyExhibitController {
    /**
     * Get Why Exhibit content.
     */
    async getContent(req, res) {
        try {
            const data = await whyExhibitService.getContent();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update Headings.
     */
    async updateHeadings(req, res) {
        try {
            const data = await whyExhibitService.updateHeadings(req.body);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Add Benefit.
     */
    async addBenefit(req, res) {
        try {
            const { title, description, buttonName, buttonLink, imageAlt, accent, icon } = req.body;
            let benefitData = { title, description, buttonName, buttonLink, imageAlt, accent, icon };
            
            if (req.file) {
                benefitData.image = `/uploads/exhibit/${req.file.filename}`;
            }

            const data = await whyExhibitService.addBenefit(benefitData);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update Benefit.
     */
    async updateBenefit(req, res) {
        try {
            const { title, description, buttonName, buttonLink, imageAlt, accent, icon } = req.body;
            let benefitData = { title, description, buttonName, buttonLink, imageAlt, accent, icon };
            
            if (req.file) {
                benefitData.image = `/uploads/exhibit/${req.file.filename}`;
            }

            const data = await whyExhibitService.updateBenefit(req.params.id, benefitData);
            res.json({ success: true, data });
        } catch (error) {
            res.status(error.status || 500).json({ success: false, message: error.message });
        }
    }

    /**
     * Delete Benefit.
     */
    async deleteBenefit(req, res) {
        try {
            const data = await whyExhibitService.deleteBenefit(req.params.id);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update CTA Section.
     */
    async updateCTA(req, res) {
        try {
            const { 
                ctaTitle, ctaHighlightText, ctaDescription, 
                ctaButton1Name, ctaButton1Link, ctaButton2Name, ctaButton2Link, 
                ctaImageAlt 
            } = req.body;
            
            let updateData = { 
                ctaTitle, ctaHighlightText, ctaDescription, 
                ctaButton1Name, ctaButton1Link, ctaButton2Name, ctaButton2Link, 
                ctaImageAlt
            };
            
            if (req.file) {
                updateData.ctaImage = `/uploads/exhibit/${req.file.filename}`;
            }

            const data = await whyExhibitService.updateCTA(updateData);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new WhyExhibitController();
