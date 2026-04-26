const ProductExportInquiry = require('../models/ProductExportInquiry');
const StallProductEnquiry = require('../models/StallProductEnquiry');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const SellerSubscriptionPlan = require('../models/add_by_admin/SellerSubscriptionPlan');
const SellerNotification = require('../models/SellerNotification');
const getExhibitorWithPlan = async (exhibitorId) => {
    const exhibitor = await ExhibitorRegistration.findById(exhibitorId)
        .select('isSeller sellerStatus sellerSubscription exhibitorName contact1');
    if (!exhibitor) return null;

    let planDetails = null;
    if (exhibitor.sellerSubscription?.planId) {
        try {
            planDetails = await SellerSubscriptionPlan.findById(exhibitor.sellerSubscription.planId)
                .select('name price currency durationDays features maxLeads maxExportInquiries maxServiceRequests description');
        } catch (_) {}
    }

    return { exhibitor, planDetails };
};

// ─── Helper: Check if seller has a specific feature ──────────────────────────
const hasFeature = (planDetails, featureKey) => {
    if (!planDetails || !planDetails.features) return false;
    return planDetails.features.some(f => f.key === featureKey && f.enabled !== false);
};

// ─── Helper: Check subscription is active ────────────────────────────────────
const isSubscriptionActive = (exhibitor) => {
    if (!exhibitor.isSeller) return false;
    if (exhibitor.sellerStatus !== 'active') return false;
    if (exhibitor.sellerSubscription?.status !== 'active') return false;
    // Check expiry
    if (exhibitor.sellerSubscription?.expiresAt) {
        const expiry = new Date(exhibitor.sellerSubscription.expiresAt);
        if (expiry < new Date()) return false;
    }
    return true;
};

