const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
    accessoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'StallAccessory', required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['complimentary', 'purchasable'] },
    qty: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    gstPercent: { type: Number, default: 18 },
    gstAmount: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
});

const AccessoryOrderSchema = new mongoose.Schema({
    exhibitorRegistrationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExhibitorRegistration',
        required: true
    },
    registrationId: { type: String }, // human-readable reg ID like IHWE-EXH-2026-XXXXX
    exhibitorName: { type: String },
    stallNo: { type: String },
    orderNo: { type: String, unique: true },
    items: [OrderItemSchema],
    subtotal: { type: Number, default: 0 },
    totalGst: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    // Payment
    paymentStatus: { type: String, enum: ['pending', 'paid', 'complimentary'], default: 'pending' },
    paymentMode: { type: String, default: '' },
    transactionId: { type: String, default: '' },
    paidAt: { type: Date },
    // Admin who processed
    processedBy: { type: String, default: 'Admin' },
    notes: { type: String, default: '' },
    // Receipt
    receiptUrl: { type: String, default: '' },
    // Email sent
    emailSent: { type: Boolean, default: false },
}, { timestamps: true });

// Auto-generate order number
AccessoryOrderSchema.statics.generateOrderNo = async function () {
    const year = new Date().getFullYear();
    const prefix = `ACC-${year}-`;
    const last = await this.findOne({ orderNo: { $regex: `^${prefix}` } }).sort({ createdAt: -1 });
    let seq = 1;
    if (last) {
        const parts = last.orderNo.split('-');
        seq = parseInt(parts[parts.length - 1], 10) + 1;
    }
    return `${prefix}${String(seq).padStart(4, '0')}`;
};

module.exports = mongoose.model('AccessoryOrder', AccessoryOrderSchema);
