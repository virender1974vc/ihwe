const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
    roomId: { type: String, required: true, index: true },
    exhibitorRegistrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExhibitorRegistration' },
    exhibitorName: { type: String, default: '' },
    buyerRegistrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'BuyerRegistration' },
    buyerName: { type: String, default: '' },
    senderType: { type: String, enum: ['exhibitor', 'admin', 'buyer'], required: true },
    senderId: { type: String, required: true },
    senderName: { type: String, default: '' },
    message: { type: String, required: true, trim: true },
    readByExhibitor: { type: Boolean, default: false },
    readByBuyer: { type: Boolean, default: false },
    readByAdmin: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
