const PrintingBrandingPartner = require('../models/PrintingBrandingPartner');

class PrintingBrandingPartnerService {
    async getData() {
        let content = await PrintingBrandingPartner.findOne();
        if (!content) {
            content = await PrintingBrandingPartner.create({});
        }
        return content;
    }

    async updateData(data) {
        return await PrintingBrandingPartner.findOneAndUpdate(
            {},
            {
                hero: data.hero,
                whyPartner: data.whyPartner,
                stats: data.stats,
                benefits: data.benefits,
                advantages: data.advantages,
                packages: data.packages,
                footer: data.footer,
                lastUpdated: Date.now()
            },
            { upsert: true, new: true }
        );
    }
}

module.exports = new PrintingBrandingPartnerService();
