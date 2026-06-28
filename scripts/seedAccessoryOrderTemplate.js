const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const MessageTemplate = require('../models/MessageTemplate');

dotenv.config({ path: path.join(__dirname, '../.env') });

const accessoryOrderTemplate = {
    formType: 'exhibitor-accessory-order',
    emailSubject: 'ACCESSORY ORDER CONFIRMED - [[ORDER_NO]] | IHWE 2026',
    emailBody: `
        <p>Dear [[CONTACT_PERSON]],</p>
        <p>Your stall accessories order has been successfully recorded for <strong>IHWE 2026</strong>.</p>

        <div style="background:#f3f4f6;padding:18px;border-radius:8px;margin:20px 0;border-left:4px solid #23471d;">
            <p style="margin:0 0 8px;"><strong>Exhibitor:</strong> [[EXHIBITOR_NAME]]</p>
            <p style="margin:0 0 8px;"><strong>Registration ID:</strong> [[REGISTRATION_ID]]</p>
            <p style="margin:0 0 8px;"><strong>Stall No:</strong> [[STALL_NO]]</p>
            <p style="margin:0;"><strong>Order No:</strong> [[ORDER_NO]]</p>
        </div>

        <p><strong>Order Summary:</strong></p>
        [[ITEM_TABLE]]

        <div style="background:#f9fafb;padding:16px;text-align:right;border-top:1px solid #e5e7eb;margin:20px 0;">
            <p style="margin:0;font-size:16px;color:#111827;"><strong>Grand Total: [[GRAND_TOTAL]]</strong></p>
        </div>

        <p>Please find your accessory receipt attached as a PDF.</p>
        <p>For any queries, please contact the IHWE support team.</p>
        <p>With warm regards,<br/><strong>Team IHWE | Namo Gange Trust</strong></p>
    `,
    whatsappBody: 'Hello [[CONTACT_PERSON]],\n\nYour Accessory Order [[ORDER_NO]] for Stall [[STALL_NO]] has been received.\n\nTotal: [[GRAND_TOTAL]]\n\nReceipt PDF has been sent to your email.\n\nRegards, Team IHWE',
    lastUpdatedBy: null
};

const seedAccessoryOrderTemplate = async () => {
    try {
        if (!process.env.MONGO_URI_MAIN) {
            throw new Error('MONGO_URI_MAIN not found in .env');
        }

        await mongoose.connect(process.env.MONGO_URI_MAIN);
        console.log('Connected to MongoDB for seeding exhibitor-accessory-order template...');

        await MessageTemplate.findOneAndUpdate(
            { formType: accessoryOrderTemplate.formType },
            accessoryOrderTemplate,
            { upsert: true, returnDocument: 'after' }
        );

        console.log('Accessory order template seeded successfully: exhibitor-accessory-order');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding accessory order template:', error);
        process.exit(1);
    }
};

seedAccessoryOrderTemplate();
