'use strict';
async function sendAdvancePaymentConfirmation({ to, payment, docData, contact, event }) {
    if (!to) return false;
    try {
        const emailTemplateGenerator = require('../emailTemplateGenerator');
        const Stall = require('../../models/Stall');
        const StallAccessory = require('../../models/StallAccessory');
        const ExhibitorPassConfig = require('../../models/ExhibitorPassConfig');
        const { computeEntitlement, computeVehicleEntitlements } = require('../entitlementCalculator');

        const paidAmount = Number(payment.amount_text || payment.f_amount || 0);
        const totalAmount = Number(docData?.finalAmount || 0);
        const proformaInvoiceNo = docData?.est_no || docData?.pi_no || docData?.invoice_no || '—';
        const eventName = docData?.event_name || event?.name || '9th International Health & Wellness Expo 2026 – Global Edition';

        const exhibitor = contact?.exhibitor || {};
        const participation = exhibitor.participation || {};
        const stall = participation.stallNo
            ? await Stall.findById(participation.stallNo).lean().catch(() => null)
            : null;
        const stallNo = stall?.stallNumber || participation.stallFor || participation.stallNumber || 'Not assigned';
        const hallMatch = String(stallNo).match(/^H(\d+)/i);
        const hallNo = participation.hallNo || (hallMatch ? hallMatch[1] : '12');
        const stallSize = Number(stall?.area || participation.stallSize || 0);
        const stallType = participation.stallType || 'Not specified';
        const stallPosition = stall?.plScheme || participation.stallScheme || 'Not specified';
        const dimensions = stall?.length && stall?.width ? `${stall.length} x ${stall.width} m` : (participation.dimension || 'Not specified');
        const complimentaryAccessories = /shell/i.test(stallType)
            ? await StallAccessory.find({ type: 'complimentary', isActive: true }).sort({ sortOrder: 1, createdAt: -1 }).lean()
            : [];
        const shellSchemeInclusions = complimentaryAccessories
            .map((item) => {
                const qty = computeEntitlement({
                    allocationMode: item.allocationMode,
                    ratioQty: item.ratioQty,
                    ratioArea: item.ratioArea,
                    roundingMode: item.roundingMode,
                    fixedQty: item.includedQty,
                }, stallSize);
                return qty > 0 ? `${qty} ${item.name}` : null;
            })
            .filter(Boolean);
        if (!shellSchemeInclusions.length) shellSchemeInclusions.push('No complimentary accessories configured.');

        const passConfigs = await ExhibitorPassConfig.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 }).lean();
        const passes = [];
        const hospitality = [];
        passConfigs.forEach((config) => {
            if (config.passType === 'vehicle') {
                const vehicle = computeVehicleEntitlements(config, stallSize);
                const qty = Number(vehicle.twoWheeler || 0) + Number(vehicle.fourWheeler || 0);
                if (qty > 0) passes.push(`${qty} ${config.title || 'Vehicle Passes'}`);
                return;
            }
            const qty = computeEntitlement({
                allocationMode: config.allocationMode,
                ratioQty: config.ratioQty,
                ratioArea: config.ratioArea,
                roundingMode: config.roundingMode,
                fixedQty: config.complimentaryQuota,
            }, stallSize);
            if (qty <= 0) return;
            if (config.passType === 'lunch' || config.passType === 'water') {
                hospitality.push(`${qty} ${config.title}`);
            } else if (['visitor', 'service', 'exhibitor'].includes(config.passType)) {
                passes.push(`${qty} ${config.title}`);
            }
        });
        if (!hospitality.length) hospitality.push('No complimentary hospitality allocation configured.');
        if (!passes.length) passes.push('No complimentary passes configured.');
        const backendUrl = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
        const siteUrl = (process.env.SITE_URL || 'https://www.ihwe.in').replace(/\/$/, '');

        const data = {
            clientName: contact?.name,
            companyName: contact?.companyName,
            eventName,
            proformaInvoiceNo,
            totalAmount,
            netPayable: totalAmount,
            amountPaid: paidAmount,
            paymentStatus: 'PARTIAL',
            paymentDate: payment.payment_date || payment.added,
            paymentPlanLabel: payment.pymnt_type || docData?.paymentPlanLabel || 'Advance Payment',
            pendingInstallmentLabel: 'Balance Payment',
            dashboardUrl: `${(process.env.SITE_URL || 'https://www.ihwe.in').replace(/\/$/, '')}/exhibitor-login`,
            dashboardUsername: contact?.email,
            stallNo,
            hallNo,
            stallSize: stallSize ? `${stallSize} Sq. Mtr.` : 'Not specified',
            stallType,
            stallPosition,
            floorPlanReference: `${dimensions} | Stall ${stallNo}`,
            shellSchemeInclusions,
            hospitality,
            exhibitorPasses: passes,
            proformaInvoiceUrl: `${backendUrl}/api/estimates/${docData?._id || payment.invoice_id}/public-view`,
            paymentReceiptUrl: `${backendUrl}/api/payments/${payment._id}/receipt`,
            arogyaRegistrationUrl: 'https://arogya.namogange.org/register-now',
            buyerSellerRegistrationUrl: `${siteUrl}/buyer-seller-meet`
        };

        const { subject, html, attachments } = emailTemplateGenerator.generateIHWEConfirmation({
            subject: `PAYMENT RECEIVED — ${proformaInvoiceNo} | ${data.companyName || 'IHWE 2026'}`,
            data,
            template: {}
        });

        return await this.sendEmail({
            to,
            subject,
            html,
            attachments,
            profile: 'EXHIBITOR',
            logData: {
                name: contact?.name,
                phone: contact?.mobile,
                message: `Advance Payment Confirmation (${proformaInvoiceNo})`
            }
        });
    } catch (err) {
        console.error('sendAdvancePaymentConfirmation error:', err.message);
        return false;
    }
}

module.exports = sendAdvancePaymentConfirmation;
