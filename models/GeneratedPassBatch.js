const mongoose = require('mongoose');

const GeneratedPassNameSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    selected: { type: Boolean, default: true },
}, { _id: true });

const GeneratedPassBatchSchema = new mongoose.Schema({
    title: { type: String, trim: true, default: '' },
    passType: {
        type: String,
        required: true,
        enum: ['media', 'speaker', 'organizer', 'exhibitor', 'service', 'vehicle', 'visitor', 'food'],
        index: true,
    },
    categoryLabel: { type: String, required: true, trim: true },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'PassTemplate', required: true },
    templateName: { type: String, trim: true, default: '' },
    names: { type: [GeneratedPassNameSchema], default: [] },
    printSettings: {
        passesPerPage: { type: Number, enum: [1, 2, 4, 6, 8, 20], default: 8 },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('GeneratedPassBatch', GeneratedPassBatchSchema);
