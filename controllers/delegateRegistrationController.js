const DelegateRegistration = require('../models/DelegateRegistration');
const razorpay = require('../utils/razorpay');
const crypto = require('crypto');
const { sendWhatsAppMessage, sendOpusWhatsAppMessage } = require('../utils/whatsapp');
const emailService = require('../utils/emailService'); // Ensure you have this
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET;

exports.createRegistration = async (req, res) => {
    try {
        const { sessions, gatewayAmount, ...personalDetails } = req.body;

        // Ensure gatewayAmount matches backend calculation
        let calculatedSubTotal = 0;
        sessions.forEach(s => calculatedSubTotal += s.price);
        
        const gstAmount = Math.round(calculatedSubTotal * 0.18);
        const totalAfterGst = calculatedSubTotal + gstAmount;
        const gatewayChargeAmount = Math.round(totalAfterGst * 0.025);
        const finalTotalAmount = totalAfterGst + gatewayChargeAmount;

        const registration = await DelegateRegistration.create({
            ...personalDetails,
            sessions,
            subTotal: calculatedSubTotal,
            gstAmount,
            gatewayChargeAmount,
            totalAmount: finalTotalAmount,
            paymentStatus: 'pending'
        });

        // Create Razorpay Order
        const options = {
            amount: Math.round(finalTotalAmount * 100), // amount in smallest currency unit
            currency: "INR",
            receipt: `receipt_delegate_${registration._id}`
        };

        const order = await razorpay.orders.create(options);
        
        registration.razorpayOrderId = order.id;
        await registration.save();

        res.status(201).json({
            success: true,
            orderId: order.id,
            registrationId: registration._id,
            amount: options.amount
        });
    } catch (error) {
        console.error('Error creating delegate registration:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { registrationId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET)
                                        .update(body.toString())
                                        .digest('hex');
                                        
        if (expectedSignature === razorpay_signature) {
            const registration = await DelegateRegistration.findById(registrationId);
            registration.paymentStatus = 'paid';
            registration.razorpayPaymentId = razorpay_payment_id;
            registration.razorpaySignature = razorpay_signature;
            await registration.save();

            // Format sessions for email/whatsapp
            const sessionsList = registration.sessions.map(s => `- ${s.title} (${s.date}, ${s.time})`).join('\\n');

            // 1. Send Email
            const emailHtml = `
                <h2>Delegate Registration Confirmed</h2>
                <p>Dear ${registration.title} ${registration.fullName},</p>
                <p>Your delegate registration for IHWE 2026 is confirmed. Below are your selected sessions:</p>
                <pre>${sessionsList}</pre>
                <p>Total Paid: ₹${registration.totalAmount}</p>
                <p>Thank you for registering!</p>
            `;
            try {
                // Assuming standard email service structure
                await emailService.sendEmail({
                    to: registration.email,
                    subject: 'IHWE 2026 - Delegate Registration Confirmation',
                    html: emailHtml
                });
            } catch (err) {
                console.error("Failed to send delegate email:", err);
            }

            // 2. Send WhatsApp using the standard sendWhatsAppMessage (which uses AiSensy + Opus fallback)
            const waMessage = `Dear ${registration.title} ${registration.fullName},\\n\\nYour delegate registration for IHWE 2026 is confirmed!\\n\\nSelected Sessions:\\n${sessionsList}\\n\\nTotal Paid: ₹${registration.totalAmount}\\n\\nThank you,\\nIHWE Team`;
            
            try {
                // We'll use AiSensy parameters if we create a template, otherwise it falls back to raw text.
                // Assuming we'll create a template named 'delegate_registration_confirmation'
                await sendWhatsAppMessage(registration.mobile, waMessage, registration.fullName, {
                    templateName: 'delegate_registration_confirmation',
                    templateParams: [
                        registration.fullName,
                        registration.sessions.map(s => s.title).join(', '),
                        `₹${registration.totalAmount}`
                    ]
                });
            } catch (err) {
                console.error("Failed to send delegate whatsapp:", err);
            }

            res.json({ success: true, message: 'Payment verified successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
