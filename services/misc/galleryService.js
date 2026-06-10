const GalleryItem = require('../../models/misc/GalleryItem');
const GalleryCategory = require('../../models/misc/GalleryCategory');

/**
 * Service to handle Gallery operations.
 */
class GalleryService {
    /**
     * Get all gallery items, optionally filtered by category.
     * @param {string} [category] - Optional category filter.
     * @returns {Promise<Array>}
     */
    async getAllItems(category, title, galleryCategoryId) {
        let query = {};
        if (category) {
            query.category = category;
        }
        if (title) {
            query.title = title;
        }
        if (galleryCategoryId) {
            query.galleryCategoryId = galleryCategoryId;
        }
        return await GalleryItem.find(query).populate('galleryCategoryId').sort({ createdAt: -1 });
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
            { returnDocument: 'after' }
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

    /**
     * Delete all gallery items with a specific title.
     * @param {string} title - The title to delete by.
     * @returns {Promise<Object>}
     */
    async deleteByTitle(title) {
        // Delete all images/items with this title
        const itemResult = await GalleryItem.deleteMany({ title });
        // Also delete the category with this title if it exists
        const categoryResult = await GalleryCategory.deleteMany({ title });
        return { itemsDeleted: itemResult.deletedCount, categoriesDeleted: categoryResult.deletedCount };
    }
}

module.exports = new GalleryService();
