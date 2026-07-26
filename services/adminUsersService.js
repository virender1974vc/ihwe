const User = require('../models/User');
const Role = require('../models/Role');
const Department = require('../models/Department');
const Designation = require('../models/Designation');
const jwt = require('jsonwebtoken');

const cleanString = (value) => (typeof value === 'string' ? value.trim() : '');
const cleanOptionalImage = (value) => (typeof value === 'string' ? value : '');
const hasUserManagementPermission = async (requester) => {
    const roleSlug = String(requester?.role || '').toLowerCase().replace(/[^a-z]/g, '');
    if (roleSlug === 'superadmin' || roleSlug === 'ihwesuperadministrator') return true;
    const role = await Role.findOne({ name: requester?.role }).select('permissions').lean();
    return role?.permissions?.['User ID Management'] === true;
};

/**
 * Service to handle Admin User operations.
 */
class AdminUsersService {
    /**
     * Get users based on requester's role.
     */
    async getAllAdmins(requester) {
        const filter = await hasUserManagementPermission(requester) ? {} : { _id: requester.id };
        return await User.find(filter)
            .select('-password')
            .populate('createdBy', 'username role') // Optional: see who created whom
            .sort({ createdAt: 1 });
    }

    /**
     * Get a single admin by ID.
     */
    async getAdminById(id, requester) {
        const user = await User.findById(id).select('-password').populate('createdBy', 'username role');
        if (!user) throw { status: 404, message: 'User not found' };

        const canManageUsers = await hasUserManagementPermission(requester);
        if (!canManageUsers && user._id.toString() !== requester.id) {
            throw { status: 403, message: 'Unauthorized to view this user' };
        }

        const findLinkedUser = async (name, email, mobile) => {
            const candidates = [];
            if (email) candidates.push({ email });
            if (mobile) candidates.push({ mobile });
            if (name) candidates.push({ fullName: name }, { username: name });
            if (!candidates.length) return null;
            return User.findOne({ _id: { $ne: user._id }, $or: candidates })
                .select('username fullName designation email mobile profileImage')
                .lean();
        };
        const [hodUser, reportingUser] = await Promise.all([
            findLinkedUser(user.hodName, user.hodEmail, user.hodMobile),
            findLinkedUser(user.reportingToName, user.reportingToEmail, user.reportingToMobile)
        ]);
        let linkedDetailsChanged = false;
        if (hodUser) {
            const next = {
                hodName: hodUser.fullName || hodUser.username || '',
                hodMobile: hodUser.mobile || '',
                hodEmail: hodUser.email || '',
                hodDesignation: hodUser.designation || '',
                hodImage: hodUser.profileImage || ''
            };
            Object.entries(next).forEach(([key, value]) => {
                if (user[key] !== value) { user[key] = value; linkedDetailsChanged = true; }
            });
        }
        if (reportingUser) {
            const next = {
                reportingToName: reportingUser.fullName || reportingUser.username || '',
                reportingToMobile: reportingUser.mobile || '',
                reportingToEmail: reportingUser.email || '',
                reportingToDesignation: reportingUser.designation || '',
                reportingToImage: reportingUser.profileImage || ''
            };
            Object.entries(next).forEach(([key, value]) => {
                if (user[key] !== value) { user[key] = value; linkedDetailsChanged = true; }
            });
        }
        if (linkedDetailsChanged) await user.save();
        return user;
    }

