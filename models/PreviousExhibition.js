const mongoose = require('mongoose');

const auditUserSchema = new mongoose.Schema({
    userId: { type: String, default: '' },
    username: { type: String, default: 'System' },
    fullName: { type: String, default: '' }
}, { _id: false });

const previousExhibitionSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 150 },
    year: {
        type: Number,
        required: true,
        min: 1900,
        max: 2200
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active',
        index: true
    },
    createdBy: { type: auditUserSchema, required: true },
    updatedBy: { type: auditUserSchema, required: true }
}, { timestamps: true });

module.exports = mongoose.model('PreviousExhibition', previousExhibitionSchema);
