const mongoose = require('mongoose');

const awardsGallerySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        required: true
    },
    label: {
        type: String,
        default: 'NAMO GANGE GLOBAL HEALTH EXCELLENCE AWARDS'
    },
    order: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    updated_by: {
        type: String,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('AwardsGallery', awardsGallerySchema);