    /**
     * Create a new user with permission checks.
     */
    async createAdmin(data, requester) {
        const {
            password, role, fullName, designation, altMobile, status,
            title, department, hodName, hodMobile, hodEmail, hodDesignation,
            reportingToName, reportingToMobile, reportingToEmail, reportingToDesignation
        } = data;
        const username = cleanString(data.username);
        const email = cleanString(data.email);
        const mobile = cleanString(data.mobile);
        const hodImage = cleanOptionalImage(data.hodImage);
        const profileImage = cleanOptionalImage(data.profileImage);
        const reportingToImage = cleanOptionalImage(data.reportingToImage);
        const signatureImage = cleanOptionalImage(data.signatureImage);

        const reqRole = requester.role;
        const assignRole = role;

        if (reqRole !== 'IHWE–Super Administrator') {
            if (role && assignRole !== 'Employee' && assignRole !== 'employee') {
                throw { status: 403, message: 'You only have permission to create employees' };
            }
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) throw { status: 409, message: 'Username already exists' };

        if (email) {
            const existingEmail = await User.findOne({ email });
            if (existingEmail) throw { status: 409, message: 'Official Email already exists' };
        }

        if (mobile) {
            const existingMobile = await User.findOne({ mobile });
            if (existingMobile) throw { status: 409, message: 'Official Mobile Number already exists' };
        }

        const newUser = new User({
            username, password,
            fullName: cleanString(fullName),
            title: cleanString(title),
            department: cleanString(department),
            designation: cleanString(designation),
            email,
            mobile,
            altMobile: cleanString(altMobile),
            hodName: cleanString(hodName),
            hodMobile: cleanString(hodMobile),
            hodEmail: cleanString(hodEmail),
            hodDesignation: cleanString(hodDesignation),
            hodImage,
            reportingToName: cleanString(reportingToName),
            reportingToMobile: cleanString(reportingToMobile),
            reportingToEmail: cleanString(reportingToEmail),
            reportingToDesignation: cleanString(reportingToDesignation),
            reportingToImage,
            profileImage,
            signatureImage,
            role: role || 'employee',
            status: status === 'Inactive' ? 'Inactive' : 'Active',
            createdBy: requester.id
        });

        await newUser.save();
        const userData = newUser.toObject();
        delete userData.password;
        return userData;
    }

    /**
     * Update a user with permission checks.
     */
    async updateAdmin(id, data, requester) {
        const {
            role, status, password, fullName, designation, altMobile,
            title, department, hodName, hodMobile, hodEmail, hodDesignation,
            reportingToName, reportingToMobile, reportingToEmail, reportingToDesignation
        } = data;
        const username = data.username !== undefined ? cleanString(data.username) : undefined;
        const email = data.email !== undefined ? cleanString(data.email) : undefined;
        const mobile = data.mobile !== undefined ? cleanString(data.mobile) : undefined;
        const hodImage = data.hodImage !== undefined ? cleanOptionalImage(data.hodImage) : undefined;
        const profileImage = data.profileImage !== undefined ? cleanOptionalImage(data.profileImage) : undefined;
        const reportingToImage = data.reportingToImage !== undefined ? cleanOptionalImage(data.reportingToImage) : undefined;
        const signatureImage = data.signatureImage !== undefined ? cleanOptionalImage(data.signatureImage) : undefined;

        const userToUpdate = await User.findById(id);
        if (!userToUpdate) throw { status: 404, message: 'User not found' };
        const previousIdentityNames = [userToUpdate.fullName, userToUpdate.username].filter(Boolean);

        const reqRole = requester.role;
        const roleSlug = String(reqRole || '').toLowerCase().replace(/[^a-z]/g, '');
        const isSuperAdmin = roleSlug === 'superadmin' || roleSlug === 'ihwesuperadministrator';
        const isSelf = userToUpdate._id.toString() === requester.id;
        const canManageUsers = await hasUserManagementPermission(requester);

        if (!canManageUsers) {
            throw { status: 403, message: 'You do not have User ID Management permission' };
        }
        if (password && String(password).length < 6) {
            throw { status: 400, message: 'Password must be at least 6 characters long' };
        }

        const verifyContactProof = (token, identifier, type) => {
            try {
                const proof = jwt.verify(token || '', process.env.JWT_SECRET || 'ihwe_secret_2026');
                return proof.purpose === 'official-contact-verification'
                    && proof.type === type
                    && proof.identifier === identifier;
            } catch {
                return false;
            }
        };

        if (email !== undefined && email !== userToUpdate.email
            && !verifyContactProof(data.emailVerificationToken, email, 'email')) {
            throw { status: 400, message: 'Please verify the new Official Email via OTP' };
        }
        if (mobile !== undefined && mobile !== userToUpdate.mobile
            && !verifyContactProof(data.mobileVerificationToken, mobile, 'phone')) {
            throw { status: 400, message: 'Please verify the new Official Mobile Number via WhatsApp OTP' };
        }

        if (isSelf && !isSuperAdmin) {
            if (role !== undefined && role !== userToUpdate.role) {
                throw { status: 403, message: 'You cannot change your own role' };
            }
            if (status !== undefined && status !== userToUpdate.status) {
                throw { status: 403, message: 'You cannot change your own account status' };
            }
        }

        if (username && username !== userToUpdate.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) throw { status: 409, message: 'Username already exists' };
            userToUpdate.username = username;
        }

