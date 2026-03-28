const express = require('express');
const router = express.Router();
const razorpay = require('../utils/razorpay');
const crypto = require('crypto');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const pdfGenerator = require('../utils/pdfGenerator');
const emailService = require('../utils/emailService');

// 1. Create Order
router.post('/create-order', async (req, res) => {
    try {
        const { amount, currency = "INR" } = req.body;
        if (!amount) return res.status(400).json({ success: false, message: 'Amount is required' });
        const options = {
            amount: Math.round(Number(amount) * 100),
            currency,
            receipt: `rcpt_${Date.now()}`
        };
        const order = await razorpay.orders.create(options);
        res.json({ success: true, order });
    } catch (error) {
        console.error("Razorpay Order Error:", error);
        res.status(500).json({ success: false, message: 'Failed to create payment order' });
    }
});
router.post('/verify-payment', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, registrationId, amountPaid, paymentType } = req.body;
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "placeholder_secret")
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }
        if (registrationId) {
            const reg = await ExhibitorRegistration.findById(registrationId);
            if (reg) {
                const total = reg.participation?.total || 0;
                const paid = Number(amountPaid) || 0;
                const balance = Math.max(0, total - paid);
                const newStatus = paymentType === 'advance' ? 'advance-paid' : 'paid';

                const updated = await ExhibitorRegistration.findByIdAndUpdate(registrationId, {
                    status: newStatus,
                    paymentMode: 'online',
                    paymentType: paymentType || 'full',
                    amountPaid: paid,
                    balanceAmount: balance,
                    paymentId: razorpay_payment_id,
                    razorpayOrderId: razorpay_order_id,
                    razorpaySignature: razorpay_signature,
                }, { new: true });

                // Send payment receipt email
                try {
                    const pdfPath = await pdfGenerator.generatePaymentSlip(updated);
                    await emailService.sendPaymentReceipt(updated, pdfPath);
                } catch (err) {
                    console.error('Payment Receipt Email Error:', err);
                }
            }
        }

        res.json({ success: true, message: 'Payment verified successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) return res.status(200).json({ received: true });

        const signature = req.headers['x-razorpay-signature'];
        const expectedSig = crypto
            .createHmac('sha256', webhookSecret)
            .update(req.body)
            .digest('hex');

        if (signature !== expectedSig) {
            return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
        }

        const event = JSON.parse(req.body.toString());

        if (event.event === 'payment.captured') {
            const payment = event.payload.payment.entity;
            const orderId = payment.order_id;
            const reg = await ExhibitorRegistration.findOne({ razorpayOrderId: orderId });
            if (reg && reg.status === 'pending') {
                const total = reg.participation?.total || 0;
                const paid = payment.amount / 100;
                const balance = Math.max(0, total - paid);

                const updated = await ExhibitorRegistration.findByIdAndUpdate(reg._id, {
                    status: balance > 0 ? 'advance-paid' : 'paid',
                    amountPaid: paid,
                    balanceAmount: balance,
                    paymentId: payment.id,
                    paymentMode: 'online',
                }, { new: true });

                try {
                    const pdfPath = await pdfGenerator.generatePaymentSlip(updated);
                    await emailService.sendPaymentReceipt(updated, pdfPath);
                } catch (err) {
                    console.error('Webhook Email Error:', err);
                }
            }
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
