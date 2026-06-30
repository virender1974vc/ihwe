const DelegateRegistration = require('../models/DelegateRegistration');
const DelegateSession = require('../models/DelegateSession');
const razorpay = require('../utils/razorpay');
const crypto = require('crypto');
const { sendWhatsAppMessage, sendOpusWhatsAppMessage } = require('../utils/whatsapp');
const emailService = require('../utils/emailService'); // Ensure you have this
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET;

exports.createRegistration = async (req, res) => {
    try {
        let sessions = [];
        let specialPasses = [];
        if (req.body.sessions) sessions = JSON.parse(req.body.sessions);
        if (req.body.specialPasses) specialPasses = JSON.parse(req.body.specialPasses);

        const { gatewayAmount, ...personalDetails } = req.body;

        // Handle profile image upload
        if (req.file) {
            personalDetails.profileImage = `/uploads/delegates/${req.file.filename}`;
        }

        // Ensure gatewayAmount matches backend calculation
        let calculatedSubTotal = 0;
        sessions.forEach(s => calculatedSubTotal += s.price);
        specialPasses.forEach(p => calculatedSubTotal += p.price);

        const gstAmount = Math.round(calculatedSubTotal * 0.18);
        const totalAfterGst = calculatedSubTotal + gstAmount;
        const gatewayChargeAmount = Math.round(totalAfterGst * 0.025);
        const finalTotalAmount = totalAfterGst + gatewayChargeAmount;

        // Generate regNo: DEL-IHWE-1000 + logic
        // Get the latest regNo to increment
        const lastReg = await DelegateRegistration.findOne().sort({ createdAt: -1 });
        let newRegNo = 'DEL-IHWE-1001';
        if (lastReg && lastReg.regNo && lastReg.regNo.startsWith('DEL-IHWE-')) {
            const lastNumber = parseInt(lastReg.regNo.replace('DEL-IHWE-', ''), 10);
            if (!isNaN(lastNumber)) {
                newRegNo = `DEL-IHWE-${lastNumber + 1}`;
            }
        }

        const registration = await DelegateRegistration.create({
            ...personalDetails,
            regNo: newRegNo,
            sessions,
            specialPasses,
            subTotal: calculatedSubTotal,
            gstAmount,
            gatewayChargeAmount,
            totalAmount: finalTotalAmount,
            paymentStatus: 'pending'
        });
        const options = {
            amount: Math.round(finalTotalAmount * 100),
            currency: "INR",
            receipt: `del_req_${registration._id}`
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

            // Map to store unique sessions
            let allSessionsMap = new Map();
            if (registration.sessions && registration.sessions.length > 0) {
                registration.sessions.forEach(s => {
                    allSessionsMap.set(s.title, `- ${s.title} (${s.date || ''}, ${s.time || ''})`);
                });
            }

            // Extract sessions included in passes
            if (registration.specialPasses && registration.specialPasses.length > 0) {
                const allDbSessions = await DelegateSession.find({ isActive: true }).populate('dayId');

                registration.specialPasses.forEach(p => {
                    const pTitle = p.title.toLowerCase();
                    const isFullPass = pTitle.includes('all 3 days') || pTitle.includes('full access') || pTitle.includes('all days');

                    let dayMatch = null;
                    if (pTitle.includes('day 1')) dayMatch = 'Day 1';
                    else if (pTitle.includes('day 2')) dayMatch = 'Day 2';
                    else if (pTitle.includes('day 3')) dayMatch = 'Day 3';

                    allDbSessions.forEach(dbSess => {
                        const sessDayStr = dbSess.dayId ? dbSess.dayId.day : '';
                        const sessDateStr = dbSess.dayId ? dbSess.dayId.date : '';

                        if (isFullPass || (dayMatch && sessDayStr.toLowerCase() === dayMatch.toLowerCase())) {
                            allSessionsMap.set(dbSess.title, `- ${dbSess.title} (${sessDateStr}, ${dbSess.time})`);
                        }
                    });
                });
            }

            const sessionsList = allSessionsMap.size > 0
                ? Array.from(allSessionsMap.values()).join('\n')
                : '';

            const passesList = registration.specialPasses.length > 0
                ? registration.specialPasses.map(p => `- ${p.title}`).join('\n')
                : '';

            const passesSectionHtml = registration.specialPasses.length > 0
                ? `<h3 style="color: #1a5c2a; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px;">Your Event Pass</h3>
                   <ul style="margin: 0; padding-left: 20px; color: #444;">
                       ${registration.specialPasses.map(p => `<li style="margin-bottom: 8px;"><strong>Pass Type:</strong> ${p.title}</li>`).join('')}
                   </ul>`
                : '';

            const sessionsSectionHtml = allSessionsMap.size > 0
                ? `<h3 style="color: #1a5c2a; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px;">Sessions Included</h3>
                   <ul style="margin: 0; padding-left: 20px; color: #444;">
                       ${Array.from(allSessionsMap.values()).map(s => `<li style="margin-bottom: 8px;">${s.replace('- ', '')}</li>`).join('')}
                   </ul>`
                : `<h3 style="color: #1a5c2a; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px;">Sessions Included</h3>
                   <p style="color: #555; margin-top: 0;">No sessions have been selected yet.</p>
                   <p style="color: #777; font-size: 13px;">If session selection is available for your pass, you may choose your preferred sessions before the event through your delegate dashboard.</p>`;

            const emailHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 650px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; background-color: #ffffff;">
                <div style="background-color: #1a5c2a; padding: 25px 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px; letter-spacing: 0.5px;">Registration Confirmed</h1>
                    <p style="margin: 5px 0 0; opacity: 0.9; font-size: 14px;">9th International Health & Wellness Expo 2026</p>
                </div>
                
                <div style="padding: 30px;">
                    <p style="margin-top: 0;">Dear ${registration.title} ${registration.fullName},</p>
                    <p><strong>Namo Gange Namaskar!</strong></p>
                    <p>Thank you for registering for the <strong>9th International Health & Wellness Expo (IHWE) 2026</strong>. We are delighted to confirm that your delegate registration has been successfully completed.</p>
                    
                    <h3 style="color: #1a5c2a; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px;">Registration Details</h3>
                    <table style="width: 100%; border-collapse: collapse; background-color: #f9f9f9; border-radius: 8px; overflow: hidden;">
                        <tr><td style="padding: 10px 15px; border-bottom: 1px solid #eee;"><strong>Registration Number:</strong></td><td style="padding: 10px 15px; border-bottom: 1px solid #eee;">${registration.regNo}</td></tr>
                        <tr><td style="padding: 10px 15px; border-bottom: 1px solid #eee;"><strong>Delegate Name:</strong></td><td style="padding: 10px 15px; border-bottom: 1px solid #eee;">${registration.title} ${registration.fullName}</td></tr>
                        <tr><td style="padding: 10px 15px; border-bottom: 1px solid #eee;"><strong>Registration Status:</strong></td><td style="padding: 10px 15px; border-bottom: 1px solid #eee; color: #1a5c2a; font-weight: bold;">✅ Confirmed</td></tr>
                        <tr><td style="padding: 10px 15px; border-bottom: 1px solid #eee;"><strong>Payment Status:</strong></td><td style="padding: 10px 15px; border-bottom: 1px solid #eee;">Successfully Paid</td></tr>
                        <tr><td style="padding: 10px 15px;"><strong>Total Amount Paid:</strong></td><td style="padding: 10px 15px;">₹${registration.totalAmount}</td></tr>
                    </table>

                    ${passesSectionHtml}

                    ${sessionsSectionHtml}

                    <h3 style="color: #1a5c2a; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px;">Event Details</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #444;">
                        <li style="margin-bottom: 8px;"><strong>Event:</strong> 9th International Health & Wellness Expo (IHWE) 2026</li>
                        <li style="margin-bottom: 8px;"><strong>Venue:</strong> Bharat Mandapam (Pragati Maidan), New Delhi</li>
                        <li style="margin-bottom: 8px;"><strong>Dates:</strong> 21–23 August 2026</li>
                    </ul>

                    <h3 style="color: #1a5c2a; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px;">Important Information</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #444;">
                        <li style="margin-bottom: 8px;">Please carry this confirmation email or your digital/printed delegate pass while visiting the venue.</li>
                        <li style="margin-bottom: 8px;">A valid government-issued photo ID may be required for entry verification.</li>
                        <li style="margin-bottom: 8px;">Kindly arrive at least <strong>30–45 minutes before</strong> your scheduled session to complete the check-in process smoothly.</li>
                        <li style="margin-bottom: 8px;">Your registration is valid only for the pass and sessions mentioned above.</li>
                    </ul>
                    
                    <p style="margin-top: 30px;">We are excited to welcome you to one of India's leading health and wellness exhibitions, where you will have the opportunity to connect with industry leaders, healthcare professionals, innovators, exhibitors, and fellow delegates.</p>
                    
                    <p>If you have any questions or require any assistance, please feel free to contact us:</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:info@ihwe.in" style="color: #1a5c2a; text-decoration: none;">info@ihwe.in</a></p>
                    <p style="margin: 5px 0;"><strong>Website:</strong> <a href="http://www.ihwe.in" style="color: #1a5c2a; text-decoration: none;">www.ihwe.in</a></p>
                    
                    <p style="margin-top: 30px; margin-bottom: 5px;">Warm Regards,</p>
                    <p style="margin: 0;"><strong>Team IHWE 2026</strong><br>Namo Gange Wellness Pvt. Ltd.</p>
                </div>
                <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #e0e0e0;">
                    <p style="margin: 0;">&copy; 2026 IHWE. All Rights Reserved.</p>
                </div>
            </div>
            `;

            try {
                if (emailService && emailService.sendEmail) {
                    await emailService.sendEmail({
                        to: registration.email,
                        subject: 'IHWE 2026 - Delegate Registration Confirmation',
                        html: emailHtml
                    });
                }
            } catch (err) {
                console.error("Failed to send delegate email:", err);
            }

            let waMessage = `Namo Gange Namaskar!\n\nDear ${registration.title} ${registration.fullName},\n\nThank you for registering for the *9th International Health & Wellness Expo (IHWE) 2026*. We are delighted to confirm that your delegate registration has been successfully completed.\n\n*Registration Details*\n- Registration No: ${registration.regNo}\n- Delegate Name: ${registration.title} ${registration.fullName}\n- Registration Status: ✅ Confirmed\n- Payment Status: Successfully Paid\n- Total Amount Paid: ₹${registration.totalAmount}\n`;

            if (registration.specialPasses && registration.specialPasses.length > 0) {
                waMessage += `\n*Your Event Pass*\n${registration.specialPasses.map(p => `- ${p.title}`).join('\n')}\n`;
            }

            if (allSessionsMap.size > 0) {
                waMessage += `\n*Sessions Included*\n${Array.from(allSessionsMap.values()).map(s => s).join('\n')}\n`;
            } else {
                waMessage += `\n*Sessions Included*\nNo sessions have been selected yet. If session selection is available for your pass, you may choose your preferred sessions before the event.\n`;
            }

            waMessage += `\n*Event Details*\n- Venue: Bharat Mandapam (Pragati Maidan), New Delhi\n- Dates: 21–23 August 2026\n\nPlease carry this confirmation email or your digital/printed delegate pass while visiting the venue.\n\nWarm Regards,\n*Team IHWE 2026*\nNamo Gange Wellness Pvt. Ltd.`;

            try {
                await sendWhatsAppMessage(registration.mobile, waMessage, registration.fullName);
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

exports.getAdminRegistrations = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', eventType = '', paymentStatus = '', passType = '', startDate, endDate } = req.query;

        const query = {};

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } },
                { organization: { $regex: search, $options: 'i' } },
                { regNo: { $regex: search, $options: 'i' } }
            ];
        }

        if (paymentStatus && paymentStatus !== 'All Payment Status') {
            query.paymentStatus = paymentStatus.toLowerCase();
        }

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59))
            };
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const total = await DelegateRegistration.countDocuments(query);
        const registrations = await DelegateRegistration.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const stats = await DelegateRegistration.aggregate([
            {
                $group: {
                    _id: null,
                    totalPaid: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] } },
                    totalPending: { $sum: { $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0] } },
                    totalRevenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalAmount", 0] } },
                    totalRegistrations: { $sum: 1 }
                }
            }
        ]);

        const statsData = stats.length > 0 ? stats[0] : { totalPaid: 0, totalPending: 0, totalRevenue: 0 };

        res.json({
            success: true,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            registrations,
            totalPaid: statsData.totalPaid,
            totalPending: statsData.totalPending,
            totalRevenue: statsData.totalRevenue,
            globalTotal: statsData.totalRegistrations || 0
        });
    } catch (error) {
        console.error('Error fetching admin registrations:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
