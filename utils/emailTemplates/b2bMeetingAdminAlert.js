'use strict';

const { renderAlert } = require('./exhibitorLifecycleAdminAlerts');
const { formatList, getRegistrationTimestamp } = require('./visitorAdminTemplateUtils');

const getB2BMeetingAdminAlertTemplate = data => renderAlert({
    title: 'New B2B Meeting Request Alert',
    intro: 'A visitor has requested a B2B meeting for IHWE 2026. Please review the visitor profile and coordinate the required matchmaking follow-up.',
    sectionTitle: 'B2B Meeting Request Details',
    rows: [
        ['Registration ID', data.registrationId],
        ['Visitor Name', [data.firstName, data.lastName].filter(Boolean).join(' ')],
        ['Visitor Category', data.visitorType],
        ['Company Name', data.companyName],
        ['Designation', data.designation],
        ['Email ID', data.email],
        ['Mobile Number', data.mobile],
        ['City', data.city],
        ['Interested Segments', formatList(data.areaOfInterest || data.interestedSegments)],
        ['Purpose of Visit', formatList(data.purposeOfVisit)],
        ['B2B Meeting Request', data.b2bMeeting || 'Yes'],
        ['Business Requirement', data.businessRequirement || data.b2bRequirement || data.message]
    ],
    actions: [
        'Verify the visitor and company profile',
        'Contact the visitor to understand the meeting requirement',
        'Identify and coordinate with suitable exhibitors',
        'Update the B2B meeting status in IHWE CRM'
    ],
    note: 'Confirm meeting availability with both parties before sharing a final meeting schedule.',
    tone: 'green',
    timestamp: getRegistrationTimestamp(data)
});

module.exports = { getB2BMeetingAdminAlertTemplate };
