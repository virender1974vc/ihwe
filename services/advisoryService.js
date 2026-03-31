const AdvisoryMember = require('../models/AdvisoryMember');

/**
 * Service to handle Advisory Member operations.
 */
class AdvisoryService {
    /**
     * Get all advisory members.
     * @returns {Promise<Array>}
     */
    async getAllMembers() {
        return await AdvisoryMember.find().sort({ createdAt: -1 });
    }

    /**
     * Create a new advisory member.
     * @param {Object} data - Member data.
     * @returns {Promise<Object>}
     */
    async createMember(data) {
        const { name, role, organization, image, imageAlt } = data;
        const newMember = new AdvisoryMember({
            name,
            role,
            organization,
            image,
            imageAlt
        });
        return await newMember.save();
    }

    /**
     * Update an advisory member.
     * @param {string} id - Member ID.
     * @param {Object} data - Update data.
     * @returns {Promise<Object>}
     */
    async updateMember(id, data) {
        const { name, role, organization, image, imageAlt } = data;
        const member = await AdvisoryMember.findByIdAndUpdate(
            id,
            { name, role, organization, image, imageAlt },
            { new: true }
        );
        if (!member) {
            throw { status: 404, message: "Member not found" };
        }
        return member;
    }

    /**
     * Delete an advisory member.
     * @param {string} id - Member ID.
     * @returns {Promise<Object>}
     */
    async deleteMember(id) {
        const member = await AdvisoryMember.findByIdAndDelete(id);
        if (!member) {
            throw { status: 404, message: "Member not found" };
        }
        return member;
    }
}

module.exports = new AdvisoryService();
