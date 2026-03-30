const GalleryItem = require('../models/GalleryItem');

/**
 * Service to handle Gallery operations.
 */
class GalleryService {
    /**
     * Get all gallery items, optionally filtered by category.
     * @param {string} [category] - Optional category filter.
     * @returns {Promise<Array>}
     */
    async getAllItems(category, title) {
        let query = {};
        if (category) {
            query.category = category;
        }
        if (title) {
            query.title = title;
        }
        return await GalleryItem.find(query).sort({ createdAt: -1 });
    }

    /**
     * Add a new gallery item.
     * @param {Object} data - Item data.
     * @returns {Promise<Object>}
     */
    async createItem(data) {
        const newItem = new GalleryItem(data);
        return await newItem.save();
    }

    /**
     * Update a gallery item.
     * @param {string} id - Item ID.
     * @param {Object} data - Update data.
     * @returns {Promise<Object>}
     */
    async updateItem(id, data) {
        const item = await GalleryItem.findByIdAndUpdate(
            id,
            data,
            { new: true }
        );
        if (!item) {
            throw { status: 404, message: "Item not found" };
        }
        return item;
    }

    /**
     * Delete a gallery item.
     * @param {string} id - Item ID.
     * @returns {Promise<Object>}
     */
    async deleteItem(id) {
        const item = await GalleryItem.findByIdAndDelete(id);
        if (!item) {
            throw { status: 404, message: "Item not found" };
        }
        return item;
    }
}

module.exports = new GalleryService();
