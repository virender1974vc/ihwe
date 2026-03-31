const TermAndCondition = require('../models/TermAndCondition');

class TermAndConditionService {
    async getAllTerms() {
        return await TermAndCondition.find().populate('eventId', 'name').sort({ pageName: 1 });
    }
    async getTermByPage(pageName, eventId) {
        const query = { pageName, status: 'Active' };
        if (eventId) query.eventId = eventId;
        return await TermAndCondition.findOne(query);
    }
    async addTerm(data) {
        const term = new TermAndCondition(data);
        return await term.save();
    }
    async getTermById(id) {
        return await TermAndCondition.findById(id);
    }
    async updateTerm(id, data) {
        return await TermAndCondition.findByIdAndUpdate(id, data, { new: true });
    }
    async deleteTerm(id) {
        return await TermAndCondition.findByIdAndDelete(id);
    }
}

module.exports = new TermAndConditionService();