// ─── GET /seller-portal/subscription-info ────────────────────────────────────
exports.getSubscriptionInfo = async (req, res) => {
    try {
        const result = await getExhibitorWithPlan(req.user.id);
        if (!result) return res.status(404).json({ success: false, message: 'Exhibitor not found' });

        const { exhibitor, planDetails } = result;
        const active = isSubscriptionActive(exhibitor);

        // Calculate days remaining
        let daysRemaining = null;
        if (exhibitor.sellerSubscription?.expiresAt) {
            const expiry = new Date(exhibitor.sellerSubscription.expiresAt);
            const now = new Date();
            daysRemaining = Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));
        }

        res.json({
            success: true,
            data: {
                isSeller: exhibitor.isSeller,
                sellerStatus: exhibitor.sellerStatus,
                subscription: {
                    status: exhibitor.sellerSubscription?.status || 'inactive',
                    plan: exhibitor.sellerSubscription?.plan || null,
                    planId: exhibitor.sellerSubscription?.planId || null,
                    expiresAt: exhibitor.sellerSubscription?.expiresAt || null,
                    daysRemaining,
                    isActive: active,
                },
                planDetails: planDetails ? {
                    _id: planDetails._id,
                    name: planDetails.name,
                    price: planDetails.price,
                    currency: planDetails.currency,
                    durationDays: planDetails.durationDays,
                    features: planDetails.features || [],
                    maxLeads: planDetails.maxLeads,
                    maxExportInquiries: planDetails.maxExportInquiries,
                    maxServiceRequests: planDetails.maxServiceRequests,
                    description: planDetails.description,
                } : null,
                // Feature access map
                access: {
                    bsm_marketing: active && hasFeature(planDetails, 'bsm_marketing'),
                    export_inquiry: active && hasFeature(planDetails, 'export_inquiry'),
                    lead_access: active && hasFeature(planDetails, 'lead_access'),
                    service_request: active && hasFeature(planDetails, 'service_request'),
                    premium_support: active && hasFeature(planDetails, 'premium_support'),
                    analytics_dashboard: active && hasFeature(planDetails, 'analytics_dashboard'),
                    product_showcase: active && hasFeature(planDetails, 'product_showcase'),
                    meeting_scheduler: active && hasFeature(planDetails, 'meeting_scheduler'),
                    conference: active && hasFeature(planDetails, 'conference'),
                    logistics: active && hasFeature(planDetails, 'logistics'),
                    accessories: active, // All active sellers can access accessories
                }
            }
        });
    } catch (error) {
        console.error('Subscription info error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// ─── GET /seller-portal/available-plans ──────────────────────────────────────
exports.getAvailablePlans = async (req, res) => {
    try {
        const plans = await SellerSubscriptionPlan.find({ status: 'active' })
            .select('name price currency durationDays features maxLeads maxExportInquiries maxServiceRequests description displayOrder imageUrl')
            .sort({ displayOrder: 1, price: 1 });

        res.json({ success: true, data: plans });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching plans' });
    }
};

// ─── POST /seller-portal/export-inquiry ──────────────────────────────────────
exports.submitExportInquiry = async (req, res) => {
    try {
        const result = await getExhibitorWithPlan(req.user.id);
        if (!result) return res.status(404).json({ success: false, message: 'Exhibitor not found' });

        const { exhibitor, planDetails } = result;

        if (!isSubscriptionActive(exhibitor)) {
            return res.status(403).json({ success: false, message: 'Active subscription required to submit export inquiries.' });
        }
        if (!hasFeature(planDetails, 'export_inquiry')) {
            return res.status(403).json({ success: false, message: 'Your current plan does not include Export Inquiry access. Please upgrade.' });
        }

        // Check limit
        if (planDetails?.maxExportInquiries > 0) {
            const count = await ProductExportInquiry.countDocuments({ exhibitorId: req.user.id });
            if (count >= planDetails.maxExportInquiries) {
                return res.status(403).json({ success: false, message: `Export inquiry limit (${planDetails.maxExportInquiries}) reached for your plan.` });
            }
        }

        const { brandName, contactPerson, email, phone, productCategories, targetCountries, exportExperience, certifications, message } = req.body;
        const inquiry = new ProductExportInquiry({
            exhibitorId: req.user.id,
            brandName, contactPerson, email, phone,
            productCategories, targetCountries, exportExperience, certifications, message
        });
        await inquiry.save();
        res.status(201).json({ success: true, message: 'Export inquiry submitted successfully', data: inquiry });
    } catch (error) {
        console.error('Export Inquiry Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// ─── GET /seller-portal/leads ─────────────────────────────────────────────────
exports.getSellerLeads = async (req, res) => {
    try {
        const result = await getExhibitorWithPlan(req.user.id);
        if (!result) return res.status(404).json({ success: false, message: 'Exhibitor not found' });

        const { exhibitor, planDetails } = result;

        if (!isSubscriptionActive(exhibitor)) {
            return res.status(403).json({ success: false, message: 'Active subscription required to access leads.' });
        }
        if (!hasFeature(planDetails, 'lead_access')) {
            return res.status(403).json({ success: false, message: 'Your current plan does not include Lead Access. Please upgrade.' });
        }

        const leads = await StallProductEnquiry.find({ exhibitorId: req.user.id })
            .populate('productId', 'name images')
            .sort({ createdAt: -1 });

        // Apply limit if set
        const limitedLeads = (planDetails?.maxLeads > 0) ? leads.slice(0, planDetails.maxLeads) : leads;

        res.json({ success: true, data: limitedLeads, total: leads.length, showing: limitedLeads.length });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching leads' });
    }
};

// ─── GET /seller-portal/stats ─────────────────────────────────────────────────
exports.getSellerStats = async (req, res) => {
    try {
        const exhibitorId = req.user.id;

        const result = await getExhibitorWithPlan(exhibitorId);
        if (!result) return res.status(404).json({ success: false, message: 'Exhibitor not found' });

        const { exhibitor, planDetails } = result;
        const active = isSubscriptionActive(exhibitor);

        const SellerServiceRequest = require('../models/SellerServiceRequest');
        
        const [totalLeads, productEnquiries, meetingRequests] = await Promise.all([
            StallProductEnquiry.countDocuments({ exhibitorId }),
            StallProductEnquiry.find({ exhibitorId }).populate('productId', 'views enquiryCount'),
            SellerServiceRequest.countDocuments({ 
                exhibitorId, 
                serviceType: 'meeting',
                status: { $in: ['pending', 'reviewed'] }
            })
        ]);

        let totalViews = 0;
        productEnquiries.forEach(enq => {
            if (enq.productId) totalViews += (enq.productId.views || 0);
        });

        // Calculate profile completion
        const profileFields = [
            exhibitor.companyName,
            exhibitor.brandName,
            exhibitor.companyDescription,
            exhibitor.website,
            exhibitor.logo,
            exhibitor.brochure,
            exhibitor.productCatalogue,
            exhibitor.contact1?.email,
            exhibitor.contact1?.mobile,
            exhibitor.contact2?.email,
            exhibitor.kycDocuments?.gstCertificate,
            exhibitor.kycDocuments?.panCard,
            exhibitor.kycDocuments?.registrationCertificate,
            exhibitor.kycDocuments?.authorizedSignatoryId,
            exhibitor.productCategories?.length > 0,
            exhibitor.socialMedia?.facebook || exhibitor.socialMedia?.instagram || exhibitor.socialMedia?.linkedin
        ];
        const filledFields = profileFields.filter(f => f).length;
        const profileCompletion = Math.round((filledFields / profileFields.length) * 100);

        // Days remaining
        let daysRemaining = null;
        if (exhibitor.sellerSubscription?.expiresAt) {
            const expiry = new Date(exhibitor.sellerSubscription.expiresAt);
            daysRemaining = Math.max(0, Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)));
        }

        res.json({
            success: true,
            data: {
                totalLeads,
                totalViews,
                meetingRequests,
                profileCompletion,
                profileVisibility: totalViews + (totalLeads * 10),
                visibilityScore: active ? Math.min(100, 60 + (totalLeads * 2) + (totalViews)) : 0,
                subscriptionActive: active,
                daysRemaining,
                planName: planDetails?.name || null,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching stats' });
    }
};

// ─── POST /seller-portal/service-request ─────────────────────────────────────
exports.submitServiceRequest = async (req, res) => {
    try {
        const result = await getExhibitorWithPlan(req.user.id);
        if (!result) return res.status(404).json({ success: false, message: 'Exhibitor not found' });

        const { exhibitor, planDetails } = result;

        if (!isSubscriptionActive(exhibitor)) {
            return res.status(403).json({ success: false, message: 'Active subscription required to submit service requests.' });
        }
        if (!hasFeature(planDetails, 'service_request')) {
            return res.status(403).json({ success: false, message: 'Your current plan does not include Service Requests. Please upgrade.' });
        }

        // Check limit
        if (planDetails?.maxServiceRequests > 0) {
            const SellerServiceRequest = require('../models/SellerServiceRequest');
            const count = await SellerServiceRequest.countDocuments({ exhibitorId: req.user.id });
            if (count >= planDetails.maxServiceRequests) {
                return res.status(403).json({ success: false, message: `Service request limit (${planDetails.maxServiceRequests}) reached for your plan.` });
            }
        }

        const SellerServiceRequest = require('../models/SellerServiceRequest');
        const { serviceType, serviceName, details } = req.body;
        const request = new SellerServiceRequest({
            exhibitorId: req.user.id,
            serviceType, serviceName, details
        });
        await request.save();
        res.status(201).json({ success: true, message: 'Request submitted successfully', data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// ─── GET /seller-portal/service-requests ─────────────────────────────────────
exports.getServiceRequests = async (req, res) => {
    try {
        const SellerServiceRequest = require('../models/SellerServiceRequest');
        const requests = await SellerServiceRequest.find({ exhibitorId: req.user.id })
            .sort({ createdAt: -1 });
        res.json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching service requests' });
    }
};

// ─── GET /seller-portal/conference-sessions ───────────────────────────────────
exports.getConferenceSessions = async (req, res) => {
    try {
        const result = await getExhibitorWithPlan(req.user.id);
        if (!result) return res.status(404).json({ success: false, message: 'Exhibitor not found' });

        const { exhibitor, planDetails } = result;
        const active = isSubscriptionActive(exhibitor);
        const hasConferenceAccess = active && hasFeature(planDetails, 'conference');

        // Fetch sessions from DB if model exists, else return structured response
        let sessions = [];
        try {
            const ConferenceSession = require('../models/ConferenceSession');
            sessions = await ConferenceSession.find({ isActive: true }).sort({ date: 1, time: 1 });
        } catch (_) {
            // Model doesn't exist yet - return empty
            sessions = [];
        }

        res.json({
            success: true,
            data: sessions,
            hasAccess: hasConferenceAccess,
            message: hasConferenceAccess ? null : 'Conference access requires an active subscription with conference feature.'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching conference sessions' });
    }
};

// ─── POST /seller-portal/conference-register ──────────────────────────────────
exports.registerForSession = async (req, res) => {
    try {
        const result = await getExhibitorWithPlan(req.user.id);
        if (!result) return res.status(404).json({ success: false, message: 'Exhibitor not found' });

        const { exhibitor, planDetails } = result;

        if (!isSubscriptionActive(exhibitor)) {
            return res.status(403).json({ success: false, message: 'Active subscription required for conference registration.' });
        }
        if (!hasFeature(planDetails, 'conference')) {
            return res.status(403).json({ success: false, message: 'Your current plan does not include Conference access. Please upgrade.' });
        }

        const { sessionId, sessionTitle, sessionDate, sessionTime, sessionHall } = req.body;

        // Store registration
        const SellerServiceRequest = require('../models/SellerServiceRequest');
        const reg = new SellerServiceRequest({
            exhibitorId: req.user.id,
            serviceType: 'conference',
            serviceName: sessionTitle || 'Conference Session',
            details: { sessionId, sessionDate, sessionTime, sessionHall }
        });
        await reg.save();

        res.status(201).json({ success: true, message: 'Registered for session successfully', data: reg });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// ─── GET /seller-portal/logistics-requests ────────────────────────────────────
exports.getLogisticsRequests = async (req, res) => {
    try {
        const SellerServiceRequest = require('../models/SellerServiceRequest');
        const requests = await SellerServiceRequest.find({
            exhibitorId: req.user.id,
            serviceType: 'logistics'
        }).sort({ createdAt: -1 });

        res.json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching logistics requests' });
    }
};

// ─── GET /seller-portal/accessories ──────────────────────────────────────────
exports.getAccessories = async (req, res) => {
    try {
        const result = await getExhibitorWithPlan(req.user.id);
        if (!result) return res.status(404).json({ success: false, message: 'Exhibitor not found' });

        const { exhibitor } = result;

        if (!isSubscriptionActive(exhibitor)) {
            return res.status(403).json({ success: false, message: 'Active subscription required to access accessories.' });
        }

        // Delegate to stall accessories
        const StallAccessory = require('../models/StallAccessory');
        const accessories = await StallAccessory.find({ isActive: true }).sort({ category: 1, name: 1 });

        res.json({ success: true, data: accessories });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching accessories' });
    }
};
exports.createSubscriptionOrder = async (req, res) => {
    try {
        const { planId } = req.body;
        if (!planId) return res.status(400).json({ success: false, message: 'planId is required' });

        const plan = await SellerSubscriptionPlan.findById(planId);
        if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
        if (plan.status !== 'active') return res.status(400).json({ success: false, message: 'Plan is not available' });

        const razorpay = require('../utils/razorpay');
        const amountPaise = Math.round(plan.price * 100); // convert to paise

        const order = await razorpay.orders.create({
            amount: amountPaise,
            currency: plan.currency === 'INR' ? 'INR' : plan.currency,
            receipt: `sub_${req.user.id}_${Date.now()}`,
            notes: {
                planId: plan._id.toString(),
                planName: plan.name,
                exhibitorId: req.user.id,
            }
        });

        res.json({
            success: true,
            order,
            plan: {
                _id: plan._id,
                name: plan.name,
                price: plan.price,
                currency: plan.currency,
                durationDays: plan.durationDays,
            },
            key: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        });
    } catch (error) {
        console.error('Subscription order error:', error);
        res.status(500).json({ success: false, message: 'Failed to create payment order' });
    }
};

// ─── POST /seller-portal/subscription/verify-payment ─────────────────────────
exports.verifySubscriptionPayment = async (req, res) => {
    try {
        const { planId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Verify signature
        const crypto = require('crypto');
        const expectedSig = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSig !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Payment verification failed: invalid signature' });
        }

        // Fetch plan details
        const plan = await SellerSubscriptionPlan.findById(planId);
        if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

        // Calculate expiry date
        const now = new Date();
        const expiresAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

        // Update exhibitor subscription
        const updated = await ExhibitorRegistration.findByIdAndUpdate(
            req.user.id,
            {
                isSeller: true,
                sellerStatus: 'active',
                'sellerSubscription.status': 'active',
                'sellerSubscription.planId': plan._id,
                'sellerSubscription.plan': plan.name,
                'sellerSubscription.amount': plan.price,
                'sellerSubscription.startDate': now,
                'sellerSubscription.expiresAt': expiresAt,
                'sellerSubscription.paymentId': razorpay_payment_id,
                'sellerSubscription.transactionId': razorpay_order_id,
            },
            { new: true }
        );

        if (!updated) return res.status(404).json({ success: false, message: 'Exhibitor not found' });

        res.json({
            success: true,
            message: `Subscription activated! Your ${plan.name} plan is now active.`,
            data: {
                planName: plan.name,
                expiresAt,
                daysRemaining: plan.durationDays,
            }
        });
    } catch (error) {
        console.error('Subscription verify error:', error);
        res.status(500).json({ success: false, message: 'Payment verification failed' });
    }
};

// ─── Notifications ────────────────────────────────────────────────────────────
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await SellerNotification.find({ exhibitorId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(100);
        
        res.json({ success: true, data: notifications });
    } catch (error) {
        console.error('Fetch notifications error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
};

exports.markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        
        const notification = await SellerNotification.findOneAndUpdate(
            { _id: id, exhibitorId: req.user.id },
            { read: true },
            { new: true }
        );
        
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        
        res.json({ success: true, data: notification });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ success: false, message: 'Failed to mark as read' });
    }
};

exports.markAllNotificationsAsRead = async (req, res) => {
    try {
        await SellerNotification.updateMany(
            { exhibitorId: req.user.id, read: false },
            { read: true }
        );
        
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ success: false, message: 'Failed to mark all as read' });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        
        const notification = await SellerNotification.findOneAndDelete({ 
            _id: id, 
            exhibitorId: req.user.id 
        });
        
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete notification' });
    }
};

// Helper function to create notification
exports.createNotification = async (exhibitorId, type, title, message, priority = 'medium', actionUrl = null) => {
    try {
        const notification = new SellerNotification({
            exhibitorId,
            type,
            title,
            message,
            priority,
            actionUrl
        });
        await notification.save();
        return notification;
    } catch (error) {
        console.error('Create notification error:', error);
    }
};

// ─── Lead Actions ─────────────────────────────────────────────────────────────
exports.markLeadInterested = async (req, res) => {
    try {
        const { leadId } = req.params;
        const lead = await StallProductEnquiry.findOneAndUpdate(
            { _id: leadId, exhibitorId: req.user.id },
            { interested: true, interestedAt: new Date() },
            { new: true }
        );
        
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }
        
        // Create notification
        await exports.createNotification(
            req.user.id,
            'lead',
            'Lead Marked as Interested',
            `You marked ${lead.visitorName} as interested.`,
            'low'
        );
        
        res.json({ success: true, data: lead });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to mark as interested' });
    }
};

exports.scheduleMeetingFromLead = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { visitorName } = req.body;
        
        const SellerServiceRequest = require('../models/SellerServiceRequest');
        const meeting = new SellerServiceRequest({
            exhibitorId: req.user.id,
            serviceType: 'meeting',
            serviceName: `Meeting with ${visitorName}`,
            details: { leadId, visitorName, requestedAt: new Date() }
        });
        await meeting.save();
        
        // Create notification
        await exports.createNotification(
            req.user.id,
            'meeting',
            'Meeting Request Sent',
            `Meeting request sent to ${visitorName}.`,
            'medium'
        );
        
        res.json({ success: true, message: 'Meeting request sent', data: meeting });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to schedule meeting' });
    }
};

exports.sendBrochureToLead = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { email } = req.body;
        
        const lead = await StallProductEnquiry.findOneAndUpdate(
            { _id: leadId, exhibitorId: req.user.id },
            { brochureSent: true, brochureSentAt: new Date() },
            { new: true }
        );
        
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }
        
        // Create notification
        await exports.createNotification(
            req.user.id,
            'lead',
            'Brochure Sent',
            `Brochure sent to ${email}.`,
            'low'
        );
        
        res.json({ success: true, message: 'Brochure sent successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to send brochure' });
    }
};

exports.setLeadPriority = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { priority } = req.body;
        
        const lead = await StallProductEnquiry.findOneAndUpdate(
            { _id: leadId, exhibitorId: req.user.id },
            { priority, prioritySetAt: new Date() },
            { new: true }
        );
        
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }
        
        res.json({ success: true, data: lead });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to set priority' });
    }
};

exports.convertLeadToOpportunity = async (req, res) => {
    try {
        const { leadId } = req.params;
        
        const lead = await StallProductEnquiry.findOneAndUpdate(
            { _id: leadId, exhibitorId: req.user.id },
            { status: 'opportunity', convertedAt: new Date() },
            { new: true }
        );
        
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }
        
        // Create notification
        await exports.createNotification(
            req.user.id,
            'lead',
            'Lead Converted to Opportunity',
            `${lead.visitorName} has been converted to a business opportunity.`,
            'high'
        );
        
        res.json({ success: true, data: lead });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to convert lead' });
    }
};

