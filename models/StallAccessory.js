const mongoose = require('mongoose');

const StallAccessorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['complimentary', 'purchasable'], required: true },
    description: { type: String, default: '' },
    // Dimensions (for furniture/equipment)
    length: { type: String, default: '' },
    width: { type: String, default: '' },
    height: { type: String, default: '' },
    // Pricing (only for purchasable)
    price: { type: Number, default: 0 },
    gstPercent: { type: Number, default: 18 },
    unit: { type: String, default: 'piece' }, // piece, set, sqft, etc.
    // Image
    imageUrl: { type: String, default: '' },
    // Availability
    isActive: { type: Boolean, default: true },
    // For complimentary: how many are included per stall booking
    includedQty: { type: Number, default: 1 },
    // Category for grouping
    category: { type: String, default: 'General' },
    sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('StallAccessory', StallAccessorySchema);
