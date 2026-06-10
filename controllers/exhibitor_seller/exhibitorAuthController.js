const ExhibitorRegistration = require('../../models/exhibitor_seller/ExhibitorRegistration');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../../utils/emailService');
const exhibitorRegistrationService = require('../../services/exhibitor_seller/exhibitorRegistrationService');

class ExhibitorAuthController {
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password)
                return res.status(400).json({ success: false, message: 'Email and password are required' });

            const exhibitor = await ExhibitorRegistration.findOne({ 
                'contact1.email': { $regex: new RegExp(`^${email.trim()}$`, 'i') } 
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


            await emailService.sendOtpEmail(email, otp, exhibitor.exhibitorName, 'EXHIBITOR');

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

    async sendEmailOtp(req, res) {
        try {
            const { email } = req.body;
            if (!email)
                return res.status(400).json({ success: false, message: 'Email address is required' });

            const exhibitor = await ExhibitorRegistration.findOne({ 
                'contact1.email': { $regex: new RegExp(`^${email.trim()}$`, 'i') } 
            }).sort({ createdAt: -1 });

            if (!exhibitor)
                return res.status(404).json({ success: false, message: 'Exhibitor with this email not found' });

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            exhibitor.otp = otp;
            exhibitor.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
            await exhibitor.save();

            // Send OTP via email
            await emailService.sendOtpEmail(email.trim().toLowerCase(), otp, exhibitor.exhibitorName, 'EXHIBITOR');

            res.status(200).json({
                success: true,
                message: 'OTP sent to registered email',
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

            const exhibitor = await ExhibitorRegistration.findOne({ 'contact1.mobile': mobile })
                .sort({ createdAt: -1 });

            if (!exhibitor)
                return res.status(404).json({ success: false, message: 'Exhibitor with this mobile number not found' });

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            exhibitor.otp = otp;
            exhibitor.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
            await exhibitor.save();

            // Try sending via WhatsApp if available
            const { sendWhatsAppOTP } = require('../../utils/whatsapp');
            await sendWhatsAppOTP(mobile, otp, 'EXHIBITOR', exhibitor.exhibitorName);

            // Also send via email if exists
            if (exhibitor.contact1.email) {
                await emailService.sendOtpEmail(exhibitor.contact1.email, otp, exhibitor.exhibitorName, 'EXHIBITOR');
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
            const registrations = rawRegistrations;
            const selectedId = req.query.id;
            let selectedRegistration = null;
            if (selectedId) {
                selectedRegistration = registrations.find(r => (r._id.toString() === selectedId) || (r.id === selectedId));
            }
            if (!selectedRegistration) {
                selectedRegistration = registrations[0];
            }

            // Resolve filledByFullName from User DB
            if (selectedRegistration && selectedRegistration.filledBy && selectedRegistration.filledBy !== 'User') {
                try {
                    const User = require('../../models/admin_settings/User');
                    const filledByVal = (selectedRegistration.filledBy || '').trim();
                    let adminUser = await User.findOne({ username: filledByVal }).select('fullName username').lean();
                    if (!adminUser) {
                        adminUser = await User.findOne({ username: { $regex: new RegExp(`^${filledByVal}`, 'i') } }).select('fullName username').lean();
                    }
                    if (!adminUser) {
                        adminUser = await User.findOne({ fullName: { $regex: new RegExp(filledByVal, 'i') } }).select('fullName username').lean();
                    }
                    const plain = selectedRegistration.toObject ? selectedRegistration.toObject() : Object.assign({}, selectedRegistration);
                    plain.filledByFullName = (adminUser?.fullName && adminUser.fullName.trim()) ? adminUser.fullName.trim() : filledByVal;
                    selectedRegistration = plain;
                } catch (err) {
                    console.error('filledByFullName lookup error:', err);
                }
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

            const allowed = ['website', 'address', 'city', 'state', 'country', 'pincode', 'landlineNo', 'fasciaName', 'gstNo', 'panNo', 'aadhaarNo', 'registrantType', 'contact1', 'contact2', 'natureOfBusiness', 'companyDescription', 'productCategories', 'teamMembers', 'certificates', 'brandName', 'companyLogoUrl'];
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

            console.log('Profile updated successfully for:', targetId);
            res.status(200).json({ success: true, message: 'Profile updated and synced successfully', data: updated });
        } catch (error) {
            console.error('CRITICAL: Update profile error:', error);
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
}

module.exports = new ExhibitorAuthController();
