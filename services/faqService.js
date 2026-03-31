const FAQ = require('../models/FAQ');

class FAQService {
    async getFAQ() {
        let data = await FAQ.findOne();
        if (!data) {
            data = await new FAQ({}).save();
        }
        return data;
    }

    async updateHeadings(updateData) {
        const { subheading, heading, highlightText, description, defaultImage, defaultImageAlt } = updateData;
        let data = await FAQ.findOne();
        if (!data) {
            data = new FAQ({ subheading, heading, highlightText, description, defaultImage, defaultImageAlt });
        } else {
            data.subheading = subheading;
            data.heading = heading;
            data.highlightText = highlightText;
            data.description = description;
            if (defaultImage !== undefined) data.defaultImage = defaultImage;
            if (defaultImageAlt !== undefined) data.defaultImageAlt = defaultImageAlt;
            data.updatedAt = Date.now();
        }
        return await data.save();
    }

    async addItem(itemData) {
        const { question, answer, image, imageAlt } = itemData;
        let data = await this.getFAQ();
        const order = data.items.length;
        data.items.push({ question, answer, image, imageAlt, order });
        data.updatedAt = Date.now();
        return await data.save();
    }

    async updateItem(itemId, itemData) {
        const { question, answer, image, imageAlt } = itemData;
        const data = await FAQ.findOne();
        if (!data) throw { status: 404, message: 'Not found' };

        const item = data.items.id(itemId);
        if (!item) throw { status: 404, message: 'FAQ item not found' };

        if (question !== undefined) item.question = question;
        if (answer !== undefined) item.answer = answer;
        if (image !== undefined) item.image = image;
        if (imageAlt !== undefined) item.imageAlt = imageAlt;

        data.updatedAt = Date.now();
        return await data.save();
    }

    async deleteItem(itemId) {
        const data = await FAQ.findOne();
        if (!data) throw { status: 404, message: 'Not found' };
        data.items = data.items.filter(i => i._id.toString() !== itemId);
        data.updatedAt = Date.now();
        return await data.save();
    }
}

module.exports = new FAQService();
