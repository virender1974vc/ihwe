const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/stallAccessoryController');
const jwt = require('jsonwebtoken');
const razorpay = require('../utils/razorpay');
const crypto = require('crypto');
const AccessoryOrder = require('../models/AccessoryOrder');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const pdfGenerator = require('../utils/pdfGenerator');
const emailService = require('../utils/emailService');

// Middleware: allow both admin and exhibitor tokens
const flexAuth = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return next();
    try {
        const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'fallback_secret_key');
        req.user = decoded;
    } catch (_) {}
    next();
};

const requireExhibitor = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer '))
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    try {
        const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'fallback_secret_key');
        if (decoded.role !== 'exhibitor')
            return res.status(403).json({ success: false, message: 'Exhibitor access only' });
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// ── Accessories catalog (public read) ────────────────────────────────────────
router.get('/accessories', ctrl.getAllAccessories);
router.post('/accessories', ctrl.createAccessory);
router.put('/accessories/:id', ctrl.updateAccessory);
router.delete('/accessories/:id', ctrl.deleteAccessory);

// ── Orders ────────────────────────────────────────────────────────────────────
router.get('/orders', flexAuth, ctrl.getAllOrders);
router.get('/orders/:id', flexAuth, ctrl.getOrderById);
router.post('/orders', ctrl.createOrder);           // admin creates order
router.put('/orders/:id', ctrl.updateOrder);
router.delete('/orders/:id', ctrl.deleteOrder);

// ── Exhibitor self-purchase: create Razorpay order ───────────────────────────
router.post('/create-payment-order', requireExhibitor, async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0)
            return res.status(400).json({ success: false, message: 'Invalid amount' });

        const amountInPaise = Math.round(Number(amount) * 100);
        if (amountInPaise < 100)
            return res.status(400).json({ success: false, message: 'Amount too low (min ₹1)' });

        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `acc_${Date.now()}`
        });
        res.json({ success: true, order });
    } catch (err) {
        console.error('Accessory Razorpay Error:', err);
        res.status(500).json({ success: false, message: err?.error?.description || err.message });
    }
});

// ── Exhibitor self-purchase: verify payment & create order ───────────────────
router.post('/verify-payment', requireExhibitor, async (req, res) => {
    try {
        const {
            razorpay_order_id, razorpay_payment_id, razorpay_signature,
            exhibitorRegistrationId, items, notes
        } = req.body;

        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expected = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
            .update(body)
            .digest('hex');

        if (expected !== razorpay_signature)
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });

        const reg = await ExhibitorRegistration.findById(exhibitorRegistrationId);
        if (!reg)
            return res.status(404).json({ success: false, message: 'Registration not found' });

        // Build enriched items
        let subtotal = 0, totalGst = 0;
        const enrichedItems = items.map((item) => {
            const base = item.unitPrice * item.qty;
            const gst = Math.round((base * (item.gstPercent || 0)) * 100) / 10000;
            const total = base + gst;
            subtotal += base;
            totalGst += gst;
            return { ...item, gstAmount: gst, totalPrice: total };
        });

        const orderNo = await AccessoryOrder.generateOrderNo();
        const order = new AccessoryOrder({
            exhibitorRegistrationId,
            registrationId: reg.registrationId,
            exhibitorName: reg.exhibitorName,
            stallNo: reg.participation?.stallFor || '',
            orderNo,
            items: enrichedItems,
            subtotal,
            totalGst,
            grandTotal: subtotal + totalGst,
            paymentStatus: 'paid',
            paymentMode: 'online',
            transactionId: razorpay_payment_id,
            paidAt: new Date(),
            processedBy: reg.exhibitorName,
            notes: notes || '',
        });
        await order.save();

        // Generate receipt PDF + send email
        try {
            const pdfResult = await pdfGenerator.generateAccessoryReceipt(order, reg);
            if (pdfResult?.cloudUrl) {
                order.receiptUrl = pdfResult.cloudUrl;
                await order.save();
            }
            const email = reg.contact1?.email;
            if (email) {
                await emailService.sendAccessoryOrderEmail(reg, order, pdfResult?.filePath);
                order.emailSent = true;
                await order.save();
            }
        } catch (e) {
            console.error('Accessory receipt/email error:', e.message);
        }

        res.json({ success: true, data: order });
    } catch (err) {
        console.error('Accessory verify error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
