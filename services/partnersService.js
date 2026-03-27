const PartnerGroup = require('../models/PartnerGroup');

/**
 * Service to handle Partner Group and Partner operations.
 */
class PartnersService {
    /**
     * Get all partner groups.
     */
    async getAllGroups() {
        return await PartnerGroup.find().sort({ order: 1 });
    }

    /**
     * Add a new partner group.
     */
    async addGroup(data) {
        const count = await PartnerGroup.countDocuments();
        const newGroup = new PartnerGroup({ ...data, order: count });
        return await newGroup.save();
    }

    /**
     * Update partner group settings.
     */
    async updateGroup(groupId, data) {
        const group = await PartnerGroup.findByIdAndUpdate(
            groupId,
            { ...data, updatedAt: Date.now() },
            { new: true }
        );
        if (!group) throw { status: 404, message: 'Group not found' };
        return group;
    }

    /**
     * Delete partner group.
     */
    async deleteGroup(groupId) {
        const group = await PartnerGroup.findByIdAndDelete(groupId);
        if (!group) throw { status: 404, message: 'Group not found' };
        return group;
    }

    /**
     * Add partner to a group.
     */
    async addPartner(groupId, partnerData) {
        const group = await PartnerGroup.findById(groupId);
        if (!group) throw { status: 404, message: 'Group not found' };

        const order = group.partners.length;
        group.partners.push({ ...partnerData, order });
        group.updatedAt = Date.now();
        return await group.save();
    }

    /**
     * Update partner details in a group.
     */
    async updatePartner(groupId, partnerId, partnerData) {
        const group = await PartnerGroup.findById(groupId);
        if (!group) throw { status: 404, message: 'Group not found' };

        const partner = group.partners.id(partnerId);
        if (!partner) throw { status: 404, message: 'Partner not found' };

        if (partnerData.name !== undefined) partner.name = partnerData.name;
        if (partnerData.logo !== undefined) partner.logo = partnerData.logo;
        if (partnerData.imageAlt !== undefined) partner.imageAlt = partnerData.imageAlt;

        group.updatedAt = Date.now();
        return await group.save();
    }

    /**
     * Delete partner from a group.
     */
    async deletePartner(groupId, partnerId) {
        const group = await PartnerGroup.findById(groupId);
        if (!group) throw { status: 404, message: 'Group not found' };

        group.partners = group.partners.filter(p => p._id.toString() !== partnerId);
        group.updatedAt = Date.now();
        return await group.save();
    }
}

module.exports = new PartnersService();
