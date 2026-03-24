const mongoose = require('mongoose');

const VendorCardSchema = new mongoose.Schema({
    company: { type: String, required: true },
    address: { type: String, default: '' },
    contactPerson: { type: String, default: '' },
    tel: { type: String, default: '' },
    email: { type: String, default: '' },
    icon: { type: String, default: 'Building2' },
    buttonText: { type: String, default: 'Inquire Now' },
    buttonUrl: { type: String, default: '#' },
    order: { type: Number, default: 0 }
});

const StallVendorSchema = new mongoose.Schema({
    subheading: { type: String, default: 'Our Vendors' },
    heading: { type: String, default: 'Expand Your Brand with Professional Stall Excellence' },
    highlightText: { type: String, default: 'Stall Excellence' },
    description: { type: String, default: '' },
    cards: [VendorCardSchema],
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StallVendor', StallVendorSchema);
