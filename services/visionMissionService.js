const VisionMission = require('../models/VisionMission');

const normalizeProject = (project) => ['ihwe', 'organicexpo'].includes(project) ? project : 'organicexpo';
const getProjectQuery = (project) => {
    const normalizedProject = normalizeProject(project);
    return normalizedProject === 'organicexpo'
        ? { $or: [{ project: normalizedProject }, { project: { $exists: false } }] }
        : { project: normalizedProject };
};

/**
 * Service to handle Vision and Mission section operations.
 */
class VisionMissionService {
    /**
     * Get content, creates default if none exists.
     */
    async getContent(project) {
        const normalizedProject = normalizeProject(project);
        let content = await VisionMission.findOne(getProjectQuery(normalizedProject));
        if (!content) {
            content = await VisionMission.create({
                project: normalizedProject,
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
        } else if (content.project !== normalizedProject) {
            content.project = normalizedProject;
            await content.save();
        }
        return content;
    }

    /**
     * Update Vision & Mission content.
     */
    async updateContent(data, project) {
        const normalizedProject = normalizeProject(project);
        return await VisionMission.findOneAndUpdate(
            getProjectQuery(normalizedProject),
            { ...data, project: normalizedProject, lastUpdated: Date.now() },
            { returnDocument: 'after', upsert: true }
        );
    }
}

module.exports = new VisionMissionService();
