const express = require('express');
const router = express.Router();
const razorpay = require('../utils/razorpay');
const crypto = require('crypto');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const pdfGenerator = require('../utils/pdfGenerator');
const emailService = require('../utils/emailService');
const whatsappService = require('../utils/whatsappService');
const { logActivity } = require('../utils/logger');
router.post('/create-order/:registrationId', async (req, res) => {
    try {
        const { registrationId } = req.params;
        const { amount, installmentNumber } = req.body;
        const registration = await ExhibitorRegistration.findById(registrationId);
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }
        const balanceAmount = registration.balanceAmount || 0;
        const penaltyAmount = registration.penaltyAmount || 0;
        const totalPayable = registration.totalPayable || (balanceAmount + penaltyAmount);
        let amountToPay = amount;
        if (!amountToPay) {
            amountToPay = totalPayable;
            if (installmentNumber && registration.installments && registration.installments.length > 0) {
                const installment = registration.installments.find(
                    inst => inst.installmentNumber === installmentNumber
                );
                if (installment && installment.status !== 'paid') {
                    amountToPay = installment.dueAmount - (installment.paidAmount || 0);
                }
            }
        }

        // Validate amount
        const amountInPaise = Math.round(Number(amountToPay) * 100);
        if (amountInPaise < 100) {
            return res.status(400).json({
                success: false,
                message: `Amount too low. Minimum is ₹1 (got ₹${amountToPay})`
            });
        }
        const options = {
            amount: amountInPaise,
            currency: registration.participation?.currency || 'INR',
            receipt: `exh_${registrationId.substring(0, 8)}_${Date.now()}`,
            notes: {
                registrationId: registration.registrationId,
                exhibitorName: registration.exhibitorName,
                installmentNumber: installmentNumber || 'full'
            }
        };

        const order = await razorpay.orders.create(options);
        registration.razorpayOrderId = order.id;
        await registration.save();

        res.json({
            success: true,
            order,
            key: process.env.RAZORPAY_KEY_ID,
            amount: amountToPay,
            registration: {
                _id: registration._id,
                exhibitorName: registration.exhibitorName,
                registrationId: registration.registrationId,
                contact1: registration.contact1
            }
        });
    } catch (error) {
        console.error("Razorpay Order Error:", error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment order',
            error: error?.error?.description || error?.message || 'Unknown Razorpay error'
        });
    }
});

