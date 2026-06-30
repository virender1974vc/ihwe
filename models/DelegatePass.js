const mongoose = require('mongoose');

const delegatePassSchema = new mongoose.Schema({
    passKey: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    subtitle: { type: String },
    price: { type: Number, required: true },
    perks: [{ type: String }],
    isActive: { type: Boolean, default: true },
    addedBy: { type: String },
    updatedBy: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('DelegatePass', delegatePassSchema);
