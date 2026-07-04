const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const emailService = require('../utils/emailService');
const exhibitorRegistrationService = require('../services/exhibitorRegistrationService');
const aiDocumentVerificationService = require('../services/aiDocumentVerificationService');
const ExhibitorPassRequest = require('../models/ExhibitorPassRequest');
const ExhibitorPassConfig = require('../models/ExhibitorPassConfig');
const { sendWhatsAppOTP } = require('../utils/whatsapp');
const razorpay = require('../utils/razorpay');
const crypto = require('crypto');
const passEmailService = require('../utils/passEmailService');

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const DUMMY_MOBILE_NUMBERS = new Set([
    '98765432' + '11',
    '98765432' + '10',
    '99999' + '99999'
]);

const isDummyMobile = (value) => {
    const digits = String(value || '').replace(/\D/g, '');
    if (DUMMY_MOBILE_NUMBERS.has(digits)) return true;
    if (digits.length > 10 && DUMMY_MOBILE_NUMBERS.has(digits.slice(-10))) return true;
    return false;
};

const normalizeIndianMobile = (value) => {
    if (isDummyMobile(value)) return '';
    const digits = String(value || '').replace(/\D/g, '');
    if (/^[6-9]\d{9}$/.test(digits)) return digits;
    if (/^91[6-9]\d{9}$/.test(digits)) return digits.slice(-10);
    if (/^0[6-9]\d{9}$/.test(digits)) return digits.slice(1);
    return '';
};

const getMobileSearchVariants = (value) => {
    const raw = String(value || '').trim();
    const digits = raw.replace(/\D/g, '');
    let stripped = normalizeIndianMobile(raw);

    if (isDummyMobile(raw)) return [];

    if (!stripped && digits.length >= 10) {
        const lastTen = digits.slice(-10);
        if (/^[6-9]\d{9}$/.test(lastTen) && !isDummyMobile(lastTen)) stripped = lastTen;
    }

    return [...new Set([
        raw,
        digits,
        stripped,
        stripped ? `91${stripped}` : '',
        stripped ? `0${stripped}` : ''
    ].filter(Boolean))];
};

const getOtpResponseMessage = ({ email, mobile }) => {
    if (email && mobile) return 'OTP sent to email and WhatsApp';
    if (email) return 'OTP sent to email only';
    if (mobile) return 'OTP sent to WhatsApp only';
    return 'OTP generated but no delivery channel was available';
};

const safeJson = (value) => {
    try {
        return JSON.stringify(value, null, 2);
    } catch (error) {
        return String(value);
    }
};

async function sendOtpToAvailableChannels(exhibitor, otp, requestedChannel = 'both') {
    const email = exhibitor.contact1?.email?.trim();
    const rawMobile = exhibitor.contact1?.mobile;
    const rawWhatsapp = exhibitor.contact1?.whatsapp;
    const mobile = normalizeIndianMobile(rawWhatsapp) || normalizeIndianMobile(rawMobile);
    const tasks = [];

    console.log('[OTP] Exhibitor:', {
        id: exhibitor._id?.toString(),
        contact1Email: email || null,
        contact1Mobile: rawMobile || null,
        contact1Whatsapp: rawWhatsapp || null,
        finalWhatsappNumber: mobile || null,
        requestedChannel
    });

    if (email && (requestedChannel === 'both' || requestedChannel === 'email')) {
        tasks.push(
            emailService.sendOtpEmail(email, otp, exhibitor.exhibitorName, 'EXHIBITOR')
                .then(result => ({ channel: 'email', success: true, result }))
                .catch(error => ({ channel: 'email', success: false, error: error.message }))
        );
    } else if (!email && (requestedChannel === 'both' || requestedChannel === 'email')) {
        console.log('[OTP] Email skipped: missing email');
    }

    if (mobile && (requestedChannel === 'both' || requestedChannel === 'mobile')) {
        tasks.push(
            sendWhatsAppOTP(mobile, otp, 'EXHIBITOR', exhibitor.exhibitorName)
                .then(result => ({ channel: 'whatsapp', success: !!result?.success, result }))
                .catch(error => ({ channel: 'whatsapp', success: false, error: error.message }))
        );
    } else if (!mobile && (requestedChannel === 'both' || requestedChannel === 'mobile')) {
        const reason = rawMobile || rawWhatsapp
            ? 'missing valid mobile'
            : 'missing mobile';
        console.log(`[OTP] WhatsApp skipped: ${reason}`);
    }

    const settledResults = await Promise.allSettled(tasks);
    const results = settledResults.map(result => result.status === 'fulfilled'
        ? result.value
        : { channel: 'unknown', success: false, error: result.reason?.message || String(result.reason) }
    );

    const emailResult = results.find(result => result.channel === 'email') || null;
    const whatsappResult = results.find(result => result.channel === 'whatsapp') || null;

    console.log('[OTP] Email result:', safeJson(emailResult));
    console.log('[OTP] WhatsApp result:', safeJson(whatsappResult));
    console.log('[OTP] Results:', safeJson(settledResults));

    return {
        email,
        mobile,
        results
    };
}

