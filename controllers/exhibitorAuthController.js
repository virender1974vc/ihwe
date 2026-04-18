const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const emailService = require('../utils/emailService');
const exhibitorRegistrationService = require('../services/exhibitorRegistrationService');

class ExhibitorAuthController {
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password)
                return res.status(400).json({ success: false, message: 'Email and password are required' });

            const exhibitor = await ExhibitorRegistration.findOne({ 'contact1.email': email })
                .sort({ createdAt: -1 })
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


            await emailService.sendOtpEmail(email, otp, exhibitor.exhibitorName);

            res.status(200).json({
                success: true,
                message: 'OTP sent to registered email',
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

    // Send OTP to mobile
    async sendMobileOtp(req, res) {
        try {
            const { mobile } = req.body;
            if (!mobile)
                return res.status(400).json({ success: false, message: 'Mobile number is required' });

            const exhibitor = await ExhibitorRegistration.findOne({ 'contact1.mobile': mobile })
                .sort({ createdAt: -1 });

            if (!exhibitor)
                return res.status(404).json({ success: false, message: 'Exhibitor with this mobile number not found' });

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            exhibitor.otp = otp;
            exhibitor.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
            await exhibitor.save();

            // Try sending via WhatsApp if available
            const { sendWhatsAppOTP } = require('../utils/whatsapp');
            await sendWhatsAppOTP(mobile, otp);

            // Also send via email if exists
            if (exhibitor.contact1.email) {
                await emailService.sendOtpEmail(exhibitor.contact1.email, otp, exhibitor.exhibitorName);
            }

            res.status(200).json({
                success: true,
                message: 'OTP sent to mobile & email',
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

            // Find all registrations for this user by email OR mobile
            const email = req.user.email;
            const mobile = req.user.mobile;

            const rawRegistrations = await ExhibitorRegistration.find({
                $or: [
                    { 'contact1.email': email },
                    { 'contact1.mobile': mobile }
                ]
            })
                .populate('eventId', 'name date location venue startDate endDate')
                .sort({ createdAt: -1 });

            if (!rawRegistrations || rawRegistrations.length === 0)
                return res.status(404).json({ success: false, message: 'No registrations found' });

            // ENRICH: Dynamically bridge data gaps across matched registrations
            const registrations = await exhibitorRegistrationService._enrichRegistrations(rawRegistrations);

            // If an ID is provided in query, return that specific one
            const selectedId = req.query.id;
            let selectedRegistration = null;
            if (selectedId) {
                selectedRegistration = registrations.find(r => (r._id.toString() === selectedId) || (r.id === selectedId));
            }

            // Default to latest if not specified or not found
            if (!selectedRegistration) {
                selectedRegistration = registrations[0];
            }

            res.status(200).json({
                success: true,
                data: selectedRegistration,
                allRegistrations: registrations
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Change password from dashboard
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

            const allowed = ['website', 'address', 'city', 'state', 'country', 'pincode', 'landlineNo', 'fasciaName', 'gstNo', 'panNo', 'contact1', 'contact2', 'natureOfBusiness'];
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

            // Handle file uploads from req.files (Multer fields)
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

                Object.keys(fileFields).forEach(field => {
                    if (req.files[field] && req.files[field][0]) {
                        update[fileFields[field]] = req.files[field][0].path;
                    }
                });
            }

            // Determine which registration to update
            // If an ID is provided in query, we update that one (after verifying ownership)
            // Otherwise we fallback to req.user.id (the one they logged in with)
            const targetId = req.query.id || req.user.id;

            if (!mongoose.Types.ObjectId.isValid(targetId)) {
                console.error('Invalid ID format:', targetId);
                return res.status(400).json({ success: false, message: 'Invalid registration ID format' });
            }

            // Verify ownership if targetId is different from req.user.id
            // Or always verify by email/mobile to be safe
            const exhibition = await ExhibitorRegistration.findById(targetId);
            if (!exhibition) {
                return res.status(404).json({ success: false, message: 'Registration not found' });
            }

            const userEmail = req.user.email;
            const userMobile = req.user.mobile;

            if (exhibition.contact1?.email !== userEmail && exhibition.contact1?.mobile !== userMobile) {
                return res.status(403).json({ success: false, message: 'Access denied. You do not own this registration.' });
            }

            // --- Separate text updates from image/doc updates ---
            const KYC_URL_FIELDS = ['companyLogoUrl','panCardFrontUrl','panCardBackUrl','aadhaarCardFrontUrl','aadhaarCardBackUrl','gstCertificateUrl','cancelledChequeUrl','representativePhotoUrl'];

            const textUpdate = {};
            const imageUpdate = {};
            Object.entries(update).forEach(([k, v]) => {
                if (KYC_URL_FIELDS.includes(k)) {
                    imageUpdate[k] = v;
                } else {
                    textUpdate[k] = v;
                }
            });

            // Sync TEXT fields across all registrations for this user
            if (Object.keys(textUpdate).length > 0) {
                await ExhibitorRegistration.updateMany(
                    {
                        $or: [
                            { 'contact1.email': { $regex: new RegExp(`^${userEmail}$`, 'i') } },
                            { 'contact1.mobile': userMobile },
                            { 'contact2.email': { $regex: new RegExp(`^${userEmail}$`, 'i') } },
                            { 'contact2.mobile': userMobile },
                        ]
                    },
                    { $set: { ...textUpdate, updatedAt: new Date() } },
                    { runValidators: true }
                );
            }

            // Image/doc uploads go ONLY to this specific registration (targetId)
            if (Object.keys(imageUpdate).length > 0) {
                await ExhibitorRegistration.findByIdAndUpdate(
                    targetId,
                    { $set: { ...imageUpdate, updatedAt: new Date() } }
                );
            }

            // Fetch the specific record to return to frontend
            const updated = await ExhibitorRegistration.findById(targetId);

            if (!updated) {
                console.log('No exhibitor found for ID:', targetId);
                return res.status(404).json({ success: false, message: 'Exhibitor not found' });
            }

            console.log('Profile updated successfully for:', targetId);
            res.status(200).json({ success: true, message: 'Profile updated and synced successfully', data: updated });
        } catch (error) {
            console.error('CRITICAL: Update profile error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new ExhibitorAuthController();
