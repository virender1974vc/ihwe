const User = require('../../models/admin_settings/User');

const cleanString = (value) => (typeof value === 'string' ? value.trim() : '');
const cleanOptionalImage = (value) => (typeof value === 'string' ? value : '');

/**
 * Service to handle Admin User operations.
 */
class AdminUsersService {
    /**
     * Get users based on requester's role.
     */
    async getAllAdmins(requester) {
        let filter = {};
        const reqRole = requester.role;
        if (reqRole !== 'IHWE–Super Administrator') {
            filter = { createdBy: requester.id };
        }
        return await User.find(filter)
            .select('-password')
            .populate('createdBy', 'username role') // Optional: see who created whom
            .sort({ createdAt: 1 });
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

        const userToUpdate = await User.findById(id);
        if (!userToUpdate) throw { status: 404, message: 'User not found' };

        const reqRole = requester.role;
        const assignRole = role;

        if (reqRole !== 'IHWE–Super Administrator' && userToUpdate.createdBy?.toString() !== requester.id) {
            throw { status: 403, message: 'Unauthorized to update this user' };
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

        if (role) {
            if (reqRole !== 'IHWE–Super Administrator' && assignRole !== 'Employee' && assignRole !== 'employee') {
                throw { status: 403, message: 'Cannot assign non-employee roles' };
            }
            userToUpdate.role = role;
        }

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

        await userToUpdate.save();
        const userData = userToUpdate.toObject();
        delete userData.password;
        return userData;
    }

    /**
     * Delete a user with permission checks.
     */
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
