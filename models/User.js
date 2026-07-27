const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    fullName: { type: String, default: '' },
    title: { type: String, default: '' },
    department: { type: String, default: '' },
    designation: { type: String, default: '' },
    email: { type: String, default: '' },
    mobile: { type: String, default: '' },
    altMobile: { type: String, default: '' },
    hodName: { type: String, default: '' },
    hodMobile: { type: String, default: '' },
    hodEmail: { type: String, default: '' },
    hodDesignation: { type: String, default: '' },
    hodImage: { type: String, default: '' },
    signatureImage: { type: String, default: '' },
    reportingToName: { type: String, default: '' },
    reportingToMobile: { type: String, default: '' },
    reportingToEmail: { type: String, default: '' },
    reportingToDesignation: { type: String, default: '' },
    reportingToImage: { type: String, default: '' },
    profileImage: { type: String, default: '' },
    role: { type: String, default: 'employee' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    lastLogin: { type: Date, default: null }
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
