const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MessageTemplate = require('../models/MessageTemplate');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const emailBodyHtml = `
<style>
    .content-td { padding-top: 0px !important; }
</style>
<table border="0" cellpadding="0" cellspacing="0" width="700" style="font-family: Arial, Helvetica, sans-serif; color: #333333; font-size: 13px; background-color: #ffffff; border-collapse: collapse;" align="center">
    <tr>
        <td width="700">

            <!-- ===== 1. HEADER: LOGO | EVENT DATE/VENUE | RECEIPT CARD ===== -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border-collapse: collapse;">
                <tr>
                    <!-- Logo -->
                    <td width="240" valign="middle" style="padding: 0 10px 2px 10px;">
                        <img src="[[LOGO_URL]]" alt="IHWE Logo" width="180" style="display: block; border: 0; max-width: 180px; height: auto;" />
                    </td>
                    <!-- Divider line -->
                    <td width="1" valign="middle" style="background-color: #e2e8f0; padding: 0;">&nbsp;</td>
                    <!-- Event Date & Venue -->
                    <td width="219" valign="middle" style="padding: 0 10px 2px 15px; font-family: Arial, sans-serif;">
                        <table border="0" cellpadding="0" cellspacing="0" width="200" style="border-collapse: collapse;">
                            <tr>
                                <td style="font-size: 12px; color: #334155; padding-bottom: 5px; font-family: Arial, sans-serif;">
                                    <span style="font-size: 13px; margin-right: 4px;">&#128197;</span> <strong>21 &ndash; 23 AUGUST 2026</strong>
                                </td>
                            </tr>
                            <tr>
                                <td style="font-size: 11px; color: #475569; line-height: 1.4; font-family: Arial, sans-serif;">
                                    <span style="font-size: 13px; margin-right: 4px;">&#128205;</span> <strong>PRAGATI MAIDAN,</strong><br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;NEW DELHI, INDIA
                                </td>
                            </tr>
                        </table>
                    </td>
                    <!-- Receipt Details Card -->
                    <td width="240" valign="middle" style="padding: 0 10px 2px 10px;">
                        <table border="0" cellpadding="0" cellspacing="0" width="220" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 5px 10px 6px 10px; font-family: Arial, sans-serif;">
                                    <div style="font-size: 12px; font-weight: bold; color: #0c2b5c; margin-bottom: 5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; text-transform: uppercase; letter-spacing: 0.5px; text-align: center;">PAYMENT RECEIPT</div>
                                    <table border="0" cellpadding="0" cellspacing="0" width="200" style="font-size: 11px; color: #334155; border-collapse: collapse; line-height: 1.4;">
                                        <tr>
                                            <td width="80" style="padding-bottom: 2px; color: #64748b; font-weight: bold; font-family: Arial, sans-serif;">Receipt No:</td>
                                            <td width="120" style="padding-bottom: 2px; text-align: right; color: #0f172a; font-family: Arial, sans-serif; word-break: break-all;">[[RECEIPT_NO]]</td>
                                        </tr>
                                        <tr>
                                            <td style="padding-bottom: 2px; color: #64748b; font-weight: bold; font-family: Arial, sans-serif;">Reg ID:</td>
                                            <td style="padding-bottom: 2px; text-align: right; color: #0f172a; font-family: Arial, sans-serif; word-break: break-all;">[[REGISTRATION_ID]]</td>
                                        </tr>
                                        <tr>
                                            <td style="color: #64748b; font-weight: bold; font-family: Arial, sans-serif;">Date:</td>
                                            <td style="text-align: right; color: #0f172a; font-family: Arial, sans-serif;">[[RECEIPT_DATE]]</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <!-- Divider -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border-collapse: collapse;">
                <tr><td height="1" style="background-color: #e2e8f0; font-size: 1px; line-height: 1px;">&nbsp;</td></tr>
            </table>

            <!-- ===== 2. FROM / TO ADDRESSES ===== -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border-collapse: collapse;">
                <tr>
                    <!-- FROM Card -->
                    <td width="340" valign="top">
                        <table border="0" cellpadding="0" cellspacing="0" width="340" style="border: 1px solid #e2e8f0; border-collapse: collapse;">
                            <tr>
                                <td style="background-color: #0c2b5c; color: #ffffff; padding: 3px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; font-family: Arial, sans-serif;">
                                    FROM (ORGANISER)
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 5px 12px; background-color: #ffffff; font-size: 11px; color: #334155; line-height: 1.5; font-family: Arial, sans-serif;">
                                    <div style="font-size: 12px; font-weight: bold; color: #0c2b5c; margin-bottom: 4px;">Namo Gange Wellness Pvt. Ltd.</div>
                                    12/52, Site-II, Loni Road Industrial Area,<br />
                                    Mohan Nagar, Ghaziabad - 201007, Uttar Pradesh, Bharat.
                                </td>
                            </tr>
                        </table>
                    </td>
                    <!-- Spacer -->
                    <td width="20">&nbsp;</td>
                    <!-- TO Card -->
                    <td width="340" valign="top">
                        <table border="0" cellpadding="0" cellspacing="0" width="340" style="border: 1px solid #e2e8f0; border-collapse: collapse;">
                            <tr>
                                <td style="background-color: #23471d; color: #ffffff; padding: 3px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; font-family: Arial, sans-serif;">
                                    TO (EXHIBITOR)
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 5px 12px; background-color: #ffffff; font-size: 11px; color: #334155; line-height: 1.5; font-family: Arial, sans-serif;">
                                    <div style="font-size: 12px; font-weight: bold; color: #23471d; margin-bottom: 4px; text-transform: capitalize;">[[EXHIBITOR_NAME]]</div>
                                    <div style="text-transform: capitalize;">[[EXHIBITOR_ADDRESS]]</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <!-- Spacer -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border-collapse: collapse;"><tr><td height="2" style="font-size: 2px; line-height: 2px;">&nbsp;</td></tr></table>

            <!-- ===== 3. STALL DETAILS HEADER ===== -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border-collapse: collapse;">
                <tr>
                    <td width="260" style="padding: 0;"><table border="0" cellpadding="0" cellspacing="0" width="260"><tr><td height="1" style="background-color: #cbd5e1; font-size:1px; line-height:1px;">&nbsp;</td></tr></table></td>
                    <td width="180" align="center" style="font-size: 11px; font-weight: bold; color: #0c2b5c; text-transform: uppercase; letter-spacing: 1px; font-family: Arial, sans-serif; padding: 0 10px;">Stall Details</td>
                    <td width="260" style="padding: 0;"><table border="0" cellpadding="0" cellspacing="0" width="260"><tr><td height="1" style="background-color: #cbd5e1; font-size:1px; line-height:1px;">&nbsp;</td></tr></table></td>
                </tr>
            </table>

            <!-- Spacer -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border-collapse: collapse;"><tr><td height="2" style="font-size: 2px; line-height: 2px;">&nbsp;</td></tr></table>

            <!-- ===== 4. STALL INFO CARDS (6 columns, 700px total) ===== -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border-collapse: separate; border-spacing: 4px; text-align: center; margin: 0 auto;">
                <tr>
                    <!-- Stall No -->
                    <td width="113" valign="middle" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 2px 4px; height: 32px;">
                        <div style="font-size: 7px; color: #64748b; font-weight: bold; text-transform: uppercase; white-space: nowrap; font-family: Arial, sans-serif; line-height: 1.1;">Stall No.</div>
                        <div style="font-size: 10px; font-weight: bold; color: #0c2b5c; font-family: Arial, sans-serif; line-height: 1.1; margin-top: 1px;">[[STALL_NO]]</div>
                    </td>
                    <!-- Stall Type -->
                    <td width="113" valign="middle" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 2px 4px; height: 32px;">
                        <div style="font-size: 7px; color: #64748b; font-weight: bold; text-transform: uppercase; white-space: nowrap; font-family: Arial, sans-serif; line-height: 1.1;">Stall Type</div>
                        <div style="font-size: 9px; font-weight: bold; color: #0c2b5c; font-family: Arial, sans-serif; line-height: 1.1; margin-top: 1px;">[[STALL_TYPE]]</div>
                    </td>
                    <!-- Scheme -->
                    <td width="113" valign="middle" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 2px 4px; height: 32px;">
                        <div style="font-size: 7px; color: #64748b; font-weight: bold; text-transform: uppercase; white-space: nowrap; font-family: Arial, sans-serif; line-height: 1.1;">Scheme</div>
                        <div style="font-size: 9px; font-weight: bold; color: #0c2b5c; font-family: Arial, sans-serif; line-height: 1.1; margin-top: 1px;">[[STALL_SCHEME]]</div>
                    </td>
                    <!-- Dimension -->
                    <td width="113" valign="middle" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 2px 4px; height: 32px;">
                        <div style="font-size: 7px; color: #64748b; font-weight: bold; text-transform: uppercase; white-space: nowrap; font-family: Arial, sans-serif; line-height: 1.1;">Dimension</div>
                        <div style="font-size: 10px; font-weight: bold; color: #0c2b5c; font-family: Arial, sans-serif; line-height: 1.1; margin-top: 1px;">[[STALL_DIMENSION]]</div>
                    </td>
                    <!-- Stall Size -->
                    <td width="113" valign="middle" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 2px 4px; height: 32px;">
                        <div style="font-size: 7px; color: #64748b; font-weight: bold; text-transform: uppercase; white-space: nowrap; font-family: Arial, sans-serif; line-height: 1.1;">Stall Size</div>
                        <div style="font-size: 10px; font-weight: bold; color: #0c2b5c; font-family: Arial, sans-serif; line-height: 1.1; margin-top: 1px;">[[STALL_SIZE]] SQM</div>
                    </td>
                    <!-- Event -->
                    <td width="113" valign="middle" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 2px 4px; height: 32px;">
                        <div style="font-size: 7px; color: #64748b; font-weight: bold; text-transform: uppercase; white-space: nowrap; font-family: Arial, sans-serif; line-height: 1.1;">Event</div>
                        <div style="font-size: 10px; font-weight: bold; color: #0c2b5c; font-family: Arial, sans-serif; line-height: 1.1; margin-top: 1px;">9IHWE 2026</div>
                    </td>
                </tr>
            </table>

            <!-- Spacer -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border-collapse: collapse;"><tr><td height="2" style="font-size: 2px; line-height: 2px;">&nbsp;</td></tr></table>

            <!-- ===== 5. FINANCIAL TABLE ===== -->
            <!-- Col widths: Desc=230, Dim=100, Scheme=100, Rate=110, Amount=160 => Total=700 -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border: 1px solid #cbd5e1; border-collapse: collapse;">
                <!-- Header Row -->
                <tr style="background-color: #0c2b5c;">
                    <td width="230" style="padding: 2px 10px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #ffffff; font-family: Arial, sans-serif;">Description</td>
                    <td width="100" align="center" style="padding: 2px 10px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #ffffff; font-family: Arial, sans-serif;">Dimensions</td>
                    <td width="100" align="center" style="padding: 2px 10px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #ffffff; font-family: Arial, sans-serif;">Scheme</td>
                    <td width="110" align="right" style="padding: 2px 10px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #ffffff; font-family: Arial, sans-serif;">Rate / SQM</td>
                    <td width="160" align="right" style="padding: 2px 10px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #ffffff; font-family: Arial, sans-serif;">Amount</td>
                </tr>
                [[FINANCIAL_TABLE_ROWS]]
            </table>

            <!-- Spacer -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border-collapse: collapse;"><tr><td height="2" style="font-size: 2px; line-height: 2px;">&nbsp;</td></tr></table>

            <!-- ===== 6. PAYMENT DETAILS HEADER ===== -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border-collapse: collapse;">
                <tr>
                    <td width="260" style="padding: 0;"><table border="0" cellpadding="0" cellspacing="0" width="260"><tr><td height="1" style="background-color: #cbd5e1; font-size:1px; line-height:1px;">&nbsp;</td></tr></table></td>
                    <td width="180" align="center" style="font-size: 11px; font-weight: bold; color: #0c2b5c; text-transform: uppercase; letter-spacing: 1px; font-family: Arial, sans-serif; padding: 0 10px;">Payment Details</td>
                    <td width="260" style="padding: 0;"><table border="0" cellpadding="0" cellspacing="0" width="260"><tr><td height="1" style="background-color: #cbd5e1; font-size:1px; line-height:1px;">&nbsp;</td></tr></table></td>
                </tr>
            </table>

            <!-- Spacer -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border-collapse: collapse;"><tr><td height="2" style="font-size: 2px; line-height: 2px;">&nbsp;</td></tr></table>

            <!-- ===== 7. PAYMENT INFO GRID (5 cols, single row) ===== -->
            <!-- Total = 700px. Each card outer = 140px. Inner = 136px (2px pad each side) -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border-collapse: separate; border-spacing: 4px; text-align: center; margin: 0 auto;">
                <tr>
                    <!-- Payment Mode -->
                    <td width="136" valign="middle" style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 2px 4px; height: 32px;">
                        <div style="font-size: 7px; color: #64748b; font-weight: bold; text-transform: uppercase; font-family: Arial, sans-serif; line-height: 1.1;">Payment Mode</div>
                        <div style="font-size: 10px; font-weight: bold; color: #0f172a; font-family: Arial, sans-serif; line-height: 1.1; margin-top: 1px;">[[PAYMENT_MODE]]</div>
                    </td>
                    <!-- Transaction ID -->
                    <td width="136" valign="middle" style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 2px 4px; height: 32px;">
                        <div style="font-size: 7px; color: #64748b; font-weight: bold; text-transform: uppercase; font-family: Arial, sans-serif; line-height: 1.1;">Transaction ID</div>
                        <div style="font-size: 10px; font-weight: bold; color: #0f172a; font-family: Arial, sans-serif; line-height: 1.1; margin-top: 1px; word-break: break-all;">[[TRANSACTION_ID]]</div>
                    </td>
                    <!-- Payment Date -->
                    <td width="136" valign="middle" style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 2px 4px; height: 32px;">
                        <div style="font-size: 7px; color: #64748b; font-weight: bold; text-transform: uppercase; font-family: Arial, sans-serif; line-height: 1.1;">Payment Date</div>
                        <div style="font-size: 10px; font-weight: bold; color: #0f172a; font-family: Arial, sans-serif; line-height: 1.1; margin-top: 1px;">[[PAYMENT_DATE]]</div>
                    </td>
                    <!-- Amount Received -->
                    <td width="136" valign="middle" style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 2px 4px; height: 32px;">
                        <div style="font-size: 7px; color: #64748b; font-weight: bold; text-transform: uppercase; font-family: Arial, sans-serif; line-height: 1.1;">Amount Received</div>
                        <div style="font-size: 10px; font-weight: bold; color: #23471d; font-family: Arial, sans-serif; line-height: 1.1; margin-top: 1px;">[[AMOUNT_PAID]]</div>
                    </td>
                    <!-- Payment Status -->
                    <td width="136" valign="middle" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 2px 4px; height: 32px;">
                        <div style="font-size: 7px; color: #166534; font-weight: bold; text-transform: uppercase; font-family: Arial, sans-serif; line-height: 1.1;">Payment Status</div>
                        <div style="font-size: 10px; font-weight: bold; color: #15803d; font-family: Arial, sans-serif; line-height: 1.1; margin-top: 1px;">[[PAYMENT_STATUS]]</div>
                    </td>
                </tr>
            </table>

            <!-- Spacer -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border-collapse: collapse;"><tr><td height="2" style="font-size: 2px; line-height: 2px;">&nbsp;</td></tr></table>

            <!-- ===== 8. EXHIBITOR DETAILS + IMPORTANT NOTE ===== -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border-collapse: collapse;">
                <tr>
                    <!-- Exhibitor Info -->
                    <td width="340" valign="top">
                        <table border="0" cellpadding="0" cellspacing="0" width="340" style="border: 1px solid #e2e8f0; border-collapse: collapse;">
                            <tr>
                                <td style="background-color: #23471d; color: #ffffff; padding: 3px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; font-family: Arial, sans-serif;">
                                    EXHIBITOR DETAILS
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 5px 12px; background-color: #ffffff; font-size: 11px; color: #334155; line-height: 1.6; font-family: Arial, sans-serif;">
                                    <table border="0" cellpadding="0" cellspacing="0" width="316" style="border-collapse: collapse;">
                                        <tr>
                                            <td width="125" style="color: #64748b; padding-bottom: 4px; font-family: Arial, sans-serif;"><strong>Contact Person:</strong></td>
                                            <td width="191" style="color: #0f172a; padding-bottom: 4px; font-weight: bold; font-family: Arial, sans-serif;">[[CONTACT_PERSON]]</td>
                                        </tr>
                                        <tr>
                                            <td style="color: #64748b; padding-bottom: 4px; font-family: Arial, sans-serif;"><strong>Contact Person Mobile:</strong></td>
                                            <td style="color: #0f172a; padding-bottom: 4px; font-family: Arial, sans-serif;">[[EXHIBITOR_CONTACT]]</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                    <!-- Spacer -->
                    <td width="20">&nbsp;</td>
                    <!-- Important Note -->
                    <td width="340" valign="top">
                        <table border="0" cellpadding="0" cellspacing="0" width="340" style="border: 1px solid #e2e8f0; border-collapse: collapse; background-color: #f8fafc;">
                            <tr>
                                <td style="background-color: #0c2b5c; color: #ffffff; padding: 3px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; font-family: Arial, sans-serif;">
                                    IMPORTANT NOTE
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 12px; font-size: 11px; color: #475569; line-height: 1.5; font-family: Arial, sans-serif;">
                                    <table border="0" cellpadding="0" cellspacing="0" width="316" style="border-collapse: collapse;">
                                        <tr>
                                            <td width="26" valign="top" style="font-size: 16px; color: #0c2b5c;">&#8505;&#65039;</td>
                                            <td valign="top" style="padding-left: 6px; color: #334155; font-size: 11px; line-height: 1.5; font-family: Arial, sans-serif;">
                                                This is a system generated payment receipt and does not require any physical signature.
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <!-- Spacer -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border-collapse: collapse;"><tr><td height="2" style="font-size: 2px; line-height: 2px;">&nbsp;</td></tr></table>

            <!-- ===== 9. THANK YOU FOOTER ===== -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border-collapse: collapse; border-top: 1px solid #e2e8f0;">
                <tr>
                    <td align="center" style="padding: 12px 10px 16px 10px; font-family: Arial, sans-serif;">
                        <span style="font-size: 12px; font-style: italic; color: #d26019; font-weight: bold;">Thank you for your participation in 9th International Health &amp; Wellness Expo 2026.</span>
                    </td>
                </tr>
            </table>


`;

