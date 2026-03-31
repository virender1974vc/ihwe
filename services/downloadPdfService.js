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
    async updateHeadings(data) {
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
        return await record.save();
    }

    /**
     * Add a resource card.
     */
    async addCard(cardData) {
        let record = await DownloadPdf.findOne();
        if (!record) record = new DownloadPdf({});
        record.cards.push(cardData);
        await record.save();
        return record.cards[record.cards.length - 1];
    }

    /**
     * Update a resource card.
     */
    async updateCard(cardId, updateData) {
        const record = await DownloadPdf.findOne();
        if (!record) throw { status: 404, message: 'Data not found' };
        
        const cardIndex = record.cards.findIndex(c => c._id.toString() === cardId);
        if (cardIndex === -1) throw { status: 404, message: 'Card not found' };
        
        Object.assign(record.cards[cardIndex], updateData);
        await record.save();
        return record.cards[cardIndex];
    }

    /**
     * Delete a resource card.
     */
    async deleteCard(cardId) {
        const record = await DownloadPdf.findOne();
        if (!record) throw { status: 404, message: 'Data not found' };
        
        record.cards = record.cards.filter(c => c._id.toString() !== cardId);
        return await record.save();
    }
}

module.exports = new DownloadPdfService();
