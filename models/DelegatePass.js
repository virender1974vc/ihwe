const mongoose = require('mongoose');

const delegatePassSchema = new mongoose.Schema({
    // Multi-event support: which event this pricing tier belongs to. Nullable —
    // existing/shared passes stay visible everywhere until explicitly scoped.
    eventId: { type: mongoose.Schema.Types.ObjectId, default: null },
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
