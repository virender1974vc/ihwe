'use strict';

const { renderAlert } = require('./exhibitorLifecycleAdminAlerts');
const { formatList, getRegistrationTimestamp } = require('./visitorAdminTemplateUtils');

const getBuyerInterestAlertTemplate = data => renderAlert({
    title: 'Buyer / B2B Interest Alert',
    intro: 'A registered visitor has expressed interest in Buyer/B2B participation. Please review the requirement and assign a follow-up.',
    sectionTitle: 'Buyer Interest Details',
    rows: [
        ['Registration ID', data.registrationId],
        ['Visitor Name', [data.firstName, data.lastName].filter(Boolean).join(' ')],
        ['Company Name', data.companyName],
        ['Designation', data.designation],
        ['Email ID', data.email],
        ['Mobile Number', data.mobile],
        ['City', data.city],
        ['Buyer Registration Interest', 'Yes'],
        ['Preferred Segments', formatList(data.interestedSegments || data.areaOfInterest)],
        ['Purpose of Visit', formatList(data.purposeOfVisit)]
    ],
    actions: ['Review the visitor and company profile', 'Assign the lead to the B2B coordination team', 'Contact the visitor for detailed buying requirements', 'Update the follow-up status in IHWE CRM'],
    note: 'This visitor requested Buyer/B2B participation; timely qualification and matchmaking follow-up is required.',
    tone: 'green',
    timestamp: getRegistrationTimestamp(data)
});

module.exports = { getBuyerInterestAlertTemplate };
