const HospitalityPartner = require('../models/HospitalityPartner');

class HospitalityPartnerService {
    async getData() {
        let content = await HospitalityPartner.findOne();
        if (!content) {
            content = await HospitalityPartner.create({});
        }
        return content;
    }

    async updateData(data) {
        return await HospitalityPartner.findOneAndUpdate(
            {},
            {
                hero: data.hero,
                whyPartner: data.whyPartner,
                stats: data.stats,
                benefits: data.benefits,
                packages: data.packages,
                footer: data.footer,
                lastUpdated: Date.now()
            },
            { upsert: true, new: true }
        );
    }
}

module.exports = new HospitalityPartnerService();
