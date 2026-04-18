const Exhibitor = require('../models/Exhibitor');
class ExhibitorService {
    async getAllExhibitors() {
        return await Exhibitor.find().sort({ createdAt: -1 });
    }
    async getExhibitorById(id) {
        return await Exhibitor.findById(id);
    }
    async addExhibitor(data) {
        const newExhibitor = new Exhibitor(data);
        return await newExhibitor.save();
    }
    async updateExhibitor(id, data) {
        return await Exhibitor.findByIdAndUpdate(id, data, { new: true });
    }
    async deleteExhibitor(id) {
        return await Exhibitor.findByIdAndDelete(id);
    }
}

module.exports = new ExhibitorService();