const FILE_FIELD_LABELS = {
    companyLogo: 'Company Logo',
    panCardFront: 'PAN Card',
    panCardBack: 'PAN Card',
    aadhaarCardFront: 'Aadhaar Card',
    aadhaarCardBack: 'Aadhaar Card',
    gstCertificate: 'GST Certificate',
    cancelledCheque: 'Cancelled Cheque',
    representativePhoto: 'Representative Photo',
};

async function deleteFileFromCloudinary(fileUrl) {
    if (!fileUrl || !fileUrl.includes('cloudinary.com')) return;
    try {
        const urlParts = fileUrl.split('/upload/');
        if (urlParts.length > 1) {
            let publicId = urlParts[1];
            if (publicId.match(/^v\d+\//)) publicId = publicId.replace(/^v\d+\//, '');
            publicId = publicId.substring(0, publicId.lastIndexOf('.')) || publicId;
            await cloudinary.uploader.destroy(publicId, { resource_type: 'image' }).catch(() => { });
            await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }).catch(() => { });
        }
    } catch (err) {
        console.error('Cloudinary deletion error:', err);
    }
}

class ExhibitorAuthController {
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password)
                return res.status(400).json({ success: false, message: 'Email and password are required' });

            const exhibitor = await ExhibitorRegistration.findOne({
                'contact1.email': { $regex: new RegExp(`^${escapeRegex(email.trim())}$`, 'i') }
            }).sort({ createdAt: -1 })
                .select('+password');

            if (!exhibitor)
                return res.status(401).json({ success: false, message: 'Invalid credentials' });

            const isMatch = await bcrypt.compare(password, exhibitor.password || '');
            if (!isMatch)
                return res.status(401).json({ success: false, message: 'Invalid credentials' });

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            exhibitor.otp = otp;
            exhibitor.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
            await exhibitor.save();


            const notification = await sendOtpToAvailableChannels(exhibitor, otp);

            res.status(200).json({
                success: true,
                message: getOtpResponseMessage(notification),
                requiresOtp: true,
                exhibitorId: exhibitor._id
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async verifyOtp(req, res) {
        try {
            const { exhibitorId, otp } = req.body;
            if (!exhibitorId || !otp)
                return res.status(400).json({ success: false, message: 'Exhibitor ID and OTP are required' });

            const exhibitor = await ExhibitorRegistration.findById(exhibitorId).select('+otp +otpExpiry');
            if (!exhibitor)
                return res.status(404).json({ success: false, message: 'Exhibitor not found' });

            if (!exhibitor.otp || exhibitor.otp !== otp)
                return res.status(401).json({ success: false, message: 'Invalid OTP' });

            if (new Date() > exhibitor.otpExpiry)
                return res.status(401).json({ success: false, message: 'OTP has expired. Please log in again.' });

            exhibitor.otp = undefined;
            exhibitor.otpExpiry = undefined;
            await exhibitor.save();

            const token = jwt.sign(
                { id: exhibitor._id, role: 'exhibitor', email: exhibitor.contact1.email, mobile: exhibitor.contact1.mobile, exhibitorName: exhibitor.exhibitorName },
                process.env.JWT_SECRET || 'fallback_secret_key',
                { expiresIn: '7d' }
            );

            // Log login activity
            try {
                const ExhibitorActivityLog = require('../models/ExhibitorActivityLog');
                const newLog = new ExhibitorActivityLog({
                    companyName: exhibitor.exhibitorName || 'Unknown Company',
                    exhibitorId: exhibitor._id,
                    action: 'Logged into Exhibitor Dashboard',
                    details: 'Successful OTP verification',
                    module: 'Authentication',
                    status: 'Success'
                });
                await newLog.save();
                
                const io = req.app.get('io');
                if (io) {
                    io.emit('new_exhibitor_activity_log', newLog);
                }
            } catch (logErr) {
                console.error('Failed to log login activity:', logErr);
            }

            res.status(200).json({
                success: true,
                message: 'Login successful',
                token,
                exhibitor: { id: exhibitor._id, exhibitorName: exhibitor.exhibitorName, email: exhibitor.contact1.email }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async sendEmailOtp(req, res) {
        try {
            const { email } = req.body;
            if (!email)
                return res.status(400).json({ success: false, message: 'Email address is required' });

            const exhibitor = await ExhibitorRegistration.findOne({
                'contact1.email': { $regex: new RegExp(`^${escapeRegex(email.trim())}$`, 'i') }
            }).sort({ createdAt: -1 });

            if (!exhibitor)
                return res.status(404).json({ success: false, message: 'Exhibitor with this email not found' });

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            exhibitor.otp = otp;
            exhibitor.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
            await exhibitor.save();

            const notification = await sendOtpToAvailableChannels(exhibitor, otp, 'email');

            res.status(200).json({
                success: true,
                message: getOtpResponseMessage(notification),
                exhibitorId: exhibitor._id
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Send OTP to mobile
    async sendMobileOtp(req, res) {
        try {
            const { mobile } = req.body;
            if (!mobile)
                return res.status(400).json({ success: false, message: 'Mobile number is required' });

            const mobileVariants = getMobileSearchVariants(mobile);
            if (mobileVariants.length === 0) {
                return res.status(400).json({ success: false, message: 'Valid mobile number is required' });
            }
            const exhibitor = await ExhibitorRegistration.findOne({
                $or: [
                    { 'contact1.mobile': { $in: mobileVariants } },
                    { 'contact1.whatsapp': { $in: mobileVariants } }
                ]
            })
                .sort({ createdAt: -1 });

            if (!exhibitor)
                return res.status(404).json({ success: false, message: 'Exhibitor with this mobile number not found' });

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            exhibitor.otp = otp;
            exhibitor.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
            await exhibitor.save();

            const notification = await sendOtpToAvailableChannels(exhibitor, otp, 'mobile');

            res.status(200).json({
                success: true,
                message: getOtpResponseMessage(notification),
                exhibitorId: exhibitor._id
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getMyDashboard(req, res) {
        try {
            if (req.user.role !== 'exhibitor')
                return res.status(403).json({ success: false, message: 'Access denied. Exhibitors only.' });
            const email = req.user.email;
            const mobile = req.user.mobile;

            // Normalize mobile to handle leading 0s
            let strippedMobile = mobile;
            if (mobile && mobile.startsWith('0')) {
                strippedMobile = mobile.substring(1);
            }

            const rawRegistrations = await ExhibitorRegistration.find({
                $or: [
                    { 'contact1.email': email },
                    { 'contact1.mobile': mobile },
                    { 'contact1.mobile': strippedMobile },
                    { 'contact1.mobile': '0' + strippedMobile }
                ]
            })
                .populate('eventId', 'name date location venue startDate endDate')
                .sort({ createdAt: -1 });

            if (!rawRegistrations || rawRegistrations.length === 0)
                return res.status(404).json({ success: false, message: 'No registrations found' });
            const registrations = rawRegistrations;
            const selectedId = req.query.id;
            let selectedRegistration = null;
            if (selectedId) {
                selectedRegistration = registrations.find(r => (r._id.toString() === selectedId) || (r.id === selectedId));
            }
            if (!selectedRegistration) {
                selectedRegistration = registrations[0];
            }

            let plainReg = selectedRegistration.toObject ? selectedRegistration.toObject() : Object.assign({}, selectedRegistration);

            if (plainReg.clientId) {
                try {
                    const Company = require('../models/Company');
                    const crmCompany = await Company.findById(plainReg.clientId).lean();
                    const mapCrmContact = (contact, existing = {}) => contact ? {
                        title: existing.title || contact.title || '',
                        firstName: existing.firstName || contact.firstName || '',
                        lastName: existing.lastName || contact.surname || contact.lastName || '',
                        email: existing.email || contact.email || '',
                        designation: existing.designation || contact.designation || '',
                        mobile: existing.mobile || contact.mobile || '',
                        whatsapp: existing.whatsapp || contact.whatsapp || contact.mobile || '',
                        alternateNo: existing.alternateNo || contact.alternate || '',
                        photoUrl: existing.photoUrl || contact.photo || contact.photoUrl || '',
                    } : existing;

                    if (crmCompany?.contacts?.[0]) {
                        plainReg.contact1 = mapCrmContact(crmCompany.contacts[0], plainReg.contact1 || {});
                    }
                    if (crmCompany?.contacts?.[1]) {
                        plainReg.contact2 = mapCrmContact(crmCompany.contacts[1], plainReg.contact2 || {});
                    }
                } catch (err) {
                    console.error('CRM contact enrichment error:', err);
                }
            }

            let bestRMVal = plainReg.filledBy;
            if (!bestRMVal || bestRMVal === 'User') {
                const regWithRM = registrations.find(r => r.filledBy && r.filledBy !== 'User');
                if (regWithRM) {
                    bestRMVal = regWithRM.filledBy;
                    plainReg.filledBy = bestRMVal;
                }
            }

            // Resolve filledByFullName from User DB
            if (bestRMVal && bestRMVal !== 'User') {
                try {
                    const User = require('../models/User');
                    const filledByVal = bestRMVal.trim();
                    let adminUser = await User.findOne({ username: filledByVal }).select('fullName username').lean();
                    if (!adminUser) {
                        adminUser = await User.findOne({ username: { $regex: new RegExp(`^${filledByVal}`, 'i') } }).select('fullName username').lean();
                    }
                    if (!adminUser) {
                        adminUser = await User.findOne({ fullName: { $regex: new RegExp(filledByVal, 'i') } }).select('fullName username').lean();
                    }
                    plainReg.filledByFullName = (adminUser?.fullName && adminUser.fullName.trim()) ? adminUser.fullName.trim() : filledByVal;
                    // Ensure the frontend RM fetching logic works even if it uses filledBy
                    if (adminUser?.username) {
                        plainReg.filledBy = adminUser.username;
                    }
                } catch (err) {
                    console.error('filledByFullName lookup error:', err);
                }
            }
            // Fetch Estimate & Invoice
            let estimateDoc = null;
            let invoiceDoc = null;
            if (registrations && registrations.length > 0) {
                try {
                    const Estimate = require('../models/Estimate');
                    const Invoice = require('../models/Invoice');

                    const companyIds = registrations.map(r => r._id.toString());

                    // Fetch latest estimate for any of this user's registrations
                    estimateDoc = await Estimate.findOne({ companyId: { $in: companyIds } })
                        .sort({ added: -1 }).lean();

                    // Fetch latest invoice for any of this user's registrations
                    invoiceDoc = await Invoice.findOne({ companyId: { $in: companyIds } })
                        .sort({ added: -1 }).lean();
                } catch (err) {
                    console.error('Error fetching Estimate/Invoice:', err);
                }
            }
            let mappedEstimate = null;
            if (estimateDoc) {
                mappedEstimate = {
                    id: estimateDoc._id,
                    estimateNo: estimateDoc.est_no,
                    date: estimateDoc.added
                };
            }

            let mappedInvoice = null;
            if (invoiceDoc) {
                mappedInvoice = {
                    id: invoiceDoc._id,
                    invoiceNo: invoiceDoc.inv_no,
                    date: invoiceDoc.added
                };
            }
            res.status(200).json({
                success: true,
                data: {
                    ...plainReg,
                    estimate: mappedEstimate,
                    invoice: mappedInvoice
                },
                allRegistrations: registrations
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getMyAccountOverview(req, res) {
        try {
            if (req.user.role !== 'exhibitor')
                return res.status(403).json({ success: false, message: 'Access denied. Exhibitors only.' });

            const email = req.user.email;
            const mobile = req.user.mobile;
            let strippedMobile = mobile;
            if (mobile && mobile.startsWith('0')) {
                strippedMobile = mobile.substring(1);
            }

            const registrations = await ExhibitorRegistration.find({
                $or: [
                    { 'contact1.email': email },
                    { 'contact1.mobile': mobile },
                    { 'contact1.mobile': strippedMobile },
                    { 'contact1.mobile': '0' + strippedMobile }
                ]
            }).sort({ createdAt: -1 });

            if (!registrations || registrations.length === 0)
                return res.status(404).json({ success: false, message: 'No registrations found' });

            const selectedId = req.query.id;
            let selectedRegistration = selectedId
                ? registrations.find(r => r._id.toString() === selectedId)
                : null;
            if (!selectedRegistration) {
                selectedRegistration = registrations[0];
            }

            const { resolveCompanyAndExhibitor, buildAccountOverview } = require('./accountOverviewController');
            const regId = selectedRegistration._id.toString();
            const { company, exhibitor } = await resolveCompanyAndExhibitor(regId);
            const data = await buildAccountOverview(regId, company, exhibitor || selectedRegistration.toObject());

            res.status(200).json({ success: true, data });
        } catch (error) {
            console.error('Error in getMyAccountOverview:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async changePassword(req, res) {
        try {
            if (req.user.role !== 'exhibitor')
                return res.status(403).json({ success: false, message: 'Access denied.' });

            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword)
                return res.status(400).json({ success: false, message: 'Both current and new password are required' });

            if (newPassword.length < 6)
                return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });

            const exhibitor = await ExhibitorRegistration.findById(req.user.id).select('+password');
            if (!exhibitor)
                return res.status(404).json({ success: false, message: 'Exhibitor not found' });

            const isMatch = await bcrypt.compare(currentPassword, exhibitor.password || '');
            if (!isMatch)
                return res.status(401).json({ success: false, message: 'Current password is incorrect' });

            exhibitor.password = await bcrypt.hash(newPassword, 10);
            await exhibitor.save();

            res.status(200).json({ success: true, message: 'Password changed successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async updateProfile(req, res) {
        try {
            console.log('--- Starting Profile Update ---');
            console.log('User ID from token:', req.user?.id);
            console.log('Body received:', JSON.stringify(req.body, null, 2));
            console.log('Files received:', req.files ? Object.keys(req.files) : 'None');

            if (req.user?.role !== 'exhibitor') {
                console.log('Access denied: Role is not exhibitor');
                return res.status(403).json({ success: false, message: 'Access denied.' });
            }

            const allowed = ['website', 'address', 'city', 'state', 'country', 'pincode', 'landlineNo', 'companyEmail', 'fasciaName', 'gstNo', 'panNo', 'aadhaarNo', 'registrantType', 'contact1', 'contact2', 'natureOfBusiness', 'companyDescription', 'productCategories', 'teamMembers', 'certificates', 'brandName', 'companyLogoUrl', 'typeOfBusiness', 'industrySector', 'socialMedia'];
            const update = {};
            allowed.forEach(key => {
                if (req.body[key] !== undefined) {
                    try {
                        const val = req.body[key];
                        if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
                            update[key] = JSON.parse(val);
                        } else {
                            update[key] = val;
                        }
                    } catch (e) {
                        console.error(`Error parsing field ${key}:`, e);
                        update[key] = req.body[key];
                    }
                }
            });

            if (update.teamMembers !== undefined) {
                if (!Array.isArray(update.teamMembers)) {
                    return res.status(400).json({ success: false, message: 'Team members must be an array' });
                }

                let primaryAssigned = false;
                update.teamMembers = update.teamMembers.slice(0, 50).map((member) => {
                    const sanitized = {
                        name: String(member?.name || '').trim(),
                        designation: String(member?.designation || '').trim(),
                        email: String(member?.email || '').trim().toLowerCase(),
                        mobile: String(member?.mobile || '').trim(),
                        photoUrl: String(member?.photoUrl || '').trim(),
                        isPrimary: Boolean(member?.isPrimary) && !primaryAssigned,
                    };
                    if (sanitized.isPrimary) primaryAssigned = true;
                    return sanitized;
                }).filter((member) => member.name && member.designation && member.email && member.mobile);
            }

            ['contact1', 'contact2'].forEach((contactKey) => {
                if (update[contactKey] !== undefined) {
                    const current = update[contactKey] || {};
                    update[contactKey] = {
                        title: String(current.title || '').trim(),
                        firstName: String(current.firstName || '').trim(),
                        lastName: String(current.lastName || '').trim(),
                        email: String(current.email || '').trim().toLowerCase(),
                        designation: String(current.designation || '').trim(),
                        mobile: String(current.mobile || '').trim(),
                        whatsapp: String(current.whatsapp || current.mobile || '').trim(),
                        alternateNo: String(current.alternateNo || '').trim(),
                        photoUrl: String(current.photoUrl || '').trim(),
                    };
                }
            });

            if (req.files) {
                const fileFields = {
                    companyLogo: 'companyLogoUrl',
                    panCardFront: 'panCardFrontUrl',
                    panCardBack: 'panCardBackUrl',
                    aadhaarCardFront: 'aadhaarCardFrontUrl',
                    aadhaarCardBack: 'aadhaarCardBackUrl',
                    gstCertificate: 'gstCertificateUrl',
                    cancelledCheque: 'cancelledChequeUrl',
                    representativePhoto: 'representativePhotoUrl'
                };

                const uploadedFields = Object.keys(fileFields).filter(field => req.files[field] && req.files[field][0]);
                for (const field of uploadedFields) {
                    const uploadedFile = req.files[field][0];
                    const originalName = uploadedFile.originalname || uploadedFile.name || '';
                    const fileType = (originalName.split('.').pop() || '').toUpperCase();

                    const aiResult = await aiDocumentVerificationService.verifyDocument({
                        fileUrl: uploadedFile.path,
                        documentName: FILE_FIELD_LABELS[field] || field,
                        fileType
                    });

                    if (!aiResult.skipped && aiResult.valid === false) {
                        await Promise.all(uploadedFields.map(f => deleteFileFromCloudinary(req.files[f][0].path)));
                        return res.status(400).json({
                            success: false,
                            message: aiResult.reason || `This file was rejected by AI verification: ${aiResult.issue}`,
                            aiIssue: aiResult.issue
                        });
                    }
                }

                uploadedFields.forEach(field => {
                    update[fileFields[field]] = req.files[field][0].path;
                });
            }

            const targetId = req.query.id && mongoose.Types.ObjectId.isValid(req.query.id)
                ? req.query.id
                : req.user.id;

            console.log('Target ID for Update:', targetId);

            const updated = await ExhibitorRegistration.findByIdAndUpdate(
                targetId,
                { $set: update },
                { returnDocument: 'after', runValidators: false }
            );

            if (!updated) {
                console.log('No exhibitor found for ID:', targetId);
                return res.status(404).json({ success: false, message: 'Exhibitor not found' });
            }

            // Emit live socket event to admin panel
            try {
                const io = req.app.get('io');
                if (io) {
                    // Map field keys to display-friendly names
                    const FIELD_LABELS = {
                        fasciaName: 'Fascia Name',
                        typeOfBusiness: 'Type of Business',
                        industrySector: 'Industry Sector',
                        website: 'Website',
                        gstNo: 'GST No.',
                        panNo: 'PAN No.',
                        landlineNo: 'Landline',
                        companyEmail: 'Company Email',
                        address: 'Address',
                        city: 'City',
                        state: 'State',
                        country: 'Country',
                        pincode: 'Pincode',
                        companyDescription: 'Company Description',
                        brandName: 'Brand Name',
                        teamMembers: 'Team Members',
                        socialMedia: 'Social Media Links',
                        contact1: 'Primary Contact',
                        contact2: 'Secondary Contact',
                    };

                    const changedFields = Object.keys(update)
                        .filter(k => FIELD_LABELS[k])
                        .map(k => FIELD_LABELS[k]);

                    let actionText = changedFields.length > 0
                        ? changedFields.slice(0, 3).join(', ') + (changedFields.length > 3 ? ` +${changedFields.length - 3} more` : '')
                        : 'Profile Details';

                    io.to('admin_room').emit('profile_updated', {
                        clientId: String(updated._id),
                        companyName: updated.exhibitorName || updated.fasciaName || 'An Exhibitor',
                        action: actionText,
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (socketErr) {
                console.error('Socket emit error (non-critical):', socketErr.message);
            }

            console.log('Profile updated successfully for:', targetId);
            res.status(200).json({ success: true, message: 'Profile updated and synced successfully', data: updated });
        } catch (error) {
            console.error('CRITICAL: Update profile error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async uploadTeamMemberPhoto(req, res) {
        try {
            if (req.user?.role !== 'exhibitor') {
                return res.status(403).json({ success: false, message: 'Access denied.' });
            }

            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Please upload a photo' });
            }

            const photoUrl = req.file.path || req.file.secure_url || req.file.url;
            const originalName = req.file.originalname || req.file.name || '';
            const mimeSubtype = String(req.file.mimetype || '').split('/').pop() || '';
            const extension = originalName.includes('.') ? originalName.split('.').pop() : '';
            const fileType = (extension || mimeSubtype).toUpperCase();

            const docType = req.body.documentType === 'idproof' ? 'ID Proof' : 'Person Photo';

            const aiResult = await aiDocumentVerificationService.verifyDocument({
                fileUrl: photoUrl,
                documentName: docType,
                fileType
            });

            const unsafePhotoIssues = new Set([
                'nudity', 'explicit', 'sexual_content', 'adult_content',
                'minor', 'inappropriate', 'inappropriate_content', 'graphic_violence', 'hate'
            ]);
            const aiIssue = String(aiResult.issue || '').toLowerCase();

            let isRejected = false;
            let rejectReason = aiResult.reason;

            if (!aiResult.skipped && aiResult.valid === false) {
                if (docType === 'Person Photo') {
                    if (unsafePhotoIssues.has(aiIssue)) {
                        isRejected = true;
                        rejectReason = aiResult.reason || 'This photo was rejected because it contains inappropriate content.';
                    }
                } else {
                    isRejected = true;
                }
            }

            if (isRejected) {
                await deleteFileFromCloudinary(photoUrl);
                return res.status(400).json({
                    success: false,
                    message: rejectReason,
                    aiIssue: aiResult.issue
                });
            }

            res.status(200).json({
                success: true,
                message: 'Photo uploaded',
                photoUrl,
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async registerSeller(req, res) {
        try {
            if (req.user?.role !== 'exhibitor')
                return res.status(403).json({ success: false, message: 'Access denied.' });

            const { sellerDetails } = req.body;

            // Check for required bank info
            if (!sellerDetails || !sellerDetails.bankName || !sellerDetails.accountNumber || !sellerDetails.ifscCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Bank Name, Account Number, and IFSC Code are required'
                });
            }

            const targetId = req.query.id && mongoose.Types.ObjectId.isValid(req.query.id)
                ? req.query.id
                : req.user.id;

            const updateData = {
                isSeller: true,
                sellerStatus: 'pending',
                brandName: sellerDetails.brandName,
                productCategories: sellerDetails.productCategories,
                businessRegistrationNo: sellerDetails.businessRegistrationNo,
                gstNo: sellerDetails.gstNumber || sellerDetails.gstNo,
                panNo: sellerDetails.panNumber || sellerDetails.panNo,
                website: sellerDetails.website,
                bankDetails: {
                    bankName: sellerDetails.bankName,
                    accountHolder: sellerDetails.accountHolder,
                    accountNumber: sellerDetails.accountNumber,
                    ifscCode: sellerDetails.ifscCode,
                    branch: sellerDetails.branch,
                    accountType: sellerDetails.accountType || 'Current'
                }
            };

            const updated = await ExhibitorRegistration.findByIdAndUpdate(
                targetId,
                { $set: updateData },
                { returnDocument: 'after' }
            );

            if (!updated)
                return res.status(404).json({ success: false, message: 'Exhibitor not found' });

            res.status(200).json({ success: true, message: 'Registered as seller successfully. Please wait for admin approval/subscription activation.', data: updated });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getUpdates(req, res) {
        try {
            if (req.user.role !== 'exhibitor')
                return res.status(403).json({ success: false, message: 'Access denied.' });

            const targetId = req.query.id && mongoose.Types.ObjectId.isValid(req.query.id) ? req.query.id : req.user.id;
            const exhibitor = await ExhibitorRegistration.findById(targetId).populate('eventId', 'startDate endDate');
            if (!exhibitor)
                return res.status(404).json({ success: false, message: 'Exhibitor not found' });

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 3;

            const updates = [];

            // Payment updates
            if (exhibitor.balanceAmount > 0) {
                updates.push({ badge: 'Alert', title: 'Pending Payment', desc: `Please clear your pending balance of INR ${exhibitor.balanceAmount.toLocaleString()}.`, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) });
            } else if (exhibitor.amountPaid === 0 && exhibitor.participation?.total > 0) {
                updates.push({ badge: 'Alert', title: 'Payment Required', desc: 'You have not made any payments towards your stall booking.', date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) });
            }

            // Documents updates
            if (exhibitor.documentStatus === 'pending') {
                updates.push({ badge: 'Alert', title: 'Submit Your Documents', desc: 'Please complete remaining mandatory documents.', date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) });
            }
            if (exhibitor.kycStatus === 'pending' || exhibitor.kycStatus === 'reupload') {
                updates.push({ badge: 'Alert', title: 'KYC Pending', desc: 'Please complete your KYC verification process.', date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) });
            }

            // Profile & MSME
            if (!exhibitor.companyLogoUrl) {
                updates.push({ badge: 'Info', title: 'Upload Company Logo', desc: 'Upload your company logo for the exhibitor directory.', date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) });
            }
            if (!exhibitor.msme?.udyamRegNo) {
                updates.push({ badge: 'Info', title: 'Update MSME Details', desc: 'Update your Udyam Details to claim MSME benefits.', date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) });
            }

            // Event updates
            if (exhibitor.eventId && exhibitor.eventId.startDate) {
                const eventStart = new Date(exhibitor.eventId.startDate);
                const setupStart = new Date(eventStart);
                setupStart.setDate(setupStart.getDate() - 2); // Assume setup is 2 days prior

                // Only show if the event is still in the future
                if (eventStart > new Date()) {
                    updates.push({ badge: 'New', title: 'Exhibition Dates Approaching', desc: `The event starts on ${eventStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}. Prepare your team!`, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) });
                    updates.push({ badge: 'Info', title: 'Stall Setup Dates', desc: `Stall setup begins from ${setupStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.`, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) });
                }
            }

            // Sort: Alerts first, then New, then Info
            const badgePriority = { 'Alert': 1, 'New': 2, 'Info': 3 };
            updates.sort((a, b) => badgePriority[a.badge] - badgePriority[b.badge]);

            // Default updates if empty
            if (updates.length === 0) {
                updates.push({ badge: 'Info', title: 'Welcome to IHWE 2026', desc: 'Thank you for exhibiting with us. Your dashboard is ready.', date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) });
                updates.push({ badge: 'New', title: 'Buyer Seller Meet', desc: 'Connect with quality buyers. Registrations are open.', date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) });
            }

            // Pagination
            const totalUpdates = updates.length;
            const totalPages = Math.ceil(totalUpdates / limit);
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedUpdates = updates.slice(startIndex, endIndex);

            res.status(200).json({
                success: true,
                data: paginatedUpdates,
                pagination: {
                    total: totalUpdates,
                    page,
                    limit,
                    totalPages
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async createPassOrder(req, res) {
        try {
            const exhibitorId = req.user.id;
            const { passType, quantity } = req.body;

            if (!passType || !quantity) {
                return res.status(400).json({ success: false, message: 'Pass type and quantity are required' });
            }

            if (passType === 'service') {
                if (!Array.isArray(personnel) || personnel.length !== Number(quantity)) {
                    return res.status(400).json({ success: false, message: 'Service personnel details are required for every pass' });
                }

                const hasInvalidAadhaar = personnel.some(person =>
                    String(person?.aadhaarNumber || '').replace(/\D/g, '').length !== 12
                );
                if (hasInvalidAadhaar) {
                    return res.status(400).json({ success: false, message: 'A valid 12-digit Aadhaar number is required for every service pass holder' });
                }

                personnel.forEach(person => {
                    person.aadhaarNumber = String(person.aadhaarNumber).replace(/\D/g, '');
                });
            }

            const config = await ExhibitorPassConfig.findOne({ passType, isActive: true });
            if (!config) {
                return res.status(404).json({ success: false, message: 'Pass configuration not found or inactive' });
            }

            // Calculate existing passes
            const existingRequests = await ExhibitorPassRequest.find({ exhibitorId, passType });
            const usedQuantity = existingRequests.reduce((sum, req) => {
                if (req.status !== 'rejected') return sum + req.quantity;
                return sum;
            }, 0);

            const complimentary = config.complimentaryQuota || 0;
            const remainingComplimentary = Math.max(0, complimentary - usedQuantity);
            
            let paidQuantity = quantity;
            if (remainingComplimentary > 0) {
                paidQuantity = Math.max(0, quantity - remainingComplimentary);
            }

            if (paidQuantity <= 0) {
                return res.status(200).json({ success: true, isFree: true });
            }

            const baseAmount = paidQuantity * (config.price || 0);
            const gstPercentage = config.gstPercentage || 18;
            const gstAmount = (baseAmount * gstPercentage) / 100;
            const totalAmount = baseAmount + gstAmount;

            const options = {
                amount: Math.round(totalAmount * 100),
                currency: 'INR',
                receipt: ('rp_' + exhibitorId.toString().slice(-6) + '_' + Date.now().toString(36)).slice(0, 40)
            };

            const order = await razorpay.orders.create(options);
            
            res.status(200).json({
                success: true,
                isFree: false,
                order: order,
                baseAmount,
                gstAmount,
                totalAmount,
                paidQuantity
            });
        } catch (error) {
            console.error('Error creating pass order:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async requestPass(req, res) {
        try {
            const exhibitorId = req.user.id; // from protectExhibitor middleware
            const { passType, quantity, vehicles, personnel, paymentDetails } = req.body;

            if (!passType || !quantity) {
                return res.status(400).json({ success: false, message: 'Pass type and quantity are required' });
            }

            const config = await ExhibitorPassConfig.findOne({ passType, isActive: true });
            if (!config) {
                return res.status(404).json({ success: false, message: 'Pass configuration not found' });
            }

            // Calculate if any passes are paid
            const existingRequests = await ExhibitorPassRequest.find({ exhibitorId, passType });
            const usedQuantity = existingRequests.reduce((sum, req) => {
                if (req.status !== 'rejected') return sum + req.quantity;
                return sum;
            }, 0);

            const complimentary = config.complimentaryQuota || 0;
            const remainingComplimentary = Math.max(0, complimentary - usedQuantity);
            let paidQuantity = Math.max(0, quantity - remainingComplimentary);

            let paymentStatus = paidQuantity > 0 ? 'pending' : 'free';
            let baseAmount = 0, gstAmount = 0, totalAmount = 0;

            if (paidQuantity > 0) {
                baseAmount = paidQuantity * (config.price || 0);
                const gstPercentage = config.gstPercentage || 18;
                gstAmount = (baseAmount * gstPercentage) / 100;
                totalAmount = baseAmount + gstAmount;

                if (!paymentDetails || !paymentDetails.razorpay_payment_id) {
                    return res.status(400).json({ success: false, message: 'Payment details are required for extra passes' });
                }

                const expectedSignature = crypto
                    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                    .update(paymentDetails.razorpay_order_id + '|' + paymentDetails.razorpay_payment_id)
                    .digest('hex');

                if (expectedSignature !== paymentDetails.razorpay_signature) {
                    return res.status(400).json({ success: false, message: 'Invalid payment signature' });
                }

                paymentStatus = 'paid';
            }

            // Create new pass request
            const newRequest = new ExhibitorPassRequest({
                exhibitorId,
                passType,
                quantity,
                vehicles: passType === 'vehicle' ? vehicles : undefined,
                personnel: passType !== 'vehicle' ? personnel : undefined,
                paymentStatus,
                status: (paymentStatus === 'paid' || paymentStatus === 'free') ? 'approved' : 'pending',
                paidQuantity,
                baseAmount,
                gstAmount,
                totalAmount,
                razorpayOrderId: paymentDetails?.razorpay_order_id,
                razorpayPaymentId: paymentDetails?.razorpay_payment_id,
                razorpaySignature: paymentDetails?.razorpay_signature
            });

            await newRequest.save();

            const allocatedEntries = passType === 'vehicle' ? (vehicles || []) : (personnel || []);
            const allocatedTeamMemberIds = allocatedEntries
                .map(entry => entry.teamMemberId)
                .filter(Boolean);

            if (allocatedTeamMemberIds.length > 0) {
                const exhibitor = await ExhibitorRegistration.findById(exhibitorId);
                if (exhibitor) {
                    const allocatedIdSet = new Set(allocatedTeamMemberIds.map(id => String(id)));
                    exhibitor.teamMembers.forEach(member => {
                        if (allocatedIdSet.has(String(member._id))) {
                            member.passes = member.passes || {};
                            member.passes[passType] = true;
                        }
                    });
                    exhibitor.markModified('teamMembers');
                    await exhibitor.save();
                }
            }

            // Trigger Email (QR Code) and WhatsApp via Opus if automatically approved
            if (newRequest.status === 'approved') {
                ExhibitorRegistration.findById(exhibitorId).then(exhibitor => {
                    if (exhibitor) {
                        passEmailService.sendPassNotifications(newRequest, exhibitor).catch(err => {
                            console.error('Failed to send pass notifications background task:', err);
                        });
                    }
                }).catch(err => console.error('Error fetching exhibitor for pass notification:', err));
            }

            res.status(201).json({
                success: true,
                message: `${passType} pass request submitted successfully.`,
                data: newRequest
            });
        } catch (error) {
            console.error('Error submitting pass request:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new ExhibitorAuthController();
