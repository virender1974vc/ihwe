const mongoose = require('mongoose');

const BSMTestimonialSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, 'Testimonial text is required'],
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    designation: {
        type: String,
        required: [true, 'Designation/Company is required'],
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('BSMTestimonial', BSMTestimonialSchema);
