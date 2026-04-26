const mongoose = require('mongoose');

const sellerNotificationSchema = new mongoose.Schema({
    exhibitorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exhibitor',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['payment', 'document', 'meeting', 'lead', 'event', 'approval', 'general'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    read: {
        type: Boolean,
        default: false
    },
    actionUrl: {
        type: String
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});
sellerNotificationSchema.index({ exhibitorId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('SellerNotification', sellerNotificationSchema);
