const Stall = require('../models/Stall');
class StallService {
    async getAllStalls() {
        return await Stall.find().populate('eventId', 'name').sort({ createdAt: -1 });
    }
    async getAvailableStalls() {
        return await Stall.find({ status: 'available' }).populate('eventId', 'name').sort({ stallNumber: 1 });
    }
    async addStall(data) {
        const stall = new Stall(data);
        return await stall.save();
    }
    async getStallById(id) {
        return await Stall.findById(id);
    }
    async updateStall(id, data) {
        return await Stall.findByIdAndUpdate(id, data, { new: true });
    }
    async deleteStall(id) {
        return await Stall.findByIdAndDelete(id);
    }
    async bookStall(id, bookedById) {
        return await Stall.findByIdAndUpdate(id, { status: 'booked', bookedBy: bookedById }, { new: true });
    }
}

module.exports = new StallService();
