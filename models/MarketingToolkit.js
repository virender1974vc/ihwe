const mongoose = require('mongoose');

const MarketingToolkitSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        default: 'Social Media'
    },
    type: {
        type: String,
        default: ''
    },
    templateUrl: {
        type: String,
        required: true
    },
    thumbnailUrl: {
        type: String
    },
    config: {
        logoPosition: {
            x: { type: Number, default: 0 },
            y: { type: Number, default: 0 },
            width: { type: Number, default: 100 },
            height: { type: Number, default: 100 }
        },
        textPosition: {
            x: { type: Number, default: 0 },
            y: { type: Number, default: 0 },
            fontSize: { type: Number, default: 24 },
            color: { type: String, default: '#000000' }
        },
        standNoPosition: {
            x: { type: Number, default: 0 },
            y: { type: Number, default: 0 },
            fontSize: { type: Number, default: 24 },
            color: { type: String, default: '#000000' }
        }
    },
    assignedExhibitorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExhibitorRegistration',
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    usageCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MarketingToolkit', MarketingToolkitSchema);
