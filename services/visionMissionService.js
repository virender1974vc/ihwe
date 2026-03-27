const VisionMission = require('../models/VisionMission');

/**
 * Service to handle Vision and Mission section operations.
 */
class VisionMissionService {
    /**
     * Get content, creates default if none exists.
     */
    async getContent() {
        let content = await VisionMission.findOne();
        if (!content) {
            content = await VisionMission.create({
                mission: {
                    title: 'Our Mission',
                    icon: 'Target',
                    description: '"To create awareness about preventive healthcare, encourage the adoption of holistic wellness practices, and connect stakeholders from AYUSH, modern medicine, nutrition, and wellness technologies."',
                    highlightText: 'AYUSH'
                },
                vision: {
                    title: 'Our Vision',
                    icon: 'Milestone',
                    description: '"To empower every individual with the knowledge of preventive healthcare and the tools for a sustainable, healthy future — bridging traditional wisdom with modern innovation globally."',
                    highlightText: 'sustainable, healthy future'
                },
                backgroundColor: '#23471d'
            });
        }
        return content;
    }

    /**
     * Update Vision & Mission content.
     */
    async updateContent(data) {
        return await VisionMission.findOneAndUpdate(
            {},
            { ...data, lastUpdated: Date.now() },
            { new: true, upsert: true }
        );
    }
}

module.exports = new VisionMissionService();
