const DownloadPdf = require('../models/DownloadPdf');

/**
 * Service to handle Download PDF (Resources) operations.
 */
class DownloadPdfService {
    /**
     * Get resources section data.
     */
    async getResourcesData() {
        let data = await DownloadPdf.findOne();
        if (!data) {
            data = await new DownloadPdf({}).save();
        }
        return data;
    }

    /**
     * Update headings.
     */
    async updateHeadings(data, adminName) {
        const { subheading, heading, highlightTitle, description } = data;
        let record = await DownloadPdf.findOne();
        if (!record) {
            record = new DownloadPdf({ subheading, heading, highlightTitle, description });
        } else {
            record.subheading = subheading;
            record.heading = heading;
            record.highlightTitle = highlightTitle;
            record.description = description;
        }
        record.updatedBy = adminName || 'System';
        return await record.save();
    }


    /**
     * Add a resource card.
     */
    async addCard(cardData, adminName) {
        let record = await DownloadPdf.findOne();
        if (!record) record = new DownloadPdf({});
        const newCard = { ...cardData, updatedBy: adminName || 'System', updatedAt: new Date() };
        record.cards.push(newCard);
        await record.save();
        return record.cards[record.cards.length - 1];
    }


    /**
     * Update a resource card.
     */
    async updateCard(cardId, updateData, adminName) {
        const record = await DownloadPdf.findOne();
        if (!record) throw { status: 404, message: 'Data not found' };
        
        const cardIndex = record.cards.findIndex(c => c._id.toString() === cardId);
        if (cardIndex === -1) throw { status: 404, message: 'Card not found' };
        
        Object.assign(record.cards[cardIndex], { ...updateData, updatedBy: adminName || 'System', updatedAt: new Date() });
        await record.save();
        return record.cards[cardIndex];
    }


    /**
     * Delete a resource card.
     */
    async deleteCard(cardId, adminName) {
        const record = await DownloadPdf.findOne();
        if (!record) throw { status: 404, message: 'Data not found' };
        
        record.cards = record.cards.filter(c => c._id.toString() !== cardId);
        record.updatedBy = adminName || 'System';
        return await record.save();
    }

}

module.exports = new DownloadPdfService();
