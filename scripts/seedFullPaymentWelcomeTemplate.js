const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MessageTemplate = require('../models/MessageTemplate');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const emailBodyHtml = `
<table border="0" cellpadding="0" cellspacing="0" width="760" style="font-family: Arial, Helvetica, sans-serif; color: #333333; font-size: 13px; background-color: #ffffff; border-collapse: collapse;" align="center">
    <tr>
        <td width="760">

            <!-- ===== GREETING (left) + DOWNLOAD CARDS (right) ===== -->
            <table border="0" cellpadding="0" cellspacing="0" width="760" style="border-collapse: collapse;">
                <tr>
                    <td width="420" valign="top" style="padding: 0 14px 0 4px; font-family: Arial, sans-serif;">
                        <div style="font-size: 16px; font-weight: bold; color: #0c2b5c; margin-bottom: 2px;">Dear [[CONTACT_PERSON]],</div>
                        <div style="font-size: 13px; font-weight: bold; color: #d26019; margin-bottom: 8px;">Namo Gange Namaskar!</div>
                        <p style="margin: 0 0 3px; font-size: 12px; line-height: 1.45; color: #334155; text-align: justify;">We are delighted to confirm your participation in the <strong>9th International Health &amp; Wellness Expo 2026 &ndash; Global Edition</strong>.</p>
                        <p style="margin: 0 0 3px; font-size: 12px; line-height: 1.45; color: #334155; text-align: justify;">Your full payment has been received successfully. Thank you for your trust and valuable association with us.</p>
                        <p style="margin: 0 0 3px; font-size: 12px; line-height: 1.45; color: #334155; text-align: justify;">IHWE 2026 is India&rsquo;s most impactful health &amp; wellness platform, bringing together global exhibitors, healthcare professionals, industry leaders, buyers and thought leaders on one dynamic platform to collaborate, innovate and create lasting impact.</p>
                        <p style="margin: 0 0 3px; font-size: 12px; line-height: 1.45; color: #334155; text-align: justify;">We are committed to delivering an exceptional experience and ensuring you achieve the best possible outcomes through meaningful business connections, brand visibility and knowledge exchange.</p>
                        <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #334155; text-align: justify;">We look forward to welcoming your team to Pragati Maidan, New Delhi, from <strong>21 &ndash; 23 August 2026</strong>.</p>
                    </td>
                    <td width="40">&nbsp;</td>
                    <td width="300" valign="middle" style="padding: 0 4px;">
                        [[DOWNLOAD_BUTTONS]]
                    </td>
                </tr>
            </table>

            <!-- Spacer -->
            <table border="0" cellpadding="0" cellspacing="0" width="760" style="border-collapse: collapse;"><tr><td height="10" style="font-size: 10px; line-height: 10px;">&nbsp;</td></tr></table>

            <!-- ===== 1. BOOKING & PAYMENT SUMMARY  |  2. STALL DETAILS & INCLUSIONS ===== -->
            <table border="0" cellpadding="0" cellspacing="0" width="760" style="border-collapse: collapse;">
                <tr>
                    <td width="304" valign="top">
                        <table border="0" cellpadding="0" cellspacing="0" width="304" style="border: 1px solid #e2e8f0; border-collapse: collapse; height: 100%;">
                            <tr>
                                <td style="background-color: #0c2b5c; color: #ffffff; padding: 5px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; font-family: Arial, sans-serif;">
                                    1. Booking &amp; Payment Summary
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 12px; background-color: #ffffff; font-family: Arial, sans-serif;">
                                    <table border="0" cellpadding="0" cellspacing="0" width="280" style="border-collapse: collapse; font-size: 10px;">
                                        <tr>
                                            <td width="120" style="padding: 3px 0; color: #64748b;">Company Name</td>
                                            <td width="12" style="padding: 3px 0; color: #94a3b8;">:</td>
                                            <td style="padding: 3px 0; color: #0f172a; font-weight: bold;">[[EXHIBITOR_NAME]]</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 3px 0; color: #64748b;">Proforma Inv. No.</td>
                                            <td style="padding: 3px 0; color: #94a3b8;">:</td>
                                            <td style="padding: 3px 0; color: #0f172a; font-weight: bold;">[[PI_NO]]</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 3px 0; color: #64748b;">Booking Amount</td>
                                            <td style="padding: 3px 0; color: #94a3b8;">:</td>
                                            <td style="padding: 3px 0; color: #0f172a; font-weight: bold;">[[BOOKING_AMOUNT]]</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 3px 0; color: #64748b;">TDS Deducted</td>
                                            <td style="padding: 3px 0; color: #94a3b8;">:</td>
                                            <td style="padding: 3px 0; color: #0f172a; font-weight: bold;">[[TDS_DEDUCTED]]</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 3px 0; color: #64748b; border-top: 1px solid #f1f5f9;">Net Payable</td>
                                            <td style="padding: 3px 0; color: #94a3b8; border-top: 1px solid #f1f5f9;">:</td>
                                            <td style="padding: 3px 0; color: #0f172a; font-weight: bold; border-top: 1px solid #f1f5f9;">[[NET_PAYABLE]]</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 3px 0; color: #64748b;">Amount Received</td>
                                            <td style="padding: 3px 0; color: #94a3b8;">:</td>
                                            <td style="padding: 3px 0; color: #15803d; font-weight: bold;">[[AMOUNT_PAID]]</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 3px 0; color: #64748b;">Balance Amount</td>
                                            <td style="padding: 3px 0; color: #94a3b8;">:</td>
                                            <td style="padding: 3px 0; color: #0f172a; font-weight: bold;">[[BALANCE_DUE]]</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 5px 0 3px; color: #64748b; font-weight: bold;">Status</td>
                                            <td style="padding: 5px 0 3px; color: #94a3b8;">:</td>
                                            <td style="padding: 5px 0 3px;">
                                                <span style="background-color: #f0fdf4; color: #15803d; font-weight: bold; font-size: 9px; padding: 2px 7px; border-radius: 10px; border: 1px solid #bbf7d0; white-space: nowrap;">&#10003; [[PAYMENT_STATUS]]</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 3px 0; color: #64748b;">Payment Date</td>
                                            <td style="padding: 3px 0; color: #94a3b8;">:</td>
                                            <td style="padding: 3px 0; color: #0f172a; font-weight: bold;">[[PAYMENT_DATE]]</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                    <td width="16">&nbsp;</td>
                    <td width="440" valign="top">
                        <table border="0" cellpadding="0" cellspacing="0" width="440" style="border: 1px solid #e2e8f0; border-collapse: collapse; height: 100%;">
                            <tr>
                                <td style="background-color: #23471d; color: #ffffff; padding: 5px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; font-family: Arial, sans-serif;">
                                    2. Stall Details &amp; Inclusions
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 12px; background-color: #ffffff; font-family: Arial, sans-serif;">
                                    <table border="0" cellpadding="0" cellspacing="0" width="416" style="border-collapse: collapse;">
                                        <tr>
                                            <!-- Left sub-column: stall fields -->
                                            <td width="193" valign="top" style="padding-right: 8px; border-right: 1px solid #f1f5f9;">
                                                <div style="font-size: 8px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px;">Stall No.</div>
                                                <div style="font-size: 11px; font-weight: bold; color: #0f172a; margin-bottom: 5px;">[[STALL_NO]]</div>
                                                <div style="font-size: 8px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px;">Hall No.</div>
                                                <div style="font-size: 11px; font-weight: bold; color: #0f172a; margin-bottom: 5px;">[[HALL_NO]]</div>
                                                <div style="font-size: 8px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px;">Stall Size</div>
                                                <div style="font-size: 11px; font-weight: bold; color: #0f172a; margin-bottom: 5px;">[[STALL_SIZE]] Sq. Mtr.</div>
                                                <div style="font-size: 8px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px;">Stall Type</div>
                                                <div style="font-size: 11px; font-weight: bold; color: #0f172a; margin-bottom: 5px;">[[STALL_TYPE]]</div>
                                                <div style="font-size: 8px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px;">Scheme</div>
                                                <div style="font-size: 11px; font-weight: bold; color: #0f172a; margin-bottom: 5px;">[[STALL_SCHEME]]</div>
                                                <div style="font-size: 8px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px;">Position</div>
                                                <div style="font-size: 11px; font-weight: bold; color: #0f172a;">[[STALL_POSITION]]</div>
                                            </td>
                                            <!-- Right sub-column: inclusions / hospitality / passes -->
                                            <td width="207" valign="top" style="padding-left: 8px;">
                                                [[INCLUSIONS_BLOCK]]

                                                <div style="font-size: 9px; font-weight: bold; color: #0c2b5c; text-transform: uppercase; letter-spacing: 0.4px; margin: 6px 0 3px;">Exhibitor Hospitality</div>
                                                <div style="font-size: 10px; color: #334155; line-height: 1.4;">&#8226; [[HOSPITALITY_TEXT]]</div>

                                                <div style="font-size: 9px; font-weight: bold; color: #0c2b5c; text-transform: uppercase; letter-spacing: 0.4px; margin: 6px 0 3px;">Exhibitor Passes</div>
                                                <ul style="margin: 0; padding-left: 13px; font-size: 10px; color: #334155; line-height: 1.4;">
                                                    [[PASSES_ROWS]]
                                                </ul>
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
            <table border="0" cellpadding="0" cellspacing="0" width="760" style="border-collapse: collapse;"><tr><td height="10" style="font-size: 10px; line-height: 10px;">&nbsp;</td></tr></table>

            <!-- ===== 3. 18TH INTEGRATED AROGYA SANGHOSHTHI  |  REGISTER DELEGATES ===== -->
            <table border="0" cellpadding="0" cellspacing="0" width="760" style="border-collapse: collapse; margin-bottom: 10px;">
                <tr>
                    <td width="476" valign="top" style="border: 1px solid #e5d5f5; background-color: #faf5ff;">
                        <table border="0" cellpadding="0" cellspacing="0" width="476" style="border-collapse: collapse; height: 100%;"><tr>
                            <td style="padding: 10px 14px; font-family: Arial, sans-serif;">
                                <div style="font-size: 13px; font-weight: bold; color: #7e22ce; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 4px;">3. 18th Integrated Arogya Sanghoshthi</div>
                                <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">21 &ndash; 23 August 2026 &nbsp;|&nbsp; Pragati Maidan</div>
                                <p style="margin: 0 0 4px; font-size: 11px; line-height: 1.5; color: #475569;">A three-day premier knowledge platform featuring 3 sessions per day and 30&ndash;45 renowned speakers including Doctors, Researchers, Academicians, AYUSH Experts, Industry Leaders and Students.</p>
                                <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #475569;">The platform fosters insightful discussions, knowledge exchange and innovation across healthcare, AYUSH, wellness and preventive health.</p>
                            </td>
                        </tr></table>
                    </td>
                    <td width="16">&nbsp;</td>
                    <td width="268" valign="top" style="border: 1px solid #e2e8f0;">
                        <table border="0" cellpadding="0" cellspacing="0" width="268" style="border-collapse: collapse; height: 100%;"><tr>
                            <td style="padding: 12px 14px; font-family: Arial, sans-serif;">
                                <div style="font-size: 12px; font-weight: bold; color: #7e22ce; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 5px;">Register Delegates</div>
                                <p style="margin: 0 0 8px; font-size: 10px; line-height: 1.5; color: #475569;">Secure your seat and participate in insightful sessions, earn certificates and network with experts and peers from across the globe.</p>
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr>
                                    <td bgcolor="#7e22ce" style="background: #7e22ce; border-radius: 4px;" align="center">
                                        <a href="[[REGISTER_DELEGATES_URL]]" style="display: inline-block; padding: 8px 16px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: bold;">REGISTER NOW</a>
                                    </td>
                                </tr></table>
                            </td>
                        </tr></table>
                    </td>
                </tr>
            </table>

            <!-- ===== 4. BUYER-SELLER MEET  |  REGISTER FOR BUYER-SELLER MEET ===== -->
            <table border="0" cellpadding="0" cellspacing="0" width="760" style="border-collapse: collapse; margin-bottom: 10px;">
                <tr>
                    <td width="476" valign="top" style="border: 1px solid #fde0c9; background-color: #fff8f2;">
                        <table border="0" cellpadding="0" cellspacing="0" width="476" style="border-collapse: collapse; height: 100%;"><tr>
                            <td style="padding: 10px 14px; font-family: Arial, sans-serif;">
                                <div style="font-size: 13px; font-weight: bold; color: #c2410c; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 4px;">4. Buyer-Seller Meet (2nd Edition)</div>
                                <p style="margin: 0 0 4px; font-size: 11px; line-height: 1.5; color: #475569;">Connect with International &amp; Domestic Buyers, Distributors, Importers, Exporters, Institutional Buyers and Industry Decision Makers in pre-scheduled B2B meetings.</p>
                                <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #475569;">This is your opportunity to showcase your products, expand your reach, build strong business relationships and explore new markets.</p>
                            </td>
                        </tr></table>
                    </td>
                    <td width="16">&nbsp;</td>
                    <td width="268" valign="top" style="border: 1px solid #e2e8f0;">
                        <table border="0" cellpadding="0" cellspacing="0" width="268" style="border-collapse: collapse; height: 100%;"><tr>
                            <td style="padding: 12px 14px; font-family: Arial, sans-serif;">
                                <div style="font-size: 12px; font-weight: bold; color: #c2410c; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 5px;">Register for Buyer-Seller Meet</div>
                                <p style="margin: 0 0 8px; font-size: 10px; line-height: 1.5; color: #475569;">Register your company profile to get visibility among verified buyers and schedule one-to-one meetings.</p>
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr>
                                    <td bgcolor="#c2410c" style="background: #c2410c; border-radius: 4px;" align="center">
                                        <a href="[[REGISTER_BUYER_SELLER_URL]]" style="display: inline-block; padding: 8px 16px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: bold;">REGISTER NOW</a>
                                    </td>
                                </tr></table>
                            </td>
                        </tr></table>
                    </td>
                </tr>
            </table>

            <!-- ===== 5. EXHIBITOR DASHBOARD ACCESS ===== -->
            <table border="0" cellpadding="0" cellspacing="0" width="760" style="border: 1px solid #e2e8f0; border-collapse: collapse; margin-bottom: 10px;">
                <tr>
                    <td style="background-color: #0c2b5c; color: #ffffff; padding: 5px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; font-family: Arial, sans-serif;">
                        5. Exhibitor Dashboard Access
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 14px; background-color: #ffffff; font-family: Arial, sans-serif;">
                        <table border="0" cellpadding="0" cellspacing="0" width="732" style="border-collapse: collapse;">
                            <tr>
                                <!-- Left: description -->
                                <td width="421" valign="top" style="padding-right: 12px;">
                                    <p style="margin: 0 0 6px; font-size: 11px; line-height: 1.5; color: #475569;">Your one-stop platform to manage your profile, passes, documents, service requests and all event-related activities conveniently.</p>
                                    <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #475569;">Log in to access all essential tools and stay updated throughout the event journey.</p>
                                </td>
                                <!-- Right: credentials + CTA -->
                                <td width="311" valign="top" style="padding-left: 12px; border-left: 1px solid #f1f5f9;">
                                    <table border="0" cellpadding="0" cellspacing="0" width="299" style="border-collapse: collapse; font-size: 11px;">
                                        <tr>
                                            <td width="105" style="padding: 2px 0; color: #64748b;">Dashboard URL</td>
                                            <td width="12" style="padding: 2px 0; color: #94a3b8;">:</td>
                                            <td style="padding: 2px 0; color: #0c2b5c; font-weight: bold; word-break: break-all;"><a href="[[LOGIN_URL]]" style="color: #0c2b5c;">[[LOGIN_URL]]</a></td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 2px 0; color: #64748b;">Username</td>
                                            <td style="padding: 2px 0; color: #94a3b8;">:</td>
                                            <td style="padding: 2px 0; color: #0f172a; font-weight: bold;">[[USERNAME]]</td>
                                        </tr>
                                    </table>
                                    <div style="height: 8px; line-height: 8px; font-size: 8px;">&nbsp;</div>
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr>
                                        <td bgcolor="#0c2b5c" style="background: #0c2b5c; border-radius: 4px;" align="center">
                                            <a href="[[LOGIN_URL]]" style="display: inline-block; padding: 8px 16px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: bold;">LOGIN TO DASHBOARD</a>
                                        </td>
                                    </tr></table>
                                    <div style="font-size: 9px; color: #64748b; margin-top: 4px;">All your event essentials in one place.</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <!-- ===== 6. RELATIONSHIP & SUPPORT TEAM ===== -->
            <table border="0" cellpadding="0" cellspacing="0" width="760" style="border: 1px solid #e2e8f0; border-collapse: collapse; margin-bottom: 6px;">
                <tr>
                    <td style="background-color: #f8fafc; color: #0c2b5c; padding: 5px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; font-family: Arial, sans-serif; border-bottom: 1px solid #e2e8f0;">
                        6. Your Relationship &amp; Support Team
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 14px; background-color: #ffffff; font-family: Arial, sans-serif;">
                        <table border="0" cellpadding="0" cellspacing="0" width="732" style="border-collapse: collapse; font-size: 11px;">
                            <tr>
                                <td width="183" valign="top" style="padding: 4px 6px 4px 0;">
                                    <div style="font-weight: bold; color: #0c2b5c; margin-bottom: 2px; text-transform: uppercase; font-size: 10px;">Relationship Manager</div>
                                    <div style="color: #334155;">[[RM_NAME]]</div>
                                    <div style="color: #334155;">[[RM_PHONE]]</div>
                                    <div style="color: #334155;">[[RM_EMAIL]]</div>
                                </td>
                                <td width="183" valign="top" style="padding: 4px 6px; border-left: 1px solid #f1f5f9;">
                                    <div style="font-weight: bold; color: #0c2b5c; margin-bottom: 2px; text-transform: uppercase; font-size: 10px;">Accounts Support</div>
                                    <div style="color: #334155;">[[ACCOUNTS_PHONE]]</div>
                                    <div style="color: #334155;">[[ACCOUNTS_EMAIL]]</div>
                                </td>
                                <td width="183" valign="top" style="padding: 4px 6px; border-left: 1px solid #f1f5f9;">
                                    <div style="font-weight: bold; color: #0c2b5c; margin-bottom: 2px; text-transform: uppercase; font-size: 10px;">Exhibitor Helpline</div>
                                    <div style="color: #334155;">[[HELPLINE_PHONE]]</div>
                                    <div style="color: #334155;">[[HELPLINE_EMAIL]]</div>
                                </td>
                                <td width="183" valign="top" style="padding: 4px 0 4px 6px; border-left: 1px solid #f1f5f9;">
                                    <div style="color: #475569; font-size: 10px; line-height: 1.4; margin-bottom: 4px;">For stall, passes, services or any event-related assistance, please contact your Relationship Manager.</div>
                                    <div style="color: #15803d; font-weight: bold; font-size: 10px; line-height: 1.4;">We are committed to making your participation seamless and successful!</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <!-- ===== BESPOKE EVENT FOOTER ===== -->
            [[FOOTER_BLOCK]]

</td>
    </tr>
</table>
`;

