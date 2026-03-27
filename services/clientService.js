const Client = require('../models/Client');

/**
 * Service to handle Client section operations.
 */
class ClientService {
    /**
     * Get client data, creates default if none exists.
     */
    async getClientData() {
        let client = await Client.findOne();
        if (!client) {
            client = new Client();
            await client.save();
        }
        return client;
    }

    /**
     * Update headings.
     */
    async updateHeadings(data) {
        const { subheading, heading, highlightText } = data;
        let client = await Client.findOne();
        if (!client) {
            client = new Client({ subheading, heading, highlightText });
        } else {
            client.subheading = subheading;
            client.heading = heading;
            client.highlightText = highlightText;
        }
        return await client.save();
    }

    /**
     * Add an image card.
     */
    async addImage(data) {
        const { url, altText } = data;
        let client = await this.getClientData();
        client.images.push({ url, altText });
        return await client.save();
    }

    /**
     * Update an image card.
     */
    async updateImage(imageId, data) {
        const { url, altText } = data;
        let client = await Client.findOne();
        if (!client) throw { status: 404, message: "Client data not found" };

        const image = client.images.id(imageId);
        if (!image) throw { status: 404, message: "Image not found" };

        if (url !== undefined) image.url = url;
        if (altText !== undefined) image.altText = altText;

        return await client.save();
    }

    /**
     * Delete an image card.
     */
    async deleteImage(imageId) {
        let client = await Client.findOne();
        if (!client) throw { status: 404, message: "Client data not found" };

        client.images = client.images.filter(img => img._id.toString() !== imageId);
        return await client.save();
    }
}

module.exports = new ClientService();
