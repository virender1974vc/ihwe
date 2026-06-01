const mongoose = require('mongoose');

const ExhibitorHeroSliderSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true
    },
    imageAlt: {
        type: String,
        default: ''
    },
    createdBy: {
        type: String,
        default: 'System'
    },
    updatedBy: {
        type: String,
        default: 'System'
    }
}, { timestamps: true });

module.exports = mongoose.model('ExhibitorHeroSlider', ExhibitorHeroSliderSchema);