const seedFullPaymentWelcomeTemplate = async () => {
    try {
        if (!process.env.MONGO_URI_MAIN) {
            throw new Error('MONGO_URI_MAIN not found in .env');
        }
        await mongoose.connect(process.env.MONGO_URI_MAIN);
        console.log('Connected to MongoDB for seeding the full payment welcome template...');

        const templateData = {
            formType: 'exhibitor-full-payment-welcome',
            emailSubject: 'PAYMENT CONFIRMED - Welcome to IHWE 2026, [[EXHIBITOR_NAME]]!',
            emailBody: emailBodyHtml,
            whatsappBody: 'Namo Gange Namaskar [[CONTACT_PERSON]]! 🙏\n\nYour full payment for IHWE 2026 has been received. ✅\n\nStall: [[STALL_NO]]\nAmount Received: [[AMOUNT_PAID]]\n\nProforma Invoice, Payment Receipt and your Exhibitor Dashboard login have been sent to your email.\n\nBest Regards, Team IHWE',
            lastUpdatedBy: null
        };

        await MessageTemplate.findOneAndUpdate(
            { formType: 'exhibitor-full-payment-welcome' },
            templateData,
            { upsert: true, returnDocument: 'after' }
        );

        console.log('✅ Full payment welcome template seeded successfully! exhibitor-full-payment-welcome');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding full payment welcome template:', error);
        process.exit(1);
    }
};

seedFullPaymentWelcomeTemplate();
