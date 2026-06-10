const mongoose = require('mongoose');

const StallAccessorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['complimentary', 'purchasable'], required: true },
    itemType: { type: String, enum: ['Product', 'Service'], default: 'Product' },
    description: { type: String, default: '' },

    // HSN/SAC Codes
    hsnCode: { type: String, default: '' },
    sacCode: { type: String, default: '' },

    // Dimensions
    length: { type: String, default: '' },
    width: { type: String, default: '' },
    height: { type: String, default: '' },
    dimensionUnit: { type: String, default: '' },

    // Pricing
    price: { type: Number, default: 0 },
    gstPercent: { type: Number, default: 18 },
    unit: { type: String, default: 'piece' },

    // Image
    imageUrl: { type: String, default: '' },

    // Availability & Status
    isActive: { type: Boolean, default: true },
    availableQty: { type: Number, default: 0 },

    // For complimentary
    includedQty: { type: Number, default: 1 },

    // Organization
    category: { type: String, default: 'General' },
    sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('StallAccessory', StallAccessorySchema);
