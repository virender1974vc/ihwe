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
                    <td width="240" valign="middle" style="padding: 0 10px 8px 10px;">
                        <img src="[[LOGO_URL]]" alt="IHWE Logo" width="180" style="display: block; border: 0; max-width: 180px; height: auto;" />
                    </td>
                    <!-- Divider line -->
                    <td width="1" valign="middle" style="background-color: #e2e8f0; padding: 0;">&nbsp;</td>
                    <!-- Event Date & Venue -->
                    <td width="219" valign="middle" style="padding: 0 10px 8px 15px; font-family: Arial, sans-serif;">
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
                    <td width="240" valign="middle" style="padding: 0 10px 8px 10px;">
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
                <tr><td height="8">&nbsp;</td></tr>
            </table>

            <!-- ===== 2. FROM / TO ADDRESSES ===== -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border-collapse: collapse;">
                <tr>
                    <!-- FROM Card -->
                    <td width="340" valign="top">
                        <table border="0" cellpadding="0" cellspacing="0" width="340" style="border: 1px solid #e2e8f0; border-collapse: collapse;">
                            <tr>
                                <td style="background-color: #0c2b5c; color: #ffffff; padding: 5px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; font-family: Arial, sans-serif;">
                                    FROM (ORGANISER)
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 12px; background-color: #ffffff; font-size: 11px; color: #334155; line-height: 1.5; font-family: Arial, sans-serif;">
                                    <div style="font-size: 12px; font-weight: bold; color: #0c2b5c; margin-bottom: 4px;">Namo Gange Wellness Pvt. Ltd.</div>
                                    12/52, Site-II, Loni Road Industrial Area,<br />
                                    Mohan Nagar, Ghaziabad - 201007,<br />
                                    Uttar Pradesh, India<br />
                                    <div style="margin-top: 5px; border-top: 1px dashed #e2e8f0; padding-top: 4px; font-size: 10px; color: #64748b; line-height: 1.6;">
                                        <strong>GSTIN:</strong> 09AAFCN9238F1Z6<br />
                                    </div>
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
                                <td style="background-color: #23471d; color: #ffffff; padding: 5px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; font-family: Arial, sans-serif;">
                                    TO (EXHIBITOR)
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 12px; background-color: #ffffff; font-size: 11px; color: #334155; line-height: 1.5; font-family: Arial, sans-serif;">
                                    <div style="font-size: 12px; font-weight: bold; color: #23471d; margin-bottom: 4px; text-transform: capitalize;">[[EXHIBITOR_NAME]]</div>
                                    <div style="text-transform: capitalize;">[[EXHIBITOR_ADDRESS]]</div>
                                    <div style="margin-top: 5px; border-top: 1px dashed #e2e8f0; padding-top: 4px; font-size: 10px; color: #64748b; line-height: 1.6;">
                                        <strong>GSTIN:</strong> [[EXHIBITOR_GSTIN]]<br />
                                        <strong>Email:</strong> [[EXHIBITOR_EMAIL]]<br />
                                        <strong>Contact:</strong> [[EXHIBITOR_CONTACT]]
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <!-- Spacer -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border-collapse: collapse;"><tr><td height="10">&nbsp;</td></tr></table>

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
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border-collapse: collapse;">
                <tr>
                    <!-- Stall No -->
                    <td width="116" style="padding: 2px;" valign="top">
                        <table border="0" cellpadding="0" cellspacing="0" width="112" height="46" align="center" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-collapse: collapse; text-align: center;">
                            <tr><td style="padding: 4px 4px 1px 4px; font-size: 7px; color: #64748b; font-weight: bold; text-transform: uppercase; white-space: nowrap; font-family: Arial, sans-serif;">Stall No.</td></tr>
                            <tr><td style="padding: 1px 4px 4px 4px; font-size: 10px; font-weight: bold; color: #0c2b5c; font-family: Arial, sans-serif;">[[STALL_NO]]</td></tr>
                        </table>
                    </td>
                    <!-- Stall Type -->
                    <td width="116" style="padding: 2px;" valign="top">
                        <table border="0" cellpadding="0" cellspacing="0" width="112" height="46" align="center" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-collapse: collapse; text-align: center;">
                            <tr><td style="padding: 4px 4px 1px 4px; font-size: 7px; color: #64748b; font-weight: bold; text-transform: uppercase; white-space: nowrap; font-family: Arial, sans-serif;">Stall Type</td></tr>
                            <tr><td style="padding: 1px 4px 4px 4px; font-size: 9px; font-weight: bold; color: #0c2b5c; line-height: 1.2; font-family: Arial, sans-serif;">[[STALL_TYPE]]</td></tr>
                        </table>
                    </td>
                    <!-- Scheme -->
                    <td width="116" style="padding: 2px;" valign="top">
                        <table border="0" cellpadding="0" cellspacing="0" width="112" height="46" align="center" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-collapse: collapse; text-align: center;">
                            <tr><td style="padding: 4px 4px 1px 4px; font-size: 7px; color: #64748b; font-weight: bold; text-transform: uppercase; white-space: nowrap; font-family: Arial, sans-serif;">Scheme</td></tr>
                            <tr><td style="padding: 1px 4px 4px 4px; font-size: 9px; font-weight: bold; color: #0c2b5c; line-height: 1.2; font-family: Arial, sans-serif;">[[STALL_SCHEME]]</td></tr>
                        </table>
                    </td>
                    <!-- Dimension -->
                    <td width="116" style="padding: 2px;" valign="top">
                        <table border="0" cellpadding="0" cellspacing="0" width="112" height="46" align="center" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-collapse: collapse; text-align: center;">
                            <tr><td style="padding: 4px 4px 1px 4px; font-size: 7px; color: #64748b; font-weight: bold; text-transform: uppercase; white-space: nowrap; font-family: Arial, sans-serif;">Dimension</td></tr>
                            <tr><td style="padding: 1px 4px 4px 4px; font-size: 10px; font-weight: bold; color: #0c2b5c; font-family: Arial, sans-serif;">[[STALL_DIMENSION]]</td></tr>
                        </table>
                    </td>
                    <!-- Stall Size -->
                    <td width="116" style="padding: 2px;" valign="top">
                        <table border="0" cellpadding="0" cellspacing="0" width="112" height="46" align="center" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-collapse: collapse; text-align: center;">
                            <tr><td style="padding: 4px 4px 1px 4px; font-size: 7px; color: #64748b; font-weight: bold; text-transform: uppercase; white-space: nowrap; font-family: Arial, sans-serif;">Stall Size</td></tr>
                            <tr><td style="padding: 1px 4px 4px 4px; font-size: 10px; font-weight: bold; color: #0c2b5c; font-family: Arial, sans-serif;">[[STALL_SIZE]] SQM</td></tr>
                        </table>
                    </td>
                    <!-- Event -->
                    <td width="120" style="padding: 2px;" valign="top">
                        <table border="0" cellpadding="0" cellspacing="0" width="116" height="46" align="center" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-collapse: collapse; text-align: center;">
                            <tr><td style="padding: 4px 4px 1px 4px; font-size: 7px; color: #64748b; font-weight: bold; text-transform: uppercase; white-space: nowrap; font-family: Arial, sans-serif;">Event</td></tr>
                            <tr><td style="padding: 1px 4px 4px 4px; font-size: 10px; font-weight: bold; color: #0c2b5c; font-family: Arial, sans-serif;">9IHWE 2026</td></tr>
                        </table>
                    </td>
                </tr>
            </table>

            <!-- Spacer -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border-collapse: collapse;"><tr><td height="10">&nbsp;</td></tr></table>

            <!-- ===== 5. FINANCIAL TABLE ===== -->
            <!-- Col widths: Desc=230, Dim=100, Scheme=100, Rate=110, Amount=160 => Total=700 -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border: 1px solid #cbd5e1; border-collapse: collapse;">
                <!-- Header Row -->
                <tr style="background-color: #0c2b5c;">
                    <td width="230" style="padding: 7px 10px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #ffffff; font-family: Arial, sans-serif;">Description</td>
                    <td width="100" align="center" style="padding: 7px 10px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #ffffff; font-family: Arial, sans-serif;">Dimensions</td>
                    <td width="100" align="center" style="padding: 7px 10px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #ffffff; font-family: Arial, sans-serif;">Scheme</td>
                    <td width="110" align="right" style="padding: 7px 10px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #ffffff; font-family: Arial, sans-serif;">Rate / SQM</td>
                    <td width="160" align="right" style="padding: 7px 10px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #ffffff; font-family: Arial, sans-serif;">Amount</td>
                </tr>
                [[FINANCIAL_TABLE_ROWS]]
            </table>

            <!-- Spacer -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border-collapse: collapse;"><tr><td height="10">&nbsp;</td></tr></table>

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
            <!-- Total = 700px. Each card outer = 140px. Inner = 132px (4px pad each side) -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border-collapse: collapse;">
                <tr>
                    <!-- Payment Mode -->
                    <td width="140" style="padding: 4px;" valign="top">
                        <table border="0" cellpadding="0" cellspacing="0" width="132" height="46" style="border: 1px solid #e2e8f0; border-collapse: collapse; text-align: center; background-color: #ffffff;">
                            <tr><td style="padding: 4px 4px 1px 4px; font-size: 8px; color: #64748b; font-weight: bold; text-transform: uppercase; font-family: Arial, sans-serif;">Payment Mode</td></tr>
                            <tr><td style="padding: 1px 4px 4px 4px; font-size: 10px; font-weight: bold; color: #0f172a; font-family: Arial, sans-serif;">[[PAYMENT_MODE]]</td></tr>
                        </table>
                    </td>
                    <!-- Transaction ID -->
                    <td width="140" style="padding: 4px;" valign="top">
                        <table border="0" cellpadding="0" cellspacing="0" width="132" height="46" style="border: 1px solid #e2e8f0; border-collapse: collapse; text-align: center; background-color: #ffffff;">
                            <tr><td style="padding: 4px 4px 1px 4px; font-size: 8px; color: #64748b; font-weight: bold; text-transform: uppercase; font-family: Arial, sans-serif;">Transaction ID</td></tr>
                            <tr><td style="padding: 1px 4px 4px 4px; font-size: 10px; font-weight: bold; color: #0f172a; font-family: Arial, sans-serif; word-break: break-all;">[[TRANSACTION_ID]]</td></tr>
                        </table>
                    </td>
                    <!-- Payment Date -->
                    <td width="140" style="padding: 4px;" valign="top">
                        <table border="0" cellpadding="0" cellspacing="0" width="132" height="46" style="border: 1px solid #e2e8f0; border-collapse: collapse; text-align: center; background-color: #ffffff;">
                            <tr><td style="padding: 4px 4px 1px 4px; font-size: 8px; color: #64748b; font-weight: bold; text-transform: uppercase; font-family: Arial, sans-serif;">Payment Date</td></tr>
                            <tr><td style="padding: 1px 4px 4px 4px; font-size: 10px; font-weight: bold; color: #0f172a; font-family: Arial, sans-serif;">[[PAYMENT_DATE]]</td></tr>
                        </table>
                    </td>
                    <!-- Amount Received -->
                    <td width="140" style="padding: 4px;" valign="top">
                        <table border="0" cellpadding="0" cellspacing="0" width="132" height="46" style="border: 1px solid #e2e8f0; border-collapse: collapse; text-align: center; background-color: #ffffff;">
                            <tr><td style="padding: 4px 4px 1px 4px; font-size: 8px; color: #64748b; font-weight: bold; text-transform: uppercase; font-family: Arial, sans-serif;">Amount Received</td></tr>
                            <tr><td style="padding: 1px 4px 4px 4px; font-size: 10px; font-weight: bold; color: #23471d; font-family: Arial, sans-serif;">[[AMOUNT_PAID]]</td></tr>
                        </table>
                    </td>
                    <!-- Payment Status -->
                    <td width="140" style="padding: 4px;" valign="top">
                        <table border="0" cellpadding="0" cellspacing="0" width="132" height="46" style="border: 1px solid #bbf7d0; border-collapse: collapse; text-align: center; background-color: #f0fdf4;">
                            <tr><td style="padding: 4px 4px 1px 4px; font-size: 8px; color: #166534; font-weight: bold; text-transform: uppercase; font-family: Arial, sans-serif;">Payment Status</td></tr>
                            <tr><td style="padding: 1px 4px 4px 4px; font-size: 10px; font-weight: bold; color: #15803d; font-family: Arial, sans-serif;">[[PAYMENT_STATUS]]</td></tr>
                        </table>
                    </td>
                </tr>
            </table>

            <!-- Spacer -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border-collapse: collapse;"><tr><td height="10">&nbsp;</td></tr></table>

            <!-- ===== 8. EXHIBITOR DETAILS + IMPORTANT NOTE ===== -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border-collapse: collapse;">
                <tr>
                    <!-- Exhibitor Info -->
                    <td width="340" valign="top">
                        <table border="0" cellpadding="0" cellspacing="0" width="340" style="border: 1px solid #e2e8f0; border-collapse: collapse;">
                            <tr>
                                <td style="background-color: #23471d; color: #ffffff; padding: 5px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; font-family: Arial, sans-serif;">
                                    EXHIBITOR DETAILS
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 12px; background-color: #ffffff; font-size: 11px; color: #334155; line-height: 1.6; font-family: Arial, sans-serif;">
                                    <table border="0" cellpadding="0" cellspacing="0" width="316" style="border-collapse: collapse;">
                                        <tr>
                                            <td width="125" style="color: #64748b; padding-bottom: 4px; font-family: Arial, sans-serif;"><strong>Exhibitor Name:</strong></td>
                                            <td width="191" style="color: #0f172a; padding-bottom: 4px; font-weight: bold; font-family: Arial, sans-serif;">[[CONTACT_PERSON]]</td>
                                        </tr>
                                        <tr>
                                            <td style="color: #64748b; padding-bottom: 4px; font-family: Arial, sans-serif;"><strong>Exhibitor Mobile:</strong></td>
                                            <td style="color: #0f172a; padding-bottom: 4px; font-family: Arial, sans-serif;">[[EXHIBITOR_CONTACT]]</td>
                                        </tr>
                                        <tr>
                                            <td style="color: #64748b; font-family: Arial, sans-serif;"><strong>Relationship Mgr:</strong></td>
                                            <td style="color: #0f172a; font-family: Arial, sans-serif;">[[REFERRED_BY]]</td>
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
                                <td style="background-color: #0c2b5c; color: #ffffff; padding: 5px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; font-family: Arial, sans-serif;">
                                    IMPORTANT NOTE
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 14px 12px; font-size: 11px; color: #475569; line-height: 1.5; font-family: Arial, sans-serif;">
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
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border-collapse: collapse;"><tr><td height="12">&nbsp;</td></tr></table>

            <!-- ===== 9. THANK YOU FOOTER ===== -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border-collapse: collapse; border-top: 1px solid #e2e8f0;">
                <tr>
                    <td align="center" style="padding: 12px 10px 16px 10px; font-family: Arial, sans-serif;">
                        <span style="font-size: 12px; font-style: italic; color: #d26019; font-weight: bold;">Thank you for your participation in</span><br />
                        <span style="font-size: 14px; font-weight: bold; color: #0c2b5c;">9th International Health &amp; Wellness Expo 2026.</span><br />
                        <span style="font-size: 11px; color: #64748b;">We look forward to a successful association!</span>
                    </td>
                </tr>
            </table>

            <!-- ===== 10. CONTACT BAR ===== -->
            <table border="0" cellpadding="0" cellspacing="0" width="700" style="border: 1px solid #cbd5e1; border-collapse: collapse; background-color: #f8fafc;">
                <tr>
                    <!-- Phone (Left) -->
                    <td width="230" align="left" style="padding: 10px 10px 10px 15px; font-size: 11px; font-family: Arial, sans-serif; color: #475569;">
                        <strong>&#128222; <a href="tel:+919654900525" style="color: #0c2b5c; text-decoration: none; font-weight: bold;">+91-9654900525</a></strong>
                    </td>
                    <!-- Email (Center) -->
                    <td width="240" align="center" style="padding: 10px; font-size: 11px; font-family: Arial, sans-serif; color: #475569;">
                        <strong>&#9993;&#65039; <a href="mailto:info@ihwe.in" style="color: #0c2b5c; text-decoration: none; font-weight: bold;">info@ihwe.in</a></strong>
                    </td>
                    <!-- Web (Right) -->
                    <td width="230" align="right" style="padding: 10px 15px 10px 10px; font-size: 11px; font-family: Arial, sans-serif; color: #475569;">
                        <strong>&#127760; <a href="https://www.ihwe.in" target="_blank" style="color: #0c2b5c; text-decoration: none; font-weight: bold;">www.ihwe.in</a></strong>
                    </td>
                </tr>
            </table>

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
            { upsert: true, new: true }
        );

        console.log('✅ Outlook-safe payment receipt template seeded successfully! exhibitor-payment-receipt');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding payment receipt template:', error);
        process.exit(1);
    }
};

seedPaymentReceiptTemplate();
