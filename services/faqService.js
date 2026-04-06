const FAQ = require('../models/FAQ');

class FAQService {
    async getFAQ() {
        let data = await FAQ.findOne();
        if (!data) {
            data = await new FAQ({}).save();
        }
        return data;
    }

    async updateHeadings(updateData, adminName) {
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
        }
        data.updatedBy = adminName || 'System';
        return await data.save();
    }


    async addItem(itemData, adminName) {
        const { question, answer, image, imageAlt } = itemData;
        let data = await this.getFAQ();
        const order = data.items.length;
        data.items.push({ 
            question, 
            answer, 
            image, 
            imageAlt, 
            order, 
            updatedBy: adminName || 'System',
            updatedAt: new Date()
        });
        data.updatedBy = adminName || 'System';
        return await data.save();
    }


    async updateItem(itemId, itemData, adminName) {
        const { question, answer, image, imageAlt } = itemData;
        const data = await FAQ.findOne();
        if (!data) throw { status: 404, message: 'Not found' };

        const item = data.items.id(itemId);
        if (!item) throw { status: 404, message: 'FAQ item not found' };

        if (question !== undefined) item.question = question;
        if (answer !== undefined) item.answer = answer;
        if (image !== undefined) item.image = image;
        if (imageAlt !== undefined) item.imageAlt = imageAlt;
        
        item.updatedBy = adminName || 'System';
        item.updatedAt = new Date();
        data.updatedBy = adminName || 'System';
        
        return await data.save();
    }


    async deleteItem(itemId, adminName) {
        const data = await FAQ.findOne();
        if (!data) throw { status: 404, message: 'Not found' };
        data.items = data.items.filter(i => i._id.toString() !== itemId);
        data.updatedBy = adminName || 'System';
        return await data.save();
    }

}

module.exports = new FAQService();
