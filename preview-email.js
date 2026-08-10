'use strict';

const express = require('express');
const emailTemplateGenerator = require('./utils/emailTemplateGenerator');

const app = express();

app.get('/preview-email', async (req, res) => {
    try {
        const data = {
            clientName: 'ABC Wellness',
            companyName: 'ABC Wellness Pvt. Ltd.',
            eventName: '9th International Health & Wellness Expo 2026 – Global Edition',

            proformaInvoiceNo: 'PI/26-27/0123',

            bookingAmount: 116820,
            netPayable: 116820,
            amountPaid: 40000,
            balanceDue: 76820,
            paymentStatus: 'PARTIAL',
            paymentDate: '2026-08-08',

            installments: [
                {
                    label: '1st Installment (Paid)',
                    dueDate: '2026-08-08',
                    amount: 40000,
                    status: 'PAID'
                },
                {
                    label: '2nd Installment',
                    dueDate: '2026-08-20',
                    amount: 38410,
                    status: 'PENDING'
                },
                {
                    label: '3rd Installment',
                    dueDate: '2026-09-05',
                    amount: 38410,
                    status: 'PENDING'
                }
            ],

            stallNo: 'A-121',
            hallNo: '12',
            stallSize: '9 Sq. Mtr.',
            stallType: 'Shell Scheme',
            stallPosition: 'Corner Stall (3 Side Open)',
            floorPlanReference: 'Hall 12 – Block A',

            dashboardUrl: 'https://exhibitor.ihwe.in/login',
            dashboardUsername: 'abcwellness',
            temporaryPassword: 'Temp@123',

            relationshipManager: {
                name: 'Mr. Vimal Chopra',
                phone: '+91 96549 00525',
                email: 'crm@namogangewellness.com'
            },

            accountsSupport: {
                phone: '+91 99534 56789',
                email: 'accounts@namogangewellness.com'
            },

            exhibitorHelpline: {
                phone: '+91 96549 00525',
                email: 'expo@namogangewellness.com'
            }
        };

        const result = emailTemplateGenerator.generateIHWEConfirmation({
            subject: 'IHWE 2026 Booking Confirmation',
            data,

            // Agar header/footer images dekhni hain to actual paths yahan do.
            template: {
                headerImage: null,
                footerImage: null
            }
        });

        let html = result.html;

        // CID images ko browser-compatible base64 me convert karega.
        for (const attachment of result.attachments || []) {
            if (!attachment.cid || !attachment.content) continue;

            const ext = String(attachment.filename || '')
                .split('.')
                .pop()
                .toLowerCase();

            const mime =
                ext === 'jpg' || ext === 'jpeg'
                    ? 'image/jpeg'
                    : ext === 'svg'
                    ? 'image/svg+xml'
                    : 'image/png';

            const base64 = Buffer.from(attachment.content).toString('base64');

            html = html.replaceAll(
                `cid:${attachment.cid}`,
                `data:${mime};base64,${base64}`
            );
        }

        res.setHeader('Content-Type', 'text/html');
        res.send(html);

    } catch (error) {
        console.error(error);

        res.status(500).send(`
            <h2>Preview Error</h2>
            <pre>${error.stack}</pre>
        `);
    }
});

app.listen(5055, () => {
    console.log('Email preview running:');
    console.log('http://localhost:5055/preview-email');
});