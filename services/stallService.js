const Stall = require('../models/Stall');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
class StallService {
    async getAllStalls() {
        return await Stall.find().populate('eventId', 'name').populate('bookedBy', 'exhibitorName companyEmail').sort({ createdAt: -1 });
    }
    async getAvailableStalls(query = {}) {
        const filter = { status: 'available' };
        if (query.eventId) filter.eventId = query.eventId;
        return await Stall.find(filter).populate('eventId', 'name').sort({ stallNumber: 1 });
    }
    async addStall(data) {
        const stall = new Stall(data);
        return await stall.save();
    }
    async getStallById(id) {
        return await Stall.findById(id);
    }
    async updateStall(id, data) {
        return await Stall.findByIdAndUpdate(id, data, { returnDocument: 'after' });
    }
    async makeAvailable(id) {
        const stall = await Stall.findById(id);
        if (!stall) throw new Error('Stall not found');
        if (!['booked', 'reserved'].includes(stall.status)) {
            throw new Error('Only booked or hold stalls can be made available');
        }

        if (stall.bookedBy) {
            const linkedExhibitorExists = await ExhibitorRegistration.exists({ _id: stall.bookedBy });
            if (linkedExhibitorExists) {
                const error = new Error('This stall is linked to an exhibitor and cannot be made available');
                error.statusCode = 409;
                throw error;
            }
        }

        stall.status = 'available';
        stall.bookedBy = null;
        return await stall.save();
    }
    async deleteStall(id) {
        return await Stall.findByIdAndDelete(id);
    }
    async bulkDeleteStalls(ids) {
        return await Stall.deleteMany({ _id: { $in: ids } });
    }
    async bookStall(id, bookedById) {
        return await Stall.findByIdAndUpdate(id, { status: 'booked', bookedBy: bookedById }, { returnDocument: 'after' });
    }
}

module.exports = new StallService();
