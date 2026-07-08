const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/stallAccessoryController');
const jwt = require('jsonwebtoken');
const razorpay = require('../utils/razorpay');
const crypto = require('crypto');
const AccessoryOrder = require('../models/AccessoryOrder');
const StallAccessory = require('../models/StallAccessory');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const pdfGenerator = require('../utils/pdfGenerator');
const emailService = require('../utils/emailService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/accessories';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });
const flexAuth = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return next();
    try {
        const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'fallback_secret_key');
        req.user = decoded;
    } catch (_) { }
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

// ── Exhibitor: real complimentary balance for the logged-in exhibitor ────────
router.get('/my-entitlements', requireExhibitor, ctrl.getMyEntitlements);

// ── Accessories catalog (public read) ────────────────────────────────────────
router.get('/accessories', ctrl.getAllAccessories);
router.post('/accessories', upload.single('image'), ctrl.createAccessory);
router.put('/accessories/:id', upload.single('image'), ctrl.updateAccessory);
router.delete('/accessories/:id', ctrl.deleteAccessory);

// ── Orders ────────────────────────────────────────────────────────────────────
router.get('/orders', flexAuth, ctrl.getAllOrders);
router.get('/orders/:id', flexAuth, ctrl.getOrderById);
router.post('/orders', ctrl.createOrder);           // admin creates order
router.put('/orders/:id', ctrl.updateOrder);
router.delete('/orders/:id', ctrl.deleteOrder);
router.put('/orders/:id/view', flexAuth, async (req, res) => {
    try {
        await AccessoryOrder.findByIdAndUpdate(req.params.id, { isViewed: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

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

        await ctrl.assertComplimentaryWithinEntitlement(exhibitorRegistrationId, items);

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
        
        // Update stock availability
        try {
            for (const item of items) {
                if (item.accessoryId) {
                    await StallAccessory.updateOne(
                        { _id: item.accessoryId },
                        { $inc: { availableQty: -Math.abs(Number(item.qty || 1)) } }
                    );
                }
            }
        } catch (stockErr) {
            console.error('Stock update error:', stockErr.message);
        }

        // Generate receipt PDF + send email/WhatsApp
        try {
            const pdfResult = await pdfGenerator.generateAccessoryReceipt(order, reg);
            if (pdfResult?.cloudUrl) {
                order.receiptUrl = pdfResult.cloudUrl;
                await order.save();
            }
            const sent = await emailService.sendAccessoryOrderEmail(reg, order, pdfResult?.filePath);
            order.emailSent = !!sent;
            await order.save();
            if (!sent) {
                console.error('Accessory receipt notification failed for order:', order.orderNo);
            }
        } catch (e) {
            console.error('Accessory receipt/email error:', e.message);
        }

        // Emit socket event to admin
        const io = req.app.get('io');
        if (io) {
            io.to('admin_room').emit('accessory_order_placed', {
                orderNo: order.orderNo,
                exhibitorName: order.exhibitorName,
                grandTotal: order.grandTotal,
                paymentMode: order.paymentMode,
                timestamp: Date.now()
            });
        }

        res.json({ success: true, data: order });
    } catch (err) {
        console.error('Accessory verify error:', err);
        res.status(err.status || 500).json({ success: false, message: err.message });
    }
});

// ── Exhibitor self-purchase: submit NEFT details for admin approval ──────────
router.post('/neft-order', requireExhibitor, upload.single('paymentScreenshot'), async (req, res) => {
    try {
        const {
            exhibitorRegistrationId,
            notes
        } = req.body;
        let items;
        let bankTransferDetails;
        try {
            items = typeof req.body.items === 'string' ? JSON.parse(req.body.items) : req.body.items;
            bankTransferDetails = typeof req.body.bankTransferDetails === 'string'
                ? JSON.parse(req.body.bankTransferDetails)
                : req.body.bankTransferDetails;
        } catch (parseErr) {
            return res.status(400).json({ success: false, message: 'Invalid NEFT payment details' });
        }

        if (!exhibitorRegistrationId) {
            return res.status(400).json({ success: false, message: 'Registration is required' });
        }
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'No cart items found' });
        }

        const details = bankTransferDetails || {};
        const required = [
            'transactionReferenceNumber',
            'transactionDate',
            'transferredAmount',
            'senderBankName',
        ];
        for (const key of required) {
            if (!details[key]) {
                return res.status(400).json({ success: false, message: `${key} is required` });
            }
        }

        const amount = Number(details.transferredAmount);
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Valid NEFT amount is required' });
        }
        if (!String(details.senderAccountHolderName || '').trim()) {
            return res.status(400).json({
                success: false,
                message: 'Sender account holder name is required'
            });
        }

        const reg = await ExhibitorRegistration.findById(exhibitorRegistrationId);
        if (!reg) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        await ctrl.assertComplimentaryWithinEntitlement(exhibitorRegistrationId, items);

        let subtotal = 0;
        let totalGst = 0;
        const enrichedItems = items.map((item) => {
            const unitPrice = Number(item.unitPrice || 0);
            const qty = Number(item.qty || 1);
            const gstPercent = Number(item.gstPercent || 0);
            const base = unitPrice * qty;
            const gst = Math.round((base * gstPercent) * 100) / 10000;
            const total = base + gst;
            subtotal += base;
            totalGst += gst;
            return { ...item, unitPrice, qty, gstPercent, gstAmount: gst, totalPrice: total };
        });

        const grandTotal = Math.round((subtotal + totalGst) * 100) / 100;
        if (Math.abs(amount - grandTotal) > 1) {
            return res.status(400).json({ success: false, message: 'NEFT amount must match cart total' });
        }

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
            grandTotal,
            paymentStatus: 'pending',
            paymentMode: 'neft',
            transactionId: String(details.transactionReferenceNumber).trim(),
            bankTransferDetails: {
                transactionReferenceNumber: String(details.transactionReferenceNumber).trim(),
                transactionDate: new Date(details.transactionDate),
                transactionTime: String(details.transactionTime || '').trim(),
                transferredAmount: amount,
                senderBankName: String(details.senderBankName).trim(),
                senderAccountHolderName: String(details.senderAccountHolderName || '').trim(),
                paymentScreenshotUrl: req.file ? `/uploads/accessories/${req.file.filename}` : '',
            },
            paidAt: null,
            processedBy: reg.exhibitorName,
            notes: notes || 'NEFT payment submitted by exhibitor. Awaiting admin approval.',
        });

        await order.save();

        try {
            for (const item of items) {
                if (item.accessoryId) {
                    await StallAccessory.updateOne(
                        { _id: item.accessoryId },
                        { $inc: { availableQty: -Math.abs(Number(item.qty || 1)) } }
                    );
                }
            }
        } catch (stockErr) {
            console.error('Stock update error:', stockErr.message);
        }

        // Emit socket event to admin
        const io = req.app.get('io');
        if (io) {
            io.to('admin_room').emit('accessory_order_placed', {
                orderNo: order.orderNo,
                exhibitorName: order.exhibitorName,
                grandTotal: order.grandTotal,
                paymentMode: order.paymentMode,
                timestamp: Date.now()
            });
        }

        res.status(201).json({ success: true, data: order });
    } catch (err) {
        console.error('Accessory NEFT order error:', err);
        if (err.status) return res.status(err.status).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── Admin: approve pending NEFT payment and generate receipt ─────────────────
router.put('/orders/:id/approve-neft', flexAuth, async (req, res) => {
    try {
        const order = await AccessoryOrder.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        if (order.paymentStatus === 'paid') {
            return res.json({ success: true, data: order, message: 'Order already paid' });
        }
        if (order.paymentMode !== 'neft') {
            return res.status(400).json({ success: false, message: 'Only NEFT orders can be approved here' });
        }

        const reg = await ExhibitorRegistration.findById(order.exhibitorRegistrationId);
        if (!reg) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        order.paymentStatus = 'paid';
        order.paidAt = new Date();
        order.transactionId = req.body?.transactionId || `NEFT-${Date.now()}`;
        order.processedBy = req.body?.processedBy || req.user?.name || req.user?.email || 'Admin';
        if (req.body?.notes) order.notes = req.body.notes;
        await order.save();

        try {
            const pdfResult = await pdfGenerator.generateAccessoryReceipt(order, reg);
            if (pdfResult?.cloudUrl) {
                order.receiptUrl = pdfResult.cloudUrl;
                await order.save();
            }
            const sent = await emailService.sendAccessoryOrderEmail(reg, order, pdfResult?.filePath);
            order.emailSent = !!sent;
            await order.save();
            if (!sent) {
                console.error('Accessory NEFT approval notification failed for order:', order.orderNo);
            }
        } catch (e) {
            console.error('Accessory NEFT approval receipt/email error:', e.message);
        }

        res.json({ success: true, data: order });
    } catch (err) {
        console.error('Accessory NEFT approval error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
