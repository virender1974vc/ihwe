const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    startDate: Date,
    endDate: Date,
    location: String,
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    ticketsStatus: {
        type: String,
        default: 'Few Remaining'
    },
    speakersCount: {
        type: String,
        default: '100+'
    },
    description: {
        type: String,
        default: ''
    },
    paymentFilterName: {
        type: String,
        default: '',
        trim: true
    },
    contactPhone: {
        type: String,
        default: ''
    },
    order: {
        type: Number,
        default: 0
    },
    dailyAttendanceTarget: {
        type: Number,
        default: 500,
        min: 1
    },
    earlyBirdDiscountActive: {
        type: Boolean,
        default: true
    },
    earlyBirdDiscountPercent: {
        type: Number,
        default: 10
    },
    earlyBirdValidityDays: {
        type: Number,
        default: 60
    },
    earlyBirdExclusionNote: {
        type: String,
        default: 'Note: Early Bird bookings are not eligible for the additional 5% Full Payment Discount.'
    },
    paymentPlans: [{
        id: String,
        label: String,
        percentage: Number,
        isDefault: { type: Boolean, default: false },
        dueDate: { type: Date, default: null },
        dueDaysBeforeEvent: { type: Number, default: null },
        discountPercent: { type: Number, default: 0 },
        discountDaysBeforeEvent: { type: Number, default: null },
        planConfigVersion: { type: Number, default: 2 }
    }],
    paymentReminderDays: {
        type: [Number],
        default: [7, 3, 0]
    },
    paymentRemindersActive: {
        type: Boolean,
        default: true
    },
    paymentReminderConfigVersion: {
        type: Number,
        default: 2
    },
    generalReminderDays: {
        type: Number,
        default: 7
    },
    installmentReminderDays: {
        type: Number,
        default: 7
    },
    bookingFormUrl: {
        type: String,
        default: ''
    },
    bookingFormOriginalName: {
        type: String,
        default: ''
    },
    showInPaymentsFilter: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
