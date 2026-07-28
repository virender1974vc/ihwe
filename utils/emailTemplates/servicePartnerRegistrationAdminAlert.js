'use strict';

const { renderAlert } = require('./exhibitorLifecycleAdminAlerts');
const { formatList, getRegistrationTimestamp } = require('./visitorAdminTemplateUtils');

const yesNo = value => {
    if (value === true || String(value || '').toLowerCase() === 'yes') return 'Yes';
    if (value === false || String(value || '').toLowerCase() === 'no') return 'No';
    return value;
};

const getServicePartnerRegistrationAdminAlertTemplate = partner => renderAlert({
    title: 'New Service Partner Registration Alert',
    intro: 'A new Official Service Partner registration has been received. Please review the company profile, service capacity and partnership interests.',
    sectionTitle: 'Service Partner Details',
    rows: [
        ['Registration ID', partner.registrationId],
        ['Registration Status', partner.status || 'Pending'],
        ['Company Name', partner.companyName],
        ['Business Category', partner.businessCategory],
        ['Website', partner.website],
        ['Year Established', partner.yearEstablished],
        ['GST Number', partner.gstNumber],
        ['MSME Registration', partner.msmeRegistration],
        ['Contact Person', partner.fullName],
        ['Designation', partner.designation],
        ['Email ID', partner.email],
        ['Mobile Number', partner.mobile],
        ['WhatsApp Number', partner.whatsapp],
        ['Office Address', [partner.officeAddress, partner.city, partner.state, partner.country, partner.pinCode].filter(Boolean).join(', ')],
        ['Selected Services', formatList(partner.selectedServices)],
        ['Other Service', partner.otherService],
        ['Business Experience', partner.experience],
        ['Major Clients', partner.majorClients],
        ['Can Handle International Clients', yesNo(partner.canHandleInternational)],
        ['Operational Cities', partner.operationalCities],
        ['Partnership Interests', formatList(partner.partnershipInterests)],
        ['Additional Information', partner.additionalInfo]
    ],
    actions: [
        'Verify the company and contact details',
        'Review uploaded business and compliance documents',
        'Evaluate service capacity and partnership suitability',
        'Assign follow-up and update the application status in IHWE CRM'
    ],
    note: 'Complete document and capability verification before accepting the company as an official IHWE service partner.',
    tone: 'blue',
    timestamp: getRegistrationTimestamp(partner)
});

module.exports = { getServicePartnerRegistrationAdminAlertTemplate };
