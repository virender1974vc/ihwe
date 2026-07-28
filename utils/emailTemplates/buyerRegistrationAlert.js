'use strict';

const { renderAlert } = require('./exhibitorLifecycleAdminAlerts');
const { formatList, getRegistrationTimestamp } = require('./visitorAdminTemplateUtils');

const value = (...items) => {
    const found = items.find(item => item !== undefined && item !== null && String(item).trim() && !['undefined', 'null'].includes(String(item).trim().toLowerCase()));
    return found === undefined ? 'N/A' : found;
};

const getBuyerRegistrationAlertTemplate = data => renderAlert({
    title: 'New Buyer Registration Alert',
    intro: 'A new Buyer Registration has been received for IHWE 2026. Please review the buyer profile and coordinate for the Buyer-Seller Meet.',
    sectionTitle: 'Buyer Registration Details',
    rows: [
        ['Registration ID', data.registrationId],
        ['Payment Status', value(data.paymentStatus, 'Pending')],
        ['Full Name', value(data.fullName, data.name)],
        ['Designation', data.designation],
        ['Company Name', value(data.companyName, data.companyFirmName)],
        ['Email ID', value(data.emailAddress, data.email)],
        ['Mobile Number', value(data.mobileNumber, data.mobile, data.phone)],
        ['Location', [data.city, data.stateProvince || data.state, data.country || 'India'].filter(Boolean).join(', ')],
        ['Business Type', value(data.businessType, data.basicBusinessType, data.natureOfBusiness)],
        ['Years in Operation', value(data.yearsInBusiness, data.yearsInOperation, data.yearOfEstablishment)],
        ['Annual Turnover', data.annualTurnover],
        ['Key Products / Services', value(data.keyProductsServices, data.specificProductRequirements, data.primaryProductInterest, data.buyerIndustry)],
        ['Primary Product Interest', value(data.primaryProductInterest, data.buyerIndustry)],
        ['Secondary Categories', formatList(data.secondaryProductCategories)],
        ['Budget Range', value(data.budgetRange, data.estimatedAnnualPurchaseValue, data.estimatedPurchaseVolume)],
        ['Buying Frequency', value(data.buyingFrequency, data.purchaseFrequency)],
        ['Purchase Timeline', data.purchaseTimeline],
        ['Registration Category', data.registrationCategory],
        ['Fee Amount', data.registrationFee],
        ['Preferred Meeting', value(data.preferredMeetingDate, data.preferredMeetingDay, data.preferredTimeSlot)],
        ['Priority Level', data.meetingPriorityLevel],
        ['Transaction ID', value(data.transactionId, data.razorpayPaymentId)]
    ],
    actions: ['Verify payment completeness in the payment dashboard', 'Review the buyer profile and matchmaking requirements', 'Update CRM status for B2B matchmaking', 'Initiate introductions with relevant exhibitors'],
    note: 'Give priority to qualified buyer leads and verify all payment and contact details before matchmaking.',
    tone: data.paymentStatus === 'Completed' ? 'green' : 'amber',
    timestamp: getRegistrationTimestamp(data)
});

module.exports = { getBuyerRegistrationAlertTemplate };
