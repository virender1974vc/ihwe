const organizedByService = require('../services/organizedByService');

/**
 * Controller to handle OrganizedBy section requests.
 */
class OrganizedByController {
    /**
     * Get OrganizedBy content.
     */
    async getContent(req, res) {
        try {
            const data = await organizedByService.getContent();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update OrganizedBy content.
     */
    async updateContent(req, res) {
        try {
            const { subheading, heading, highlightText, badgeText, orgName, quote, logoAlt } = req.body;
            let updateData = { subheading, heading, highlightText, badgeText, orgName, quote, logoAlt };
            
            if (req.file) {
                updateData.logo = `/uploads/organized/${req.file.filename}`;
            }

            const data = await organizedByService.updateContent(updateData);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new OrganizedByController();
