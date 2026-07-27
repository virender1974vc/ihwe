'use strict';

const { renderAlert } = require('./exhibitorLifecycleAdminAlerts');
const { formatList, getRegistrationTimestamp } = require('./visitorAdminTemplateUtils');

const getInternationalBuyerRegistrationAlertTemplate = data => renderAlert({
    title: 'New International Buyer Registration Alert',
    intro: 'A new International Buyer Registration has been received. Please review the profile, B2B requirements and travel-support request.',
    sectionTitle: 'International Buyer Details',
    rows: [
        ['Registration ID', data.registrationId],
        ['Brand / Company Name', data.brandName],
        ['Legal Entity Type', data.legalEntityType],
        ['Country of Registration', data.countryOfRegistration || data.country],
        ['Nature of Business', formatList(data.natureOfBusiness)],
        ['Website', data.website],
        ['Full Name', data.primaryContact?.fullName],
        ['Designation', data.primaryContact?.designation],
        ['Email ID', data.primaryContact?.emailId],
        ['Mobile Number', data.primaryContact?.mobileNumber],
        ['Product Categories', formatList(data.productCategories)],
        ['Interested in B2B', data.b2bInterest?.interested],
        ['Looking For', formatList(data.b2bInterest?.lookingFor)],
        ['Visa Invitation Required', data.travelSupport?.visaInvitation],
        ['Registration Category', data.registrationCategory],
        ['Billing Name', data.billingDetails?.billingName]
    ],
    actions: ['Validate the international buyer profile', 'Assign the lead to the international buyer desk', 'Coordinate B2B matchmaking and requested travel support', 'Update the registration status in IHWE CRM'],
    note: 'Review visa invitation requests and international contact details before issuing any official documentation.',
    tone: 'blue',
    timestamp: getRegistrationTimestamp(data)
});

module.exports = { getInternationalBuyerRegistrationAlertTemplate };