        if (email && email !== userToUpdate.email) {
            const existingEmail = await User.findOne({ email });
            if (existingEmail) throw { status: 409, message: 'Official Email already exists' };
            userToUpdate.email = email;
        } else if (email === '') {
            userToUpdate.email = '';
        }

        if (mobile && mobile !== userToUpdate.mobile) {
            const existingMobile = await User.findOne({ mobile });
            if (existingMobile) throw { status: 409, message: 'Official Mobile Number already exists' };
            userToUpdate.mobile = mobile;
        } else if (mobile === '') {
            userToUpdate.mobile = '';
        }

        if (role) userToUpdate.role = role;

        if (status) userToUpdate.status = status;
        if (password) userToUpdate.password = password;
        if (fullName !== undefined) userToUpdate.fullName = cleanString(fullName);
        if (title !== undefined) userToUpdate.title = cleanString(title);
        if (department !== undefined) userToUpdate.department = cleanString(department);
        if (designation !== undefined) userToUpdate.designation = cleanString(designation);
        if (altMobile !== undefined) userToUpdate.altMobile = cleanString(altMobile);

        if (hodName !== undefined) userToUpdate.hodName = cleanString(hodName);
        if (hodMobile !== undefined) userToUpdate.hodMobile = cleanString(hodMobile);
        if (hodEmail !== undefined) userToUpdate.hodEmail = cleanString(hodEmail);
        if (hodDesignation !== undefined) userToUpdate.hodDesignation = cleanString(hodDesignation);
        if (hodImage !== undefined) userToUpdate.hodImage = hodImage;

        if (reportingToName !== undefined) userToUpdate.reportingToName = cleanString(reportingToName);
        if (reportingToMobile !== undefined) userToUpdate.reportingToMobile = cleanString(reportingToMobile);
        if (reportingToEmail !== undefined) userToUpdate.reportingToEmail = cleanString(reportingToEmail);
        if (reportingToDesignation !== undefined) userToUpdate.reportingToDesignation = cleanString(reportingToDesignation);
        if (reportingToImage !== undefined) userToUpdate.reportingToImage = reportingToImage;
        if (profileImage !== undefined) userToUpdate.profileImage = profileImage;
        if (signatureImage !== undefined) userToUpdate.signatureImage = signatureImage;

        await userToUpdate.save();

        const linkedSnapshot = {
            name: userToUpdate.fullName || userToUpdate.username || '',
            mobile: userToUpdate.mobile || '',
            email: userToUpdate.email || '',
            designation: userToUpdate.designation || '',
            image: userToUpdate.profileImage || ''
        };
        await Promise.all([
            User.updateMany(
                { _id: { $ne: userToUpdate._id }, hodName: { $in: previousIdentityNames } },
                {
                    $set: {
                        hodName: linkedSnapshot.name,
                        hodMobile: linkedSnapshot.mobile,
                        hodEmail: linkedSnapshot.email,
                        hodDesignation: linkedSnapshot.designation,
                        hodImage: linkedSnapshot.image
                    }
                }
            ),
            User.updateMany(
                { _id: { $ne: userToUpdate._id }, reportingToName: { $in: previousIdentityNames } },
                {
                    $set: {
                        reportingToName: linkedSnapshot.name,
                        reportingToMobile: linkedSnapshot.mobile,
                        reportingToEmail: linkedSnapshot.email,
                        reportingToDesignation: linkedSnapshot.designation,
                        reportingToImage: linkedSnapshot.image
                    }
                }
            ),
            Department.updateMany(
                { hodName: { $in: previousIdentityNames } },
                { $set: { hodName: linkedSnapshot.name } }
            ),
            Designation.updateMany(
                { reportTo: { $in: previousIdentityNames } },
                { $set: { reportTo: linkedSnapshot.name } }
            )
        ]);
        const userData = userToUpdate.toObject();
        delete userData.password;
        return userData;
    }
    async deleteAdmin(id, requester) {
        const userToDelete = await User.findById(id);
        if (!userToDelete) throw { status: 404, message: 'User not found' };

        const reqRole = requester.role;

        // Permission check
        if (reqRole !== 'IHWE–Super Administrator' && userToDelete.createdBy?.toString() !== requester.id) {
            throw { status: 403, message: 'Unauthorized to delete this user' };
        }

        const deleted = await User.findByIdAndDelete(id);
        return deleted;
    }
}

module.exports = new AdminUsersService();