// 2. Verify Payment and Update Registration
router.post('/verify-payment', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            registrationId,
            amountPaid,
            paymentType,
            installmentNumber
        } = req.body;

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "placeholder_secret")
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        // Get registration
        const registration = await ExhibitorRegistration.findById(registrationId);
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        const paidAmount = Number(amountPaid) || 0;
        const previousPaid = registration.amountPaid || 0;
        const newTotalPaid = previousPaid + paidAmount;

        // Calculate new balance
        const netPayable = registration.financeBreakdown?.netPayable || registration.participation?.total || 0;
        const newBalance = Math.max(0, netPayable - newTotalPaid);

        // Determine new status
        let newStatus = registration.status;
        if (newBalance <= 0) {
            newStatus = 'paid';
        } else if (newTotalPaid > 0) {
            newStatus = 'advance-paid';
        }

        // Add to payment history
        const paymentEntry = {
            amount: paidAmount,
            paymentType: installmentNumber ? `Installment ${installmentNumber}` : (paymentType || 'full'),
            paymentMode: 'online',
            method: 'Razorpay',
            razorpayPaymentId: razorpay_payment_id,
            transactionId: razorpay_payment_id,
            paidAt: new Date()
        };

        registration.paymentHistory = registration.paymentHistory || [];
        registration.paymentHistory.push(paymentEntry);

        // Update installment if applicable
        if (installmentNumber && registration.installments) {
            const installment = registration.installments.find(
                inst => inst.installmentNumber === installmentNumber
            );
            if (installment) {
                installment.paidAmount = (installment.paidAmount || 0) + paidAmount;
                installment.paidAt = new Date();
                installment.razorpayPaymentId = razorpay_payment_id;
                installment.razorpayOrderId = razorpay_order_id;
                installment.status = installment.paidAmount >= installment.dueAmount ? 'paid' : 'partial';
            }
        }

        // Update registration
        registration.amountPaid = newTotalPaid;
        registration.balanceAmount = newBalance;
        registration.totalPayable = newBalance + (registration.penaltyAmount || 0);
        registration.status = newStatus;
        registration.paymentMode = 'online';
        registration.paymentId = razorpay_payment_id;
        registration.razorpayOrderId = razorpay_order_id;
        registration.razorpaySignature = razorpay_signature;

        // Reset penalty if fully paid
        if (newStatus === 'paid') {
            registration.penaltyAmount = 0;
            registration.penaltyReason = null;
            registration.totalPayable = 0;
        }

        await registration.save();

        // Generate and send receipt
        try {
            const pdfResult = await pdfGenerator.generatePaymentSlip(registration);
            // pdfGenerator returns either a string path or { filePath, cloudUrl } object
            const pdfFilePath = (pdfResult && typeof pdfResult === 'object') ? pdfResult.filePath : pdfResult;
            const pdfUrl = (pdfResult && typeof pdfResult === 'object') ? (pdfResult.cloudUrl || pdfResult.filePath) : pdfResult;

            registration.receiptPdfUrl = pdfUrl || '';
            await registration.save();

            // Send email receipt — pass the actual file path for attachment
            await emailService.sendPaymentReceipt(registration, pdfFilePath);

            // Send WhatsApp confirmation
            if (registration.contact1?.mobile) {
                await whatsappService.sendPaymentConfirmation(registration.contact1.mobile, {
                    contactPerson: `${registration.contact1?.firstName || ''} ${registration.contact1?.lastName || ''}`.trim(),
                    registrationId: registration.registrationId,
                    amountPaid: paidAmount,
                    transactionId: razorpay_payment_id
                });
            }
        } catch (err) {
            console.error('Payment Receipt Error:', err);
        }

        // Log activity
        await logActivity(req, 'Updated', 'Exhibitor Bookings',
            `Payment of ₹${paidAmount} received from ${registration.exhibitorName} (${registration.registrationId}) via Razorpay`
        );

        res.json({
            success: true,
            message: 'Payment verified successfully',
            data: {
                amountPaid: paidAmount,
                totalPaid: newTotalPaid,
                balanceAmount: newBalance,
                status: newStatus
            }
        });
    } catch (error) {
        console.error('Payment Verification Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. Get Payment Summary for Exhibitor
router.get('/summary/:registrationId', async (req, res) => {
    try {
        const { registrationId } = req.params;

        const registration = await ExhibitorRegistration.findById(registrationId)
            .populate('eventId', 'name startDate endDate paymentPlans')
            .select('exhibitorName registrationId participation financeBreakdown amountPaid balanceAmount penaltyAmount totalPayable paymentHistory installments status paymentDueDate paymentPlanType paymentPlanLabel chosenTdsPercent');

        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        const summary = {
            exhibitorName: registration.exhibitorName,
            registrationId: registration.registrationId,
            event: registration.eventId,
            stall: registration.participation,
            finance: {
                // Full breakdown for detailed display
                grossAmount: registration.financeBreakdown?.grossAmount || 0,
                stallDiscountPercent: registration.financeBreakdown?.stallDiscountPercent || 0,
                stallDiscountAmount: registration.financeBreakdown?.stallDiscountAmount || 0,
                subtotal1: registration.financeBreakdown?.subtotal1 || 0,
                discountPercent: registration.financeBreakdown?.discountPercent || 0,
                discountAmount: registration.financeBreakdown?.discountAmount || 0,
                subtotal: registration.financeBreakdown?.subtotal || 0,
                gstAmount: registration.financeBreakdown?.gstAmount || 0,
                tdsPercent: registration.financeBreakdown?.tdsPercent || 0,
                tdsAmount: registration.financeBreakdown?.tdsAmount || 0,
                netPayable: registration.financeBreakdown?.netPayable || 0,
                // Payment tracking
                amountPaid: registration.amountPaid || 0,
                balanceAmount: registration.balanceAmount || 0,
                penaltyAmount: registration.penaltyAmount || 0,
                totalPayable: registration.totalPayable || registration.balanceAmount || 0
            },
            installments: registration.installments || [],
            paymentHistory: registration.paymentHistory || [],
            status: registration.status,
            paymentDueDate: registration.paymentDueDate,
            paymentPlanType: registration.paymentPlanType,
            paymentPlanLabel: registration.paymentPlanLabel,
            chosenTdsPercent: registration.chosenTdsPercent || 0
        };

        res.json({ success: true, data: summary });
    } catch (error) {
        console.error('Payment Summary Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 4. Pay Specific Installment
router.post('/installment/:registrationId/:installmentNumber', async (req, res) => {
    try {
        const { registrationId, installmentNumber } = req.params;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "placeholder_secret")
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        const registration = await ExhibitorRegistration.findById(registrationId);
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        // Find installment
        const installment = registration.installments?.find(
            inst => inst.installmentNumber === parseInt(installmentNumber)
        );

        if (!installment) {
            return res.status(404).json({ success: false, message: 'Installment not found' });
        }

        if (installment.status === 'paid') {
            return res.status(400).json({ success: false, message: 'Installment already paid' });
        }

        // Get payment details from Razorpay
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        const paidAmount = payment.amount / 100;

        // Update installment
        installment.paidAmount = (installment.paidAmount || 0) + paidAmount;
        installment.paidAt = new Date();
        installment.razorpayPaymentId = razorpay_payment_id;
        installment.razorpayOrderId = razorpay_order_id;
        installment.status = installment.paidAmount >= installment.dueAmount ? 'paid' : 'partial';

        // Update overall payment
        registration.amountPaid = (registration.amountPaid || 0) + paidAmount;
        registration.balanceAmount = Math.max(0, (registration.balanceAmount || 0) - paidAmount);
        registration.totalPayable = registration.balanceAmount + (registration.penaltyAmount || 0);

        // Add to payment history
        registration.paymentHistory = registration.paymentHistory || [];
        registration.paymentHistory.push({
            amount: paidAmount,
            paymentType: `Installment ${installmentNumber}`,
            paymentMode: 'online',
            method: 'Razorpay',
            razorpayPaymentId: razorpay_payment_id,
            paidAt: new Date()
        });

        // Check if all installments paid
        const allPaid = registration.installments?.every(inst => inst.status === 'paid');
        if (allPaid || registration.balanceAmount <= 0) {
            registration.status = 'paid';
        } else {
            registration.status = 'advance-paid';
        }

        await registration.save();

        // Send confirmation
        try {
            if (registration.contact1?.mobile) {
                await whatsappService.sendPaymentConfirmation(registration.contact1.mobile, {
                    contactPerson: `${registration.contact1?.firstName || ''} ${registration.contact1?.lastName || ''}`.trim(),
                    registrationId: registration.registrationId,
                    amountPaid: paidAmount,
                    transactionId: razorpay_payment_id
                });
            }
        } catch (err) {
            console.error('WhatsApp Error:', err);
        }

        res.json({
            success: true,
            message: `Installment ${installmentNumber} paid successfully`,
            data: {
                installment: {
                    number: installment.installmentNumber,
                    status: installment.status,
                    paidAmount: installment.paidAmount
                },
                overall: {
                    amountPaid: registration.amountPaid,
                    balanceAmount: registration.balanceAmount,
                    status: registration.status
                }
            }
        });
    } catch (error) {
        console.error('Installment Payment Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 5. Webhook Handler
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
                const paidAmount = payment.amount / 100;
                const netPayable = reg.financeBreakdown?.netPayable || reg.participation?.total || 0;
                const newBalance = Math.max(0, netPayable - paidAmount);

                reg.amountPaid = paidAmount;
                reg.balanceAmount = newBalance;
                reg.status = newBalance > 0 ? 'advance-paid' : 'paid';
                reg.paymentId = payment.id;
                reg.paymentMode = 'online';

                reg.paymentHistory = reg.paymentHistory || [];
                reg.paymentHistory.push({
                    amount: paidAmount,
                    paymentType: 'online',
                    paymentMode: 'online',
                    method: 'Razorpay',
                    razorpayPaymentId: payment.id,
                    paidAt: new Date()
                });

                await reg.save();

                try {
                    const pdfResult = await pdfGenerator.generatePaymentSlip(reg);
                    const pdfFilePath = (pdfResult && typeof pdfResult === 'object') ? pdfResult.filePath : pdfResult;
                    const pdfUrl = (pdfResult && typeof pdfResult === 'object') ? (pdfResult.cloudUrl || pdfResult.filePath) : pdfResult;
                    reg.receiptPdfUrl = pdfUrl || '';
                    await reg.save();
                    await emailService.sendPaymentReceipt(reg, pdfFilePath);
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

// 6. Create Order (Legacy - for backward compatibility)
router.post('/create-order', async (req, res) => {
    try {
        const { amount, currency = "INR" } = req.body;
        if (!amount) return res.status(400).json({ success: false, message: 'Amount is required' });

        const amountInPaise = Math.round(Number(amount) * 100);
        if (amountInPaise < 100) {
            return res.status(400).json({ success: false, message: `Amount too low. Minimum is ₹1 (got ₹${amount})` });
        }

        const options = {
            amount: amountInPaise,
            currency,
            receipt: `rcpt_${Date.now()}`
        };
        const order = await razorpay.orders.create(options);
        res.json({ success: true, order });
    } catch (error) {
        console.error("Razorpay Order Error:", error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment order',
            error: error?.error?.description || error?.message || 'Unknown Razorpay error'
        });
    }
});

module.exports = router;


// 7. Manual Payment Entry (Admin only)
router.post('/manual/:registrationId', async (req, res) => {
    try {
        const { registrationId } = req.params;
        const { amount, method, transactionId, notes, paidAt } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Valid amount is required' });
        }

        const registration = await ExhibitorRegistration.findById(registrationId);
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        const paidAmount = Number(amount);
        const previousPaid = registration.amountPaid || 0;
        const newTotalPaid = previousPaid + paidAmount;

        // Calculate new balance
        const netPayable = registration.financeBreakdown?.netPayable || registration.participation?.total || 0;
        const newBalance = Math.max(0, netPayable - newTotalPaid);

        // Determine new status
        let newStatus = registration.status;
        if (newBalance <= 0) {
            newStatus = 'paid';
        } else if (newTotalPaid > 0) {
            newStatus = 'advance-paid';
        }

        // Add to payment history
        const paymentEntry = {
            amount: paidAmount,
            paymentType: 'manual',
            paymentMode: 'manual',
            method: method || 'Cash',
            transactionId: transactionId || '',
            notes: notes || '',
            paidAt: paidAt ? new Date(paidAt) : new Date()
        };

        registration.paymentHistory = registration.paymentHistory || [];
        registration.paymentHistory.push(paymentEntry);

        // Update registration
        registration.amountPaid = newTotalPaid;
        registration.balanceAmount = newBalance;
        registration.totalPayable = newBalance + (registration.penaltyAmount || 0);
        registration.status = newStatus;
        registration.manualPaymentDetails = {
            method: method || 'Cash',
            transactionId: transactionId || '',
            notes: notes || '',
            updatedAt: new Date()
        };

        // Reset penalty if fully paid
        if (newStatus === 'paid') {
            registration.penaltyAmount = 0;
            registration.penaltyReason = null;
            registration.totalPayable = 0;
        }

        await registration.save();

        // Send receipt
        try {
            const pdfResult = await pdfGenerator.generatePaymentSlip(registration);
            const pdfFilePath = (pdfResult && typeof pdfResult === 'object') ? pdfResult.filePath : pdfResult;
            const pdfUrl = (pdfResult && typeof pdfResult === 'object') ? (pdfResult.cloudUrl || pdfResult.filePath) : pdfResult;
            registration.receiptPdfUrl = pdfUrl || '';
            await registration.save();
            await emailService.sendPaymentReceipt(registration, pdfFilePath);
            if (registration.contact1?.mobile) {
                await whatsappService.sendPaymentConfirmation(registration.contact1.mobile, {
                    contactPerson: `${registration.contact1?.firstName || ''} ${registration.contact1?.lastName || ''}`.trim(),
                    registrationId: registration.registrationId,
                    amountPaid: paidAmount,
                    transactionId: transactionId || 'Manual Payment',
                    companyName: process.env.COMPANY_NAME || 'Exhibition'
                });
            }
        } catch (err) {
            console.error('Manual Payment Receipt Error:', err);
        }

        // Log activity
        await logActivity(req, 'Updated', 'Exhibitor Bookings',
            `Manual payment of ₹${paidAmount} recorded for ${registration.exhibitorName} (${registration.registrationId}) via ${method}`
        );

        res.json({
            success: true,
            message: 'Manual payment recorded successfully',
            data: {
                amountPaid: paidAmount,
                totalPaid: newTotalPaid,
                balanceAmount: newBalance,
                status: newStatus
            }
        });
    } catch (error) {
        console.error('Manual Payment Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