const seedPaymentReceiptTemplate = async () => {
    try {
        if (!process.env.MONGO_URI_MAIN) {
            throw new Error('MONGO_URI_MAIN not found in .env');
        }
        await mongoose.connect(process.env.MONGO_URI_MAIN);
        console.log('Connected to MongoDB for seeding the customized payment receipt template...');

        const templateData = {
            formType: 'exhibitor-payment-receipt',
            emailSubject: 'PAYMENT RECEIPT - [[EXHIBITOR_NAME]] | IHWE 2026',
            emailBody: emailBodyHtml,
            whatsappBody: 'Hello [[CONTACT_PERSON]]! 👋\n\nPayment Received: [[AMOUNT_PAID]] ✅\n\nReg ID: [[REGISTRATION_ID]]\nStall: [[STALL_NO]]\nBalance Due: [[BALANCE_DUE]]\n\nReceipt PDF has been sent to your email.\n\nBest Regards, Team IHWE',
            lastUpdatedBy: null
        };

        const updatedTemplate = await MessageTemplate.findOneAndUpdate(
            { formType: 'exhibitor-payment-receipt' },
            templateData,
            { upsert: true, returnDocument: 'after' }
        );

        console.log('✅ Outlook-safe payment receipt template seeded successfully! exhibitor-payment-receipt');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding payment receipt template:', error);
        process.exit(1);
    }
};

seedPaymentReceiptTemplate();
