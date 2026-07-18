const mongoose = require('mongoose');

const speakerSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    organization: { type: String, required: true, trim: true },
    industryCategory: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    mobileNormalized: { type: String, trim: true, sparse: true, unique: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    emailNormalized: { type: String, trim: true, lowercase: true, sparse: true, unique: true },
    city: { type: String, required: true, trim: true },
    linkedin: { type: String, default: "" },
    briefProfile: { type: String, required: true },
    totalExperience: { type: String, required: true },
    expertise: [{ type: String, required: true }],
    preferredTopic: { type: String, required: true },
    topicDescription: { type: String, required: true },
    preferredTrack: { type: String, required: true },
    sessionType: { type: String, required: true },
    spokenBefore: { type: String, required: true },
    eventDetails: { type: String, default: "" },
    expectations: [{ type: String, required: true }],
    consent1: { type: Boolean, required: true },
    consent2: { type: Boolean, required: true },
    speakerPhotoUrl: { type: String, default: "" },
    companyLogoUrl: { type: String, default: "" },
    presentationUrl: { type: String, default: "" },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
}, { timestamps: true });

speakerSchema.pre('validate', function() {
    if (this.email) {
        this.emailNormalized = String(this.email).trim().toLowerCase();
    }
    if (this.mobile) {
        this.mobileNormalized = String(this.mobile).replace(/\D/g, '');
    }
});

module.exports = mongoose.model('Speaker', speakerSchema);
