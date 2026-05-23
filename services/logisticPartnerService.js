const LogisticPartner = require('../models/LogisticPartner');

class LogisticPartnerService {
    /**
     * Get dynamic logistic partner content, seeds defaults if empty.
     */
    async getData() {
        let content = await LogisticPartner.findOne();
        
        if (!content) {
            content = await LogisticPartner.create({});
        }
        
        return content;
    }

    /**
     * Save/Update Logistic Partner configuration.
     */
    async updateData(data) {
        return await LogisticPartner.findOneAndUpdate(
            {},
            {
                hero: data.hero,
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

module.exports = new LogisticPartnerService();