// ─── Profile Management ───────────────────────────────────────────────────────
exports.getProductCategories = async (req, res) => {
    try {
        const categories = [
            'Herbal & AYUSH',
            'Organic Foods',
            'Natural Cosmetics',
            'Health Supplements',
            'Wellness Equipment',
            'Yoga & Fitness',
            'Spa & Therapy',
            'Nutraceuticals',
            'Medical Devices',
            'Healthcare IT',
            'Ayurvedic Products',
            'Homeopathy',
            'Unani Medicine',
            'Traditional Medicine'
        ];
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
};

exports.getMeetingStats = async (req, res) => {
    try {
        const SellerServiceRequest = require('../models/SellerServiceRequest');
        
        const [totalMeetings, completedMeetings, pendingMeetings] = await Promise.all([
            SellerServiceRequest.countDocuments({ 
                exhibitorId: req.user.id, 
                serviceType: 'meeting' 
            }),
            SellerServiceRequest.countDocuments({ 
                exhibitorId: req.user.id, 
                serviceType: 'meeting',
                status: 'completed'
            }),
            SellerServiceRequest.countDocuments({ 
                exhibitorId: req.user.id, 
                serviceType: 'meeting',
                status: { $in: ['pending', 'reviewed'] }
            })
        ]);
        
        res.json({ 
            success: true, 
            data: {
                totalMeetings,
                completedMeetings,
                pendingMeetings
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch meeting stats' });
    }
};

exports.uploadDocument = async (req, res) => {
    try {
        const { field } = req.body;
        const file = req.file;
        
        if (!file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        const fileUrl = `/uploads/${file.filename}`;
        
        const updateField = field.startsWith('kyc.') 
            ? { [`kycDocuments.${field.split('.')[1]}`]: fileUrl }
            : { [field]: fileUrl };
            
        await ExhibitorRegistration.findByIdAndUpdate(
            req.user.id,
            updateField
        );
        
        await exports.createNotification(
            req.user.id,
            'document',
            'Document Uploaded',
            `${field.replace('kyc.', '')} has been uploaded successfully.`,
            'low'
        );
        
        res.json({ success: true, fileUrl, message: 'File uploaded successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Upload failed' });
    }
};

exports.updateSellerProfile = async (req, res) => {
    try {
        const {
            companyName,
            brandName,
            companyDescription,
            productCategories,
            website,
            socialMedia,
            primaryContact,
            secondaryContact,
            billingContact,
            accountsContact
        } = req.body;
        
        const updated = await ExhibitorRegistration.findByIdAndUpdate(
            req.user.id,
            {
                companyName,
                brandName,
                companyDescription,
                productCategories,
                website,
                socialMedia,
                contact1: primaryContact,
                contact2: secondaryContact,
                billingContact,
                accountsContact,
                profileUpdatedAt: new Date()
            },
            { new: true }
        );
        
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Exhibitor not found' });
        }
        
        await exports.createNotification(
            req.user.id,
            'general',
            'Profile Updated',
            'Your seller profile has been updated successfully.',
            'low'
        );
        
        res.json({ success: true, message: 'Profile updated successfully', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
};

// ─── Stall Map ────────────────────────────────────────────────────────────────
exports.getStallMap = async (req, res) => {
    try {
        const Stall = require('../models/Stall');
        const stalls = await Stall.find({ isActive: true })
            .select('stallNumber hallNumber size type price currency status isCorner position exhibitorId')
            .sort({ hallNumber: 1, stallNumber: 1 });
        
        res.json({ success: true, data: stalls });
    } catch (error) {
        console.error('Stall map error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stall map' });
    }
};

exports.requestCustomSpace = async (req, res) => {
    try {
        const { spaceSize, hallPreference, requirements, budget } = req.body;
        
        const SellerServiceRequest = require('../models/SellerServiceRequest');
        const request = new SellerServiceRequest({
            exhibitorId: req.user.id,
            serviceType: 'custom_space',
            serviceName: 'Custom Space Request',
            details: { spaceSize, hallPreference, requirements, budget, requestedAt: new Date() }
        });
        await request.save();
        
        await exports.createNotification(
            req.user.id,
            'general',
            'Custom Space Request Submitted',
            `Your request for ${spaceSize} sqm custom space has been submitted.`,
            'medium'
        );
        
        res.status(201).json({ success: true, message: 'Custom space request submitted', data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to submit request' });
    }
};

// ─── Marketing Assets ─────────────────────────────────────────────────────────
exports.getMarketingAssets = async (req, res) => {
    try {
        const assets = [
            {
                _id: '1',
                name: 'Social Media Promotion Kit',
                description: 'Complete social media graphics package for Facebook, Instagram, LinkedIn',
                category: 'social_media',
                fileType: 'zip',
                fileSize: '15 MB',
                downloadUrl: '/assets/marketing/social-media-kit.zip',
                thumbnail: '/assets/marketing/thumbnails/social-kit.jpg'
            },
            {
                _id: '2',
                name: 'Official Event Poster',
                description: 'High-resolution event poster with your company logo',
                category: 'poster',
                fileType: 'pdf',
                fileSize: '5 MB',
                downloadUrl: '/assets/marketing/event-poster.pdf',
                thumbnail: '/assets/marketing/thumbnails/poster.jpg'
            },
            {
                _id: '3',
                name: 'Customized Invitation Card',
                description: 'Personalized invitation card for your clients',
                category: 'invitation',
                fileType: 'pdf',
                fileSize: '3 MB',
                downloadUrl: '/assets/marketing/invitation-card.pdf',
                thumbnail: '/assets/marketing/thumbnails/invitation.jpg'
            },
            {
                _id: '4',
                name: 'Email Template Pack',
                description: 'Professional email templates for event promotion',
                category: 'email',
                fileType: 'html',
                fileSize: '2 MB',
                downloadUrl: '/assets/marketing/email-templates.zip',
                thumbnail: '/assets/marketing/thumbnails/email.jpg'
            },
            {
                _id: '5',
                name: 'WhatsApp Promotional Content',
                description: 'Ready-to-share WhatsApp messages and images',
                category: 'whatsapp',
                fileType: 'zip',
                fileSize: '8 MB',
                downloadUrl: '/assets/marketing/whatsapp-content.zip',
                thumbnail: '/assets/marketing/thumbnails/whatsapp.jpg'
            },
            {
                _id: '6',
                name: 'Event Brochure',
                description: 'Complete event brochure with exhibitor information',
                category: 'brochure',
                fileType: 'pdf',
                fileSize: '12 MB',
                downloadUrl: '/assets/marketing/event-brochure.pdf',
                thumbnail: '/assets/marketing/thumbnails/brochure.jpg'
            }
        ];
        
        res.json({ success: true, data: assets });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch marketing assets' });
    }
};

exports.downloadMarketingAsset = async (req, res) => {
    try {
        const { assetId } = req.params;
        
        // Log download
        await exports.createNotification(
            req.user.id,
            'general',
            'Marketing Asset Downloaded',
            'You downloaded a marketing asset.',
            'low'
        );
        
        res.json({ success: true, message: 'Download initiated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Download failed' });
    }
};

// ─── Meeting Types ────────────────────────────────────────────────────────────
exports.getMeetingTypes = async (req, res) => {
    try {
        const types = [
            { value: 'investor', label: 'Investor Meeting', icon: 'TrendingUp', color: '#10b981' },
            { value: 'distributor', label: 'Distributor Meeting', icon: 'Truck', color: '#3b82f6' },
            { value: 'hospital', label: 'Hospital Procurement', icon: 'Building2', color: '#8b5cf6' },
            { value: 'buyer', label: 'General Buyer', icon: 'ShoppingCart', color: '#f59e0b' },
            { value: 'partner', label: 'Business Partner', icon: 'Handshake', color: '#ec4899' }
        ];
        
        res.json({ success: true, data: types });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch meeting types' });
    }
};

exports.scheduleMeetingWithType = async (req, res) => {
    try {
        const { meetingType, visitorName, visitorCompany, preferredDate, preferredTime, notes } = req.body;
        
        const SellerServiceRequest = require('../models/SellerServiceRequest');
        const meeting = new SellerServiceRequest({
            exhibitorId: req.user.id,
            serviceType: 'meeting',
            serviceName: `${meetingType} Meeting with ${visitorName}`,
            details: { 
                meetingType, 
                visitorName, 
                visitorCompany, 
                preferredDate, 
                preferredTime, 
                notes,
                requestedAt: new Date() 
            }
        });
        await meeting.save();
        
        await exports.createNotification(
            req.user.id,
            'meeting',
            'Meeting Scheduled',
            `${meetingType} meeting with ${visitorName} has been scheduled.`,
            'high'
        );
        
        res.status(201).json({ success: true, message: 'Meeting scheduled successfully', data: meeting });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to schedule meeting' });
    }
};

// ─── Sponsorship Types ────────────────────────────────────────────────────────
exports.getSponsorshipTypes = async (req, res) => {
    try {
        const types = [
            {
                _id: '1',
                type: 'title',
                name: 'Title Sponsor',
                description: 'Highest level of sponsorship with maximum brand visibility',
                price: 500000,
                currency: 'INR',
                benefits: [
                    'Logo on all event materials',
                    'Prime booth location',
                    'Speaking opportunity',
                    'VIP passes (10)',
                    'Social media promotion',
                    'Press release mention'
                ],
                available: true,
                slots: 1,
                slotsBooked: 0
            },
            {
                _id: '2',
                type: 'powered_by',
                name: 'Powered By Sponsor',
                description: 'Co-branding opportunity with event',
                price: 300000,
                currency: 'INR',
                benefits: [
                    'Co-branding on materials',
                    'Premium booth location',
                    'VIP passes (6)',
                    'Social media mentions',
                    'Email campaign inclusion'
                ],
                available: true,
                slots: 2,
                slotsBooked: 0
            },
            {
                _id: '3',
                type: 'associate',
                name: 'Associate Sponsor',
                description: 'Strategic partnership level',
                price: 150000,
                currency: 'INR',
                benefits: [
                    'Logo on event website',
                    'Standard booth location',
                    'VIP passes (4)',
                    'Social media mentions'
                ],
                available: true,
                slots: 5,
                slotsBooked: 1
            },
            {
                _id: '4',
                type: 'session',
                name: 'Session Sponsor',
                description: 'Sponsor specific conference sessions',
                price: 75000,
                currency: 'INR',
                benefits: [
                    'Session branding',
                    'Speaking slot',
                    'VIP passes (2)',
                    'Session materials branding'
                ],
                available: true,
                slots: 10,
                slotsBooked: 3
            },
            {
                _id: '5',
                type: 'lanyard',
                name: 'Lanyard Sponsor',
                description: 'Brand on all attendee lanyards',
                price: 50000,
                currency: 'INR',
                benefits: [
                    'Logo on all lanyards',
                    'High visibility',
                    'VIP passes (2)'
                ],
                available: true,
                slots: 1,
                slotsBooked: 0
            },
            {
                _id: '6',
                type: 'delegate_bag',
                name: 'Delegate Bag Sponsor',
                description: 'Brand on all delegate bags',
                price: 40000,
                currency: 'INR',
                benefits: [
                    'Logo on delegate bags',
                    'Insert in bags',
                    'VIP passes (2)'
                ],
                available: true,
                slots: 1,
                slotsBooked: 0
            },
            {
                _id: '7',
                type: 'registration_desk',
                name: 'Registration Desk Sponsor',
                description: 'Brand at registration area',
                price: 30000,
                currency: 'INR',
                benefits: [
                    'Branding at registration',
                    'First impression visibility',
                    'VIP passes (2)'
                ],
                available: true,
                slots: 2,
                slotsBooked: 0
            }
        ];
        
        res.json({ success: true, data: types });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch sponsorship types' });
    }
};

exports.applySponsorshipWithType = async (req, res) => {
    try {
        const { sponsorshipType, sponsorshipName, companyName, contactPerson, email, phone, message } = req.body;
        
        const SellerServiceRequest = require('../models/SellerServiceRequest');
        const application = new SellerServiceRequest({
            exhibitorId: req.user.id,
            serviceType: 'sponsorship',
            serviceName: `${sponsorshipName} Application`,
            details: { 
                sponsorshipType, 
                sponsorshipName,
                companyName, 
                contactPerson, 
                email, 
                phone, 
                message,
                appliedAt: new Date() 
            }
        });
        await application.save();
        
        await exports.createNotification(
            req.user.id,
            'general',
            'Sponsorship Application Submitted',
            `Your application for ${sponsorshipName} has been submitted.`,
            'high'
        );
        
        res.status(201).json({ success: true, message: 'Sponsorship application submitted', data: application });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to submit application' });
    }
};
