const LegalPolicy = require('../models/LegalPolicy');

class PolicyController {
    /**
     * Get policy by page name
     */
    async getPolicy(req, res) {
        try {
            const { page } = req.params;
            const policy = await LegalPolicy.findOne({ page });
            
            if (!policy) {
                return res.status(404).json({
                    success: false,
                    message: `Policy not found for ${page}`
                });
            }

            return res.status(200).json({
                success: true,
                data: policy
            });
        } catch (error) {
            console.error('Error fetching policy:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch policy'
            });
        }
    }

    /**
     * Upsert policy (Create or Update)
     */
    async upsertPolicy(req, res) {
        try {
            const { page, title, content } = req.body;

            if (!page || !title || !content) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields'
                });
            }

            const policy = await LegalPolicy.findOneAndUpdate(
                { page },
                { page, title, content },
                { new: true, upsert: true, runValidators: true }
            );

            return res.status(200).json({
                success: true,
                message: 'Policy updated successfully',
                data: policy
            });
        } catch (error) {
            console.error('Error updating policy:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update policy'
            });
        }
    }
}

module.exports = new PolicyController();
