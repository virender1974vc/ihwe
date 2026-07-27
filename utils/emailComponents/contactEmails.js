'use strict';
async function sendContactUsEmails(enquiry) {
    return await this.sendDynamicConfirmation({
        to: enquiry.email,
        formType: 'contact-enquiry',
        data: {
            name: enquiry.name,
            email: enquiry.email,
            phone: enquiry.phone,
            service: enquiry.service,
            message: enquiry.message
        },
        profile: 'CONTACT'
    });
}

module.exports = { sendContactUsEmails };
