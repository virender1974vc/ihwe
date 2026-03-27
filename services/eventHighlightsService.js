const EventHighlights = require('../models/EventHighlights');

/**
 * Service to handle Event Highlights operations.
 */
class EventHighlightsService {
    /**
     * Get event highlights data.
     */
    async getContent() {
        let data = await EventHighlights.findOne();
        if (!data) {
            data = await new EventHighlights({}).save();
        }
        return data;
    }

    /**
     * Update event highlights data.
     */
    async updateContent(updateData) {
        const fields = [
            'subtitle', 'title', 'highlightText', 'countdownDate',
            'imageAlt', 'downloadButtonName',
            'eventDate', 'eventDay',
            'exhibitionHours', 'timezone',
            'venueName', 'venueAddress',
            'registerButtonName', 'registerButtonPath', 'isActive'
        ];

        const dataToUpdate = {};
        fields.forEach(field => {
            if (updateData[field] !== undefined) dataToUpdate[field] = updateData[field];
        });

        let data = await EventHighlights.findOne();
        if (!data) {
            data = new EventHighlights(dataToUpdate);
        } else {
            Object.assign(data, dataToUpdate);
        }

        return await data.save();
    }

    /**
     * Update image path.
     */
    async updateImage(imagePath) {
        let data = await EventHighlights.findOne();
        if (!data) data = new EventHighlights({});
        data.image = imagePath;
        return await data.save();
    }

    /**
     * Update PDF path.
     */
    async updatePdf(pdfPath) {
        let data = await EventHighlights.findOne();
        if (!data) data = new EventHighlights({});
        data.pdfFile = pdfPath;
        return await data.save();
    }
}

module.exports = new EventHighlightsService();
