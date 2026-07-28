'use strict';

const { money, renderAlert } = require('./exhibitorLifecycleAdminAlerts');
const { getRegistrationTimestamp } = require('./visitorAdminTemplateUtils');

const getExhibitorAdminAlertTemplate = data => renderAlert({
    title: 'New Exhibitor Booking Alert',
    intro: 'A new exhibitor booking has been received. Please review the company, stall and payment details below.',
    sectionTitle: 'Exhibitor Booking Details',
    rows: [
        ['Registration ID', data.registrationId],
        ['Company Name', data.exhibitorName],
        ['Business Type', data.typeOfBusiness],
        ['Industry Sector', data.industrySector],
        ['Website', data.website],
        ['Address', [data.address, data.city, data.state, data.country, data.pincode].filter(Boolean).join(', ')],
        ['GST Number', data.gstNo],
        ['PAN Number', data.panNo],
        ['Contact Person', [data.contact1Title, data.contact1FirstName, data.contact1LastName].filter(Boolean).join(' ')],
        ['Designation', data.contact1Designation],
        ['Email ID', data.contact1Email],
        ['Mobile Number', data.contact1Mobile],
        ['Stall Number', data.stallFor],
        ['Stall Type', data.stallType],
        ['Stall Size', data.stallSize ? `${data.stallSize} sq. m.` : null],
        ['Dimension', data.dimension],
        ['Total Amount', money(data.totalAmount, data.currency)],
        ['Amount Paid', money(data.amountPaid, data.currency)],
        ['Balance Amount', money(data.balanceAmount, data.currency)],
        ['Payment Mode', data.paymentMode],
        ['Registration Status', data.status],
        ['Referred / Spoken With', data.spokenWith || data.referredBy || data.filledBy]
    ],
    actions: ['Verify company and booking details', 'Confirm stall availability and allocation', 'Validate payment status and supporting documents', 'Assign the booking to the exhibitor coordination team'],
    note: 'Do not finalize floor-plan allocation until the booking and payment details are verified.',
    tone: 'blue',
    timestamp: getRegistrationTimestamp(data)
});

module.exports = { getExhibitorAdminAlertTemplate };
