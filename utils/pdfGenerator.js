const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const Settings = require('../models/Settings');

const TEMP_DIR = path.join(__dirname, '..', 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
function getTempPdfUrl(filePath) {
    const fileName = path.basename(filePath);
    const backendUrl = (process.env.BACKEND_URL || process.env.SITE_URL || 'http://localhost:5000').replace(/\/$/, '');
    return `${backendUrl}/temp/${fileName}`;
}

// Resolve header/footer image paths dynamically from Settings, with hardcoded filenames as fallback
async function resolveHeaderFooterPaths(optionsHeaderImage, optionsFooterImage) {
    if (optionsHeaderImage && fs.existsSync(optionsHeaderImage)) {
        return { headerPath: optionsHeaderImage, footerPath: optionsFooterImage || null };
    }
    try {
        const settings = await Settings.findOne().lean();
        const uploadsBase = path.join(__dirname, '..');

        let headerPath = null;
        let footerPath = null;

        // Settings may store relative paths like /uploads/email-templates/filename.jpg
        if (settings?.emailTemplateHeader) {
            const rel = settings.emailTemplateHeader.replace(/^\//, '');
            const candidate = path.join(uploadsBase, rel);
            if (fs.existsSync(candidate)) headerPath = candidate;
        }
        if (settings?.emailTemplateFooter) {
            const rel = settings.emailTemplateFooter.replace(/^\//, '');
            const candidate = path.join(uploadsBase, rel);
            if (fs.existsSync(candidate)) footerPath = candidate;
        }

        // Fallback: scan uploads/email-templates for any jpeg/jpg/png files
        if (!headerPath || !footerPath) {
            const emailTemplatesDir = path.join(uploadsBase, 'uploads', 'email-templates');
            if (fs.existsSync(emailTemplatesDir)) {
                const files = fs.readdirSync(emailTemplatesDir)
                    .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
                    .sort();
                if (!headerPath && files.length > 0) {
                    headerPath = path.join(emailTemplatesDir, files[0]);
                }
                if (!footerPath && files.length > 1) {
                    footerPath = path.join(emailTemplatesDir, files[files.length - 1]);
                }
            }
        }

        return { headerPath, footerPath };
    } catch (e) {
        return { headerPath: null, footerPath: null };
    }
}

const GREEN = '#23471d';
const GREEN_DEEP = '#1a3a14';
const BLUE_NAVY = '#1e3a8a';
const BLUE_LIGHT = '#eff6ff';
const ORANGE = '#d26019';
const GRAY = '#6b7280';
const LGRAY = '#f3f4f6';
const DARK = '#111827';
const WHITE = '#ffffff';

class PDFGenerator {
    _headerImg(doc, customPath, isReceipt = false) {
        const headerPath = customPath || null;
        const topPadding = 10;
        const sidePadding = isReceipt ? 0 : 40;
        if (headerPath && fs.existsSync(headerPath)) {
            const imgW = doc.page.width - (sidePadding * 2);
            try {
                const img = doc.openImage(headerPath);
                const scale = imgW / img.width;
                const imgH = img.height * scale;
                doc.image(img, sidePadding, topPadding, { width: imgW });
                doc.y = topPadding + imgH + 10;
            } catch (e) {
                doc.image(headerPath, sidePadding, topPadding, { width: imgW });
                doc.y = topPadding + 110 + 10;
            }
        } else {
            doc.rect(0, 0, doc.page.width, 80).fill(GREEN);
            doc.fillColor(WHITE).fontSize(18).font('Helvetica-Bold')
                .text('9th International Health & Wellness Expo 2026', 40, 28, { width: doc.page.width - 80, align: 'center' });
            doc.y = 90;
        }
    }

    _footerImg(doc, customPath) {
        const pageH = doc.page.height;
        const pageW = doc.page.width;
        const footerPath = customPath || null;
        if (footerPath && fs.existsSync(footerPath)) {
            const fH = 70;
            doc.image(footerPath, 0, pageH - fH, { width: pageW });
        } else {
            doc.rect(0, pageH - 40, pageW, 40).fill(GREEN);
            doc.fillColor(WHITE).fontSize(8).font('Helvetica')
                .text('© 2026 IHWE | Namo Gange Wellness Pvt. Ltd.', 0, pageH - 24, { width: pageW, align: 'center' });
        }
    }

    _line(doc, x1, y, x2, color = '#e5e7eb', w = 0.5) {
        doc.moveTo(x1, y).lineTo(x2, y).lineWidth(w).stroke(color);
    }

    _label(doc, text, x, y, w) {
        doc.fillColor(GRAY).fontSize(7).font('Helvetica-Bold')
            .text(text.toUpperCase(), x, y, { width: w, characterSpacing: 0.3 });
    }

    _value(doc, text, x, y, w, opts = {}) {
        doc.fillColor(opts.color || DARK).fontSize(opts.size || 9).font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
            .text(text || 'N/A', x, y, { width: w, ...opts });
    }

    _tableRow(doc, cols, y, bg) {
        const pageW = doc.page.width;
        if (bg) doc.rect(40, y, pageW - 80, 18).fill(bg);
        let x = 40;
        cols.forEach(({ text, w, align, bold, color }) => {
            doc.fillColor(color || DARK).fontSize(8).font(bold ? 'Helvetica-Bold' : 'Helvetica')
                .text(text || '', x + 4, y + 4, { width: w - 8, align: align || 'left' });
            x += w;
        });
        return y + 18;
    }
    _measureRowHeight(doc, cols, minHeight = 18) {
        let maxHeight = minHeight;
        cols.forEach(({ text, w, bold }) => {
            doc.fontSize(8).font(bold ? 'Helvetica-Bold' : 'Helvetica');
            const h = doc.heightOfString(String(text ?? ''), { width: w - 8 });
            maxHeight = Math.max(maxHeight, h + 8);
        });
        return maxHeight;
    }
    _wrappedTableRow(doc, cols, y, bg) {
        const pageW = doc.page.width;
        const rowHeight = this._measureRowHeight(doc, cols);
        if (bg) doc.rect(40, y, pageW - 80, rowHeight).fill(bg);
        let x = 40;
        cols.forEach(({ text, w, align, bold, color }) => {
            doc.fillColor(color || DARK).fontSize(8).font(bold ? 'Helvetica-Bold' : 'Helvetica')
                .text(text || '', x + 4, y + 4, { width: w - 8, align: align || 'left' });
            x += w;
        });
        return y + rowHeight;
    }
    async generateRegistrationForm(registration, options = {}) {
        return new Promise(async (resolve, reject) => {
            try {
                // Resolve header/footer images dynamically
                const { headerPath, footerPath } = await resolveHeaderFooterPaths(
                    options.headerImage,
                    options.footerImage
                );

                const doc = new PDFDocument({ margin: 0, size: 'A4' });
                const filePath = path.join(TEMP_DIR, `registration_${registration._id}.pdf`);
                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                const pageW = doc.page.width;
                const p = registration.participation || {};
                const c1 = registration.contact1 || {};
                const cur = p.currency === 'USD' ? 'USD ' : 'INR ';
                const fmt = (n) => `${cur}${Number(n || 0).toLocaleString('en-IN')}`;

                // ── Header image ──
                this._headerImg(doc, headerPath);
                let y = doc.y;

                // ── Document title strip ──
                doc.rect(40, y, pageW - 80, 22).fill(GREEN);
                doc.fillColor(WHITE).fontSize(11).font('Helvetica-Bold')
                    .text('EXHIBITOR REGISTRATION', 40, y + 6, { width: pageW - 80, align: 'center' });
                y += 30;

                // ── Meta row ──
                doc.fillColor(GRAY).fontSize(8).font('Helvetica')
                    .text(`Reg ID: ${registration.registrationId || 'N/A'}`, 40, y)
                    .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 40, y, { width: pageW - 80, align: 'right' });
                y += 16;
                this._line(doc, 40, y, pageW - 40);
                y += 8;

                // ── Two-column: IHWE details | Client details ──
                const colW = (pageW - 100) / 2;
                const lx = 40, rx = 60 + colW;

                const Settings = require('../models/Settings');
                const settings = await Settings.findOne();

                // Left box - IHWE / FROM
                doc.rect(lx, y, colW, 125).lineWidth(0.5).stroke('#e5e7eb');
                this._label(doc, 'From', lx + 8, y + 8, colW - 16);
                doc.fillColor(GREEN).fontSize(10).font('Helvetica-Bold')
                    .text(settings?.companyName || 'Namo Gange Wellness Pvt. Ltd.', lx + 8, y + 20, { width: colW - 16 });
                doc.fillColor(GRAY).fontSize(8).font('Helvetica')
                    .text(settings?.companyAddress || '12/29, Site-II, Loni Road, Industrial Area, Mohan Nagar, Ghaziabad, India', lx + 8, y + 36, { width: colW - 16 });

                let currentLeftY = Math.max(doc.y + 6, y + 72);

                doc.text(`GST: ${settings?.companyGst || 'N/A'}`, lx + 8, currentLeftY, { width: colW - 16 });
                doc.text(`CIN: ${settings?.companyCin || 'N/A'}`, lx + 8, currentLeftY + 12, { width: colW - 16 });
                doc.text('info@namogangewellness.com  |  www.ihwe.in', lx + 8, currentLeftY + 24, { width: colW - 16 });

                // Right box - Client / TO
                doc.rect(rx, y, colW, 125).lineWidth(0.5).stroke('#e5e7eb');
                this._label(doc, 'To (Exhibitor)', rx + 8, y + 8, colW - 16);
                doc.fillColor(ORANGE).fontSize(10).font('Helvetica-Bold')
                    .text(registration.exhibitorName || 'N/A', rx + 8, y + 20, { width: colW - 16 });
                doc.fillColor(GRAY).fontSize(8).font('Helvetica')
                    .text(registration.typeOfBusiness || '', rx + 8, y + 34, { width: colW - 16 })
                    .text([registration.address, registration.city, registration.state].filter(Boolean).join(', '), rx + 8, y + 46, { width: colW - 16 })
                    .text(`${registration.country || ''} ${registration.pincode ? '– ' + registration.pincode : ''}`, rx + 8, y + 58, { width: colW - 16 })
                    .text(c1.mobile || '', rx + 8, y + 70, { width: colW - 16 })
                    .text(c1.email || '', rx + 8, y + 82, { width: colW - 16 });

                y += 125;
                const infoW = (pageW - 80) / 6;
                const infos = [
                    { label: 'Stall No.', value: p.stallFor || 'N/A' },
                    { label: 'Stall Type', value: p.stallType || 'N/A' },
                    { label: 'Scheme', value: p.stallScheme || 'N/A' },
                    { label: 'Dimension', value: p.dimension || 'N/A' },
                    { label: 'Stall Size', value: p.stallSize ? `${p.stallSize} SQM` : 'N/A' },
                    { label: 'Event', value: registration.eventId?.name || '9IHWE 2026' },
                ];
                infos.forEach((info, i) => {
                    const ix = 40 + i * infoW;
                    doc.rect(ix, y, infoW - 4, 36).fill(LGRAY);
                    this._label(doc, info.label, ix + 6, y + 6, infoW - 12);
                    doc.fillColor(GREEN).fontSize(8).font('Helvetica-Bold')
                        .text(info.value, ix + 6, y + 18, { width: infoW - 12 });
                });
                y += 44;

                // ── Items table ──
                const tW = pageW - 80;
                const cols = [
                    { label: 'Description', w: tW * 0.40 },
                    { label: 'Dimensions', w: tW * 0.15 },
                    { label: 'Scheme', w: tW * 0.15 },
                    { label: 'Rate/SQM', w: tW * 0.15, align: 'right' },
                    { label: 'Amount', w: tW * 0.15, align: 'right' },
                ];

                // Table header
                doc.rect(40, y, tW, 18).fill(DARK);
                let tx = 40;
                cols.forEach(col => {
                    doc.fillColor(WHITE).fontSize(8).font('Helvetica-Bold')
                        .text(col.label, tx + 4, y + 5, { width: col.w - 8, align: col.align || 'left' });
                    tx += col.w;
                });
                y += 18;
                y = this._tableRow(doc, [
                    { text: `${p.stallType || 'Shell Space'} – Stall ${p.stallFor || 'N/A'}`, w: tW * 0.40 },
                    { text: p.dimension || 'N/A', w: tW * 0.15 },
                    { text: p.stallScheme || 'N/A', w: tW * 0.15 },
                    { text: fmt(p.rate), w: tW * 0.15, align: 'right' },
                    { text: fmt(p.amount), w: tW * 0.15, align: 'right' },
                ], y, '#f9fafb');
                this._line(doc, 40, y, 40 + tW, '#e5e7eb');
                y += 4;

                // ── Summary box (right-aligned) ──
                const sumX = 40 + tW * 0.55;
                const sumW = tW * 0.45;
                const fb = registration.financeBreakdown || {};
                const subtotalVal = fb.subtotal || p.amount || 0;
                const gstVal = fb.gstAmount || Math.round(subtotalVal * 0.18);
                const tdsVal = fb.tdsAmount || Math.round(subtotalVal * (registration.chosenTdsPercent || 0) / 100);
                const netVal = fb.netPayable || (subtotalVal + gstVal - tdsVal);
                const grossVal = fb.grossAmount || subtotalVal;

                const summaryRows = [
                    { label: 'Gross Amount', value: fmt(grossVal) },
                ];

                if (fb.stallDiscountAmount > 0) {
                    summaryRows.push({ label: `Less: Stall Discount (${fb.stallDiscountPercent || 0}%)`, value: `- ${fmt(fb.stallDiscountAmount)}` });
                }
                const isFullPlan = registration.paymentPlanType === 'full' || fb.isFullPayment === true;
                if (isFullPlan && fb.discountAmount > 0) {
                    summaryRows.push({ label: `Less: Full Payment Discount (${fb.discountPercent || 0}%)`, value: `- ${fmt(fb.discountAmount)}` });
                }

                if (fb.stallDiscountAmount > 0 || (isFullPlan && fb.discountAmount > 0)) {
                    summaryRows.push({ label: 'Subtotal (Taxable Value)', value: fmt(subtotalVal) });
                }

                summaryRows.push({ label: `GST @ ${p.gstPercent || 18}%`, value: `+ ${fmt(gstVal)}` });

                if (tdsVal > 0) {
                    summaryRows.push({ label: `Less: TDS @ ${registration.chosenTdsPercent || 0}%`, value: `- ${fmt(tdsVal)}` });
                }

                summaryRows.forEach(row => {
                    doc.fillColor(GRAY).fontSize(8).font('Helvetica')
                        .text(row.label, sumX, y + 4, { width: sumW * 0.55 })
                        .text(row.value, sumX + sumW * 0.55, y + 4, { width: sumW * 0.45, align: 'right' });
                    y += 16;
                });
                this._line(doc, sumX, y, sumX + sumW, GREEN, 1);
                y += 4;
                doc.rect(sumX, y, sumW, 24).fill(GREEN);
                doc.fillColor(WHITE).fontSize(10).font('Helvetica-Bold')
                    .text('GRAND TOTAL', sumX + 8, y + 7, { width: sumW * 0.5 })
                    .text(fmt(fb.netPayable || netVal), sumX + sumW * 0.5, y + 7, { width: sumW * 0.5 - 8, align: 'right' });
                y += 32;

                // ── Contact & CRM ──
                this._line(doc, 40, y, pageW - 40);
                y += 8;
                const cW = (pageW - 80) / 4;
                [
                    { label: 'Exhibitor Name (Co)', value: registration.exhibitorName || 'N/A' },
                    { label: 'Authorized Person', value: `${c1.title || ''} ${c1.firstName || ''} ${c1.lastName || ''}`.trim() || 'N/A' },
                    { label: 'Exhibitor Mobile No.', value: c1.mobile || 'N/A' },
                    { label: 'Relationship Manager', value: registration.spokenWith || 'N/A' },
                ].forEach((item, i) => {
                    this._label(doc, item.label, 40 + i * cW, y, cW - 8);
                    this._value(doc, item.value, 40 + i * cW, y + 12, cW - 8);
                });
                y += 30;
                const statusColors = { pending: '#f59e0b', approved: '#22c55e', paid: GREEN, 'advance-paid': '#0891b2', confirmed: '#3b82f6', rejected: '#ef4444', 'payment-failed': '#dc2626' };
                doc.rect(40, y, 130, 22).fill(statusColors[registration.status] || GRAY);
                doc.fillColor(WHITE).fontSize(9).font('Helvetica-Bold')
                    .text(`STATUS: ${(registration.status || 'PENDING').toUpperCase()}`, 40, y + 7, { width: 130, align: 'center' });

                // ── Signature & Stamp ──
                let sigY = y + 40;
                const sigX = 40;

                const sigPath = settings?.authorizedSignature ? path.resolve(__dirname, '..', settings.authorizedSignature.replace(/^\//, '')) : null;
                const stampPath = settings?.companyStamp ? path.resolve(__dirname, '..', settings.companyStamp.replace(/^\//, '')) : null;

                if (sigPath && fs.existsSync(sigPath)) {
                    doc.image(sigPath, sigX + 10, sigY + 5, { height: 40 });
                }
                if (stampPath && fs.existsSync(stampPath)) {
                    doc.image(stampPath, sigX + 130, sigY, { height: 50 });
                }
                sigY += 50;
                this._line(doc, sigX, sigY, sigX + 220, GREEN);
                doc.fillColor(DARK).fontSize(8).font('Helvetica-Bold').text('Authorized Signatory', sigX, sigY + 5, { width: 220, align: 'center' });

                // ── QR Code ──
                const qrX = pageW - 120, qrY = y + 35;
                try {
                    const siteUrl = (process.env.SITE_URL || 'http://localhost:8080').replace(/\/$/, '');
                    const loginUrl = `${siteUrl}/exhibitor-login`;
                    const qrBuffer = await QRCode.toBuffer(loginUrl, { margin: 1, width: 80 });
                    doc.image(qrBuffer, qrX, qrY, { width: 80 });
                    doc.fillColor(GRAY).fontSize(7).text('Scan for Login', qrX, qrY + 85, { width: 80, align: 'center' });
                } catch (qrErr) { console.error('QR Generate Error:', qrErr); }

                doc.end();
                stream.on('finish', () => {
                    const publicUrl = getTempPdfUrl(filePath);
                    resolve({ filePath, cloudUrl: publicUrl });
                });
                stream.on('error', reject);
            } catch (err) { reject(err); }
        });
    }

    // ─── Payment Receipt ──────────────────────────────────────────────────────

    async generatePaymentSlip(registration, options = {}) {
        return new Promise(async (resolve, reject) => {
            try {
                const PaymentReceiptSettings = require('../models/PaymentReceiptSettings');
                const Event = require('../models/Event');
                const mongoose = require('mongoose');

                const doc = new PDFDocument({ margin: 0, size: 'A4' });

                const paymentIndex = options.paymentIndex !== undefined ? options.paymentIndex : -1;
                const suffix = paymentIndex >= 0 ? `_P${paymentIndex + 1}` : '';
                const safeReceiptBase = String(registration.registrationId || registration._id || 'receipt').replace(/[\\/:*?"<>|]+/g, '_');
                const fileName = `receipt_${safeReceiptBase}${suffix}_${Date.now()}.pdf`;
                const filePath = path.join(TEMP_DIR, fileName);
                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                const pageW = doc.page.width;
                const pageH = doc.page.height;
                const p = registration.participation || {};
                const c1 = registration.contact1 || {};
                const paymentHistoryEntry = paymentIndex >= 0 && registration.paymentHistory?.[paymentIndex] ? registration.paymentHistory[paymentIndex] : null;
                const m = paymentHistoryEntry || registration.manualPaymentDetails || {};
                const isUSD = p.currency === 'USD';

                // Using Rs. instead of ₹ to avoid Helvetica rendering issues (renders as ¹)
                const curStr = isUSD ? 'USD ' : 'Rs. ';
                const fmt = (n) => `${curStr}${Math.round(Number(n || 0)).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

                const Settings = require('../models/Settings');
                const settings = await Settings.findOne();

                let receiptSettings = await PaymentReceiptSettings.findOne();
                if (!receiptSettings) receiptSettings = new PaymentReceiptSettings({});

                const Invoice = require('../models/Invoice');
                const invoice = await Invoice.findOne({
                    $or: [
                        { companyId: registration.clientId || (registration._id ? registration._id.toString() : '') },
                        { company_name: registration.exhibitorName }
                    ]
                }).sort({ added: -1 }).lean();

                // Generate Receipt Number (unchanged logic — only the fallback prefix is now configurable)
                const Counter = require('../models/visitor/CounterModel');
                const year = new Date().getFullYear();
                let rNo = registration.customReceiptNo || registration.receiptNo;
                if (!rNo) {
                    const counter = await Counter.findOneAndUpdate({ type: `receipt-ngw-${year}` }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' });
                    rNo = `${receiptSettings.receiptNumberPrefix || 'PR/'}${String(year).slice(-2)}-${String(year + 1).slice(-2)}/${String(counter.seq).padStart(3, '0')}`;
                    try {
                        if (registration._id && typeof registration.constructor.findByIdAndUpdate === 'function') {
                            await registration.constructor.findByIdAndUpdate(registration._id, { customReceiptNo: rNo });
                        }
                    } catch (e) { }
                }

                // Event info — registration.eventId usually isn't populated at the call sites
                // that hit this function, so resolve it defensively.
                let eventDoc = null;
                if (registration.eventId && typeof registration.eventId === 'object' && registration.eventId.name) {
                    eventDoc = registration.eventId;
                } else if (registration.eventId && mongoose.Types.ObjectId.isValid(registration.eventId)) {
                    try { eventDoc = await Event.findById(registration.eventId).lean(); } catch (e) { }
                }

                // ---- Colors & band sizes (admin-configurable via PaymentReceiptSettings) ----
                const clamp = (val, min, max, fallback) => {
                    const n = Number(val);
                    if (!Number.isFinite(n)) return fallback;
                    return Math.min(max, Math.max(min, n));
                };
                const ORGANISER = receiptSettings.organiserBandColor || '#0b3974';
                const EXHIBITOR = receiptSettings.exhibitorBandColor || '#1a7a3c';
                const ACCENT = receiptSettings.accentColor || '#0b3974';
                const NOTE_COLOR = receiptSettings.noteColor || '#c2410c';
                const BORDER_COLOR = '#d1d5db';
                const TEXT_DARK = '#0f172a';
                const TEXT_MUTED = '#475569';

                const headerH = clamp(receiptSettings.headerBandHeight, 70, 140, 95);
                const eventH = clamp(receiptSettings.eventBandHeight, 60, 120, 85);
                const infoH = clamp(receiptSettings.infoBandHeight, 80, 160, 115);
                const footerH = clamp(receiptSettings.footerBandHeight, 60, 110, 85);
                const mx = clamp(receiptSettings.pageMarginX, 15, 50, 30);
                const sectionGap = clamp(receiptSettings.sectionGap, 0, 30, 8);
                const mw = pageW - mx * 2;

                // ---- Icon helpers ----
                // Reused as-is from the previous layout (already proven to render correctly).
                const drawSvgIcon = (cx, cy, pathData, scale = 0.5, color = '#fff') => {
                    doc.save();
                    doc.translate(cx - (12 * scale), cy - (12 * scale));
                    doc.scale(scale);
                    doc.path(pathData).fill(color);
                    doc.restore();
                };
                const ic_doc = 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z';
                const ic_cal = 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z';
                const ic_user = 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z';
                const ic_rupee = 'M13.66,7c-0.19,1.13-0.89,2-2.14,2.54L15.34,16H12.9l-3.33-5.83H9.4V16H7.8v-5.83H6.06V8.65h1.74V7H6.06V5.48h3.33v1.51h1.15c0.55,0,0.92-0.27,0.92-0.82H6.06V4.65h7.6v1.51H10.4C10.74,6.47,11.2,6.6,11.72,6.6c0.81,0,1.38-0.34,1.52-1.13h2.15v1.52H13.66z';
                const ic_wallet = 'M21 7.28V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-2.28c.59-.35 1-.98 1-1.72V9c0-.74-.41-1.37-1-1.72zM20 9v6h-2.5V9H20zM7 9h8v2H7V9zm0 4h5v2H7v-2z';
                const ic_business = 'M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z';
                const ic_bell = 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z';
                const drawMailIcon = (cx, cy, r, color) => {
                    doc.save();
                    doc.rect(cx - r, cy - r * 0.7, r * 2, r * 1.4).lineWidth(0.8).stroke(color);
                    doc.moveTo(cx - r, cy - r * 0.7).lineTo(cx, cy + r * 0.2).lineTo(cx + r, cy - r * 0.7).lineWidth(0.8).stroke(color);
                    doc.restore();
                };
                const drawGlobeIcon = (cx, cy, r, color) => {
                    doc.save();
                    doc.circle(cx, cy, r).lineWidth(0.8).stroke(color);
                    doc.ellipse(cx, cy, r * 0.45, r).lineWidth(0.6).stroke(color);
                    doc.moveTo(cx - r, cy).lineTo(cx + r, cy).lineWidth(0.6).stroke(color);
                    doc.restore();
                };
                const drawPhoneIcon = (cx, cy, r, color) => {
                    doc.save();
                    doc.roundedRect(cx - r * 0.7, cy - r, r * 1.4, r * 2, r * 0.3).lineWidth(0.8).stroke(color);
                    doc.moveTo(cx - r * 0.2, cy - r * 0.6).lineTo(cx + r * 0.2, cy - r * 0.6).lineWidth(0.5).stroke(color);
                    doc.circle(cx, cy + r * 0.6, r * 0.15).fillAndStroke(color, color);
                    doc.restore();
                };
                const drawPinIcon = (cx, cy, r, color) => {
                    doc.save();
                    doc.circle(cx, cy - r * 0.2, r * 0.55).lineWidth(0.8).stroke(color);
                    doc.moveTo(cx, cy + r * 0.3).lineTo(cx, cy + r).lineWidth(0.8).stroke(color);
                    doc.restore();
                };
                const drawCalendarIcon = (cx, cy, r, color) => {
                    doc.save();
                    doc.roundedRect(cx - r * 0.8, cy - r * 0.6, r * 1.6, r * 1.6, r * 0.2).lineWidth(0.8).stroke(color);
                    doc.moveTo(cx - r * 0.8, cy - r * 0.1).lineTo(cx + r * 0.8, cy - r * 0.1).lineWidth(0.8).stroke(color);
                    doc.moveTo(cx - r * 0.4, cy - r * 0.9).lineTo(cx - r * 0.4, cy - r * 0.4).lineWidth(0.8).stroke(color);
                    doc.moveTo(cx + r * 0.4, cy - r * 0.9).lineTo(cx + r * 0.4, cy - r * 0.4).lineWidth(0.8).stroke(color);
                    doc.restore();
                };
                const drawStarIcon = (cx, cy, r, color) => {
                    doc.save();
                    const points = 5;
                    const innerRadius = r * 0.4;
                    const outerRadius = r * 0.9;
                    let path = '';
                    for (let i = 0; i < points * 2; i++) {
                        const radius = i % 2 === 0 ? outerRadius : innerRadius;
                        const angle = (i * Math.PI) / points - Math.PI / 2;
                        const x = cx + radius * Math.cos(angle);
                        const y = cy + radius * Math.sin(angle);
                        path += (i === 0 ? 'M' : 'L') + x + ',' + y;
                    }
                    doc.path(path + ' Z').lineWidth(0.8).stroke(color);
                    doc.restore();
                };

                let y = 15;
                let headerBannerDrawn = false;
                let headerConsumedH = headerH;
                const MAX_HEADER_BANNER_H = 180;
                if (receiptSettings.headerLogoImage) {
                    try {
                        const bannerPath = path.resolve(__dirname, '..', String(receiptSettings.headerLogoImage).replace(/^\//, ''));
                        if (fs.existsSync(bannerPath)) {
                            const img = doc.openImage(bannerPath);
                            const widthScale = mw / img.width;
                            const naturalH = img.height * widthScale;
                            if (naturalH <= MAX_HEADER_BANNER_H) {
                                doc.image(img, mx, y, { width: mw });
                                headerConsumedH = naturalH;
                            } else {
                                doc.image(img, mx, y, { fit: [mw, MAX_HEADER_BANNER_H] });
                                headerConsumedH = MAX_HEADER_BANNER_H;
                            }
                            headerBannerDrawn = true;
                        }
                    } catch (e) { }
                }

                if (!headerBannerDrawn) {
                    doc.rect(0, y, 6, headerH).fill(ACCENT);
                    const headerColW = (mw - 6) / 3;
                    const col1X = mx + 14;
                    const col2X = mx + headerColW + 18;
                    const col3X = mx + headerColW * 2 + 24;

                    let logoDrawn = false;
                    if (settings?.logo) {
                        try {
                            const logoPath = path.resolve(__dirname, '..', String(settings.logo).replace(/^\//, ''));
                            if (fs.existsSync(logoPath)) {
                                doc.image(logoPath, col1X, y + 12, { fit: [headerColW - 20, headerH - 24] });
                                logoDrawn = true;
                            }
                        } catch (e) { }
                    }
                    if (!logoDrawn) {
                        doc.fillColor(ACCENT).fontSize(15).font('Helvetica-Bold').text(settings?.companyName || 'Namo Gange Wellness Pvt. Ltd.', col1X, y + headerH / 2 - 14, { width: headerColW - 20 });
                    }

                    let midY = y + 12;
                    drawMailIcon(col2X + 6, midY + 6, 6, ACCENT);
                    doc.fillColor(TEXT_DARK).fontSize(8).font('Helvetica').text(settings?.contactEmail || '-', col2X + 18, midY + 2, { width: headerColW - 30 });
                    midY += 18;
                    drawGlobeIcon(col2X + 6, midY + 6, 6, ACCENT);
                    doc.fillColor(TEXT_DARK).fontSize(8).font('Helvetica').text(settings?.contactWebsite || '-', col2X + 18, midY + 2, { width: headerColW - 30 });
                    midY += 22;
                    doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica-Bold').text(`GSTIN - ${settings?.companyGst || 'N/A'}`, col2X, midY, { width: headerColW - 10 });
                    midY += 12;
                    doc.font('Helvetica').text(`CIN No. ${settings?.companyCin || 'N/A'}`, col2X, midY, { width: headerColW - 10 });

                    doc.fillColor(TEXT_MUTED).fontSize(8).font('Helvetica-Bold').text(receiptSettings.headOfficeLabel || 'Head Office:', col3X, y + 12);
                    doc.fillColor(TEXT_DARK).fontSize(8.5).font('Helvetica-Bold').text(settings?.companyName || '-', col3X, y + 25, { width: mw - (col3X - mx) - 6 });
                    doc.font('Helvetica').fontSize(7.5).text(settings?.companyAddress || '-', col3X, y + 39, { width: mw - (col3X - mx) - 6 });

                    doc.moveTo(mx + headerColW, y + 8).lineTo(mx + headerColW, y + headerH - 8).lineWidth(0.5).stroke(BORDER_COLOR);
                    doc.moveTo(mx + headerColW * 2 + 6, y + 8).lineTo(mx + headerColW * 2 + 6, y + headerH - 8).lineWidth(0.5).stroke(BORDER_COLOR);
                    doc.moveTo(mx, y + headerH).lineTo(mx + mw, y + headerH).lineWidth(1).stroke(BORDER_COLOR);
                }

                y += headerConsumedH + sectionGap;

                // ============ 2. EVENT BAND ============
                const evColW = mw * 0.32;
                const evMidW = mw * 0.34;
                const evRightW = mw - evColW - evMidW;

                let eventLogoDrawn = false;
                if (receiptSettings.eventLogoImage) {
                    try {
                        const evLogoPath = path.resolve(__dirname, '..', String(receiptSettings.eventLogoImage).replace(/^\//, ''));
                        if (fs.existsSync(evLogoPath)) {
                            doc.image(evLogoPath, mx, y, { fit: [evColW - 10, eventH] });
                            eventLogoDrawn = true;
                        }
                    } catch (e) { }
                }
                if (!eventLogoDrawn) {
                    doc.fillColor(ACCENT).fontSize(12).font('Helvetica-Bold').text(eventDoc?.name || 'IHWE 2026', mx, y + eventH / 2 - 14, { width: evColW - 10 });
                }

                const evMidX = mx + evColW;
                let evMidY = y + 5;
                const eventName = eventDoc?.name || 'IHWE 2026';
                drawStarIcon(evMidX + 8, evMidY + 8, 8, ACCENT);
                doc.fillColor(TEXT_MUTED).fontSize(7).font('Helvetica-Bold').text('EVENT NAME:', evMidX + 22, evMidY);
                doc.fillColor(TEXT_DARK).fontSize(7).font('Helvetica').text(eventName.toUpperCase(), evMidX + 22, evMidY + 10, { width: evMidW - 25 });
                evMidY += 28;

                const fmtEvDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
                const dateStr = eventDoc?.startDate ? `${fmtEvDate(eventDoc.startDate)}${eventDoc.endDate ? ' - ' + fmtEvDate(eventDoc.endDate) : ''}` : 'TBA';
                drawCalendarIcon(evMidX + 8, evMidY + 8, 8, ACCENT);
                doc.fillColor(TEXT_MUTED).fontSize(7).font('Helvetica-Bold').text('EVENT DATE:', evMidX + 22, evMidY);
                doc.fillColor(TEXT_DARK).fontSize(7).font('Helvetica').text(dateStr, evMidX + 22, evMidY + 10, { width: evMidW - 25 });
                evMidY += 28;

                drawPinIcon(evMidX + 8, evMidY + 8, 8, ACCENT);
                doc.fillColor(TEXT_MUTED).fontSize(7).font('Helvetica-Bold').text('EVENT VENUE:', evMidX + 22, evMidY);
                doc.fillColor(TEXT_DARK).fontSize(7).font('Helvetica').text((eventDoc?.location || 'Pragati Maidan, New Delhi, India').toUpperCase(), evMidX + 22, evMidY + 10, { width: evMidW - 25 });

                const boxX = mx + evColW + evMidW;
                const boxW = evRightW;
                doc.roundedRect(boxX, y, boxW, eventH, 6).lineWidth(1).stroke(BORDER_COLOR);
                doc.fillColor(ACCENT).fontSize(10).font('Helvetica-Bold').text(receiptSettings.receiptTitleLabel || 'PAYMENT RECEIPT', boxX, y + 8, { width: boxW, align: 'center' });
                doc.moveTo(boxX, y + 22).lineTo(boxX + boxW, y + 22).lineWidth(1).stroke(BORDER_COLOR);
                const formattedDate = new Date(m.paidAt || registration.updatedAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                const infoRows = [
                    ['Receipt No.', rNo],
                    ['Reg ID', registration.registrationId || registration._id?.toString().slice(-8) || 'N/A'],
                    ['Date', formattedDate],
                ];
                let boxY = y + 30;
                infoRows.forEach(([l, v]) => {
                    doc.fillColor(TEXT_MUTED).fontSize(7).font('Helvetica-Bold').text(l, boxX + 10, boxY, { width: 55 });
                    doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica').text(':  ' + (v || 'N/A'), boxX + 65, boxY, { width: boxW - 75 });
                    boxY += 16;
                });

                y += eventH + sectionGap;

                // ============ 3. FROM / TO BAND ============
                const halfW = (mw - 12) / 2;
                const boxTop = y + sectionGap * 2;
                const rowW = halfW - 24;

                let fromAddr = settings?.companyAddress || 'N/A';
                if (settings?.addresses && settings.addresses.length > 0) {
                    const addr = settings.addresses[0];
                    let parts = [];
                    if (addr.street) parts.push(addr.street);
                    let cityPin = '';
                    if (addr.city && addr.zipCode) cityPin = `${addr.city} - ${addr.zipCode}`;
                    else if (addr.city) cityPin = addr.city;
                    else if (addr.zipCode) cityPin = addr.zipCode;
                    if (cityPin) parts.push(cityPin);
                    if (addr.state) parts.push(addr.state);
                    if (addr.country) parts.push(addr.country);
                    if (parts.length > 0) fromAddr = parts.join(', ');
                }
                let exAddrParts = [];
                if (registration.address) exAddrParts.push(registration.address);
                if (registration.city && registration.pincode) exAddrParts.push(`${registration.city} - ${registration.pincode}`);
                else if (registration.city) exAddrParts.push(registration.city);
                else if (registration.pincode) exAddrParts.push(registration.pincode);
                if (registration.state) exAddrParts.push(registration.state);
                exAddrParts.push(registration.country || 'India');
                const exAddr = exAddrParts.join(', ') || 'N/A';
                doc.fontSize(7.5).font('Helvetica');
                const fromAddrH = doc.heightOfString(fromAddr, { width: rowW });
                const toAddrH = doc.heightOfString(exAddr, { width: rowW });
                const fromInnerH = 24 + 12 + fromAddrH + 10 + 8 + 13 + 13 + 13 + 13 + 10;
                const toInnerH = 24 + 12 + toAddrH + 10 + 8 + 13 + 13 + 13 + 13 + 10;
                const boxH = Math.max(infoH - 16, fromInnerH, toInnerH);

                // FROM (Organiser)
                doc.rect(mx, boxTop, halfW, 18).fill(ORGANISER);
                drawSvgIcon(mx + 14, boxTop + 9, ic_business, 0.4, '#fff');
                doc.fillColor('#fff').fontSize(8.5).font('Helvetica-Bold').text(receiptSettings.fromLabel || 'FROM (ORGANISER)', mx, boxTop + 5, { width: halfW, align: 'center' });
                doc.rect(mx, boxTop + 18, halfW, boxH - 18).lineWidth(1).stroke(BORDER_COLOR);
                let fy = boxTop + 24;
                doc.fillColor(TEXT_DARK).fontSize(9.5).font('Helvetica-Bold').text(settings?.companyName || 'N/A', mx + 12, fy, { width: rowW });
                fy += 12;
                doc.fillColor(TEXT_MUTED).fontSize(7.5).font('Helvetica').text(fromAddr, mx + 12, fy, { width: rowW });
                fy += fromAddrH + 10;
                doc.moveTo(mx + 12, fy).lineTo(mx + halfW - 12, fy).dash(2, { space: 2 }).lineWidth(0.5).stroke(BORDER_COLOR);
                doc.undash();
                fy += 8;

                const orgContactStr = settings?.contactPerson || 'Authorized Signatory';
                const orgDesignation = settings?.contactDesignation ? ` (${settings.contactDesignation})` : '';
                const orgDisplayName = orgContactStr + orgDesignation;

                drawSvgIcon(mx + 14, fy + 4, ic_user, 0.4, TEXT_DARK);
                doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica-Bold').text(orgDisplayName, mx + 26, fy + 2, { width: rowW - 14 });
                fy += 13;

                drawPhoneIcon(mx + 16, fy + 6, 5, TEXT_DARK);
                doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica').text(settings?.contactPhone || '-', mx + 26, fy + 2, { width: rowW - 14 });
                fy += 13;

                drawMailIcon(mx + 16, fy + 6, 5, TEXT_DARK);
                doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica').text(settings?.contactEmail || '-', mx + 26, fy + 2, { width: rowW - 14 });
                fy += 13;

                drawSvgIcon(mx + 14, fy + 4, ic_doc, 0.4, TEXT_DARK);
                doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica-Bold').text(`GSTIN: ${settings?.companyGst || 'N/A'}`, mx + 26, fy + 2, { width: rowW - 14 });

                // TO (Exhibitor)
                const rX = mx + halfW + 12;
                doc.rect(rX, boxTop, halfW, 18).fill(EXHIBITOR);
                drawSvgIcon(rX + 14, boxTop + 9, ic_user, 0.4, '#fff');
                doc.fillColor('#fff').fontSize(8.5).font('Helvetica-Bold').text(receiptSettings.toLabel || 'TO (EXHIBITOR)', rX, boxTop + 5, { width: halfW, align: 'center' });
                doc.rect(rX, boxTop + 18, halfW, boxH - 18).lineWidth(1).stroke(BORDER_COLOR);
                let ty = boxTop + 24;
                doc.fillColor(TEXT_DARK).fontSize(9.5).font('Helvetica-Bold').text(registration.exhibitorName || 'N/A', rX + 12, ty, { width: rowW });
                ty += 12;
                doc.fillColor(TEXT_MUTED).fontSize(7.5).font('Helvetica').text(exAddr, rX + 12, ty, { width: rowW });
                ty += toAddrH + 10;
                doc.moveTo(rX + 12, ty).lineTo(rX + halfW - 12, ty).dash(2, { space: 2 }).lineWidth(0.5).stroke(BORDER_COLOR);
                doc.undash();
                ty += 8;

                const namePart = c1.name || `${c1.title ? c1.title + ' ' : ''}${c1.firstName || ''} ${c1.lastName || ''}`.trim();
                const exhContactStr = namePart ? namePart : '';
                const exhDesignation = c1?.designation ? ` (${c1.designation})` : '';
                const exhDisplayName = exhContactStr ? exhContactStr + exhDesignation : '';

                if (exhDisplayName) {
                    drawSvgIcon(rX + 14, ty + 4, ic_user, 0.4, TEXT_DARK);
                    doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica-Bold').text(exhDisplayName, rX + 26, ty + 2, { width: rowW - 14 });
                    ty += 13;
                }

                drawPhoneIcon(rX + 16, ty + 6, 5, TEXT_DARK);
                doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica').text(c1.mobile || c1.whatsapp || '-', rX + 26, ty + 2, { width: rowW - 14 });
                ty += 13;

                drawMailIcon(rX + 16, ty + 6, 5, TEXT_DARK);
                doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica').text(c1.email || '-', rX + 26, ty + 2, { width: rowW - 14 });
                ty += 13;

                drawSvgIcon(rX + 14, ty + 4, ic_doc, 0.4, TEXT_DARK);
                doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica-Bold').text(`GSTIN: ${registration.gstNo || 'N/A'}`, rX + 26, ty + 2, { width: rowW - 14 });

                y = boxTop + boxH + sectionGap;

                // ============ 4. INVOICE DETAILS ============
                const paymentAgainst = registration.customInvoiceNo || registration.referenceInvoice || registration.invoiceNo || p.invoiceNo || invoice?.invoice_no || 'N/A';
                const invoiceType = registration.receiptDocumentType || registration.documentType || p.stallType || (invoice?.invoice_no ? 'Tax Invoice' : (invoice ? 'Proforma Invoice' : 'Payment Receipt'));
                let paymentTypeLabel = 'Advance / Partial';
                if (registration.balanceAmount <= 0) paymentTypeLabel = 'Final Payment';

                const drawDivider = (label) => {
                    doc.fontSize(9).font('Helvetica-Bold');
                    const textW = doc.widthOfString(label) + 10;
                    const halfW = textW / 2;
                    doc.moveTo(mx, y + 6).lineTo(mx + mw / 2 - halfW, y + 6).lineWidth(0.5).stroke(BORDER_COLOR);
                    doc.fillColor(ACCENT).fontSize(9).font('Helvetica-Bold').text(label, mx + mw / 2 - halfW, y, { width: textW, align: 'center' });
                    doc.moveTo(mx + mw / 2 + halfW, y + 6).lineTo(mx + mw, y + 6).lineWidth(0.5).stroke(BORDER_COLOR);
                    y += 18;
                };
                drawDivider(receiptSettings.invoiceDetailsLabel || 'INVOICE DETAILS');

                const invDate = new Date(invoice?.invoice_date || invoice?.createdAt || registration.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                const gridFields = [
                    ['INVOICE NO.', paymentAgainst],
                    ['INVOICE TYPE', invoiceType],
                    ['INVOICE DATE', invDate],
                    ['PAYMENT TYPE', paymentTypeLabel],
                    ['DOC TYPE', 'Payment Receipt'],
                    ['QTY', '1'],
                ];
                const gridColW = mw / gridFields.length;
                doc.fontSize(7.5).font('Helvetica-Bold');
                const gridValueHeight = Math.max(...gridFields.map((f) => doc.heightOfString(String(f[1]), { width: gridColW - 4 })));
                const gridH = 24 + gridValueHeight;
                doc.rect(mx, y - 4, mw, 16).fill(ACCENT);
                doc.rect(mx, y - 4, mw, gridH).lineWidth(0.5).stroke(BORDER_COLOR);
                doc.moveTo(mx, y + 12).lineTo(mx + mw, y + 12).lineWidth(0.5).stroke(BORDER_COLOR);

                gridFields.forEach((f, i) => {
                    const gx = mx + i * gridColW;
                    if (i > 0) {
                        doc.moveTo(gx, y - 4).lineTo(gx, y - 4 + gridH).lineWidth(0.5).stroke(BORDER_COLOR);
                    }
                    doc.fillColor('#fff').fontSize(6.5).font('Helvetica-Bold').text(f[0], gx + 2, y, { width: gridColW - 4, align: 'center' });
                    doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica-Bold').text(String(f[1]), gx + 2, y + 16, { width: gridColW - 4, align: 'center' });
                });
                const gridBottomY = y - 4 + gridH;
                y += gridH + 4;

                // Connector lines through the gap so the grid box and the item table
                // below read as one joined section rather than two separate boxes.
                doc.moveTo(mx, gridBottomY).lineTo(mx, y).lineWidth(0.5).stroke(BORDER_COLOR);
                doc.moveTo(mx + mw, gridBottomY).lineTo(mx + mw, y).lineWidth(0.5).stroke(BORDER_COLOR);

                // Item table (single summary row — this app doesn't carry itemized line items
                // for a payment receipt, only an invoice-level amount, same as before)
                const fb = registration.financeBreakdown || {};
                const invVal = registration.receiptInvoiceAmount || fb.invoiceAmount || fb.totalAmount || p.total || invoice?.finalAmount || fb.netPayable || p.amount || 0;
                const gstPercent = p.gstPercent || 18;
                const taxableValue = fb.subtotal || Math.round(invVal / (1 + gstPercent / 100));
                const gstAmount = fb.gstAmount || Math.max(0, invVal - taxableValue);
                const tdsPercent = fb.tdsPercent || registration.chosenTdsPercent || 0;
                const tdsAmount = fb.tdsAmount || 0;
                const grandTotal = taxableValue + gstAmount - tdsAmount;
                const rateUnitValue = registration.receiptUnitRate || p.rate || taxableValue;
                const tableCols = [
                    { label: 'Description', w: 0.38 },
                    { label: 'Doc Type', w: 0.16 },
                    { label: 'Payment Type', w: 0.16 },
                    { label: 'Rate/Unit', w: 0.15 },
                    { label: 'Amount', w: 0.15 },
                ];
                let tx = mx;
                doc.rect(mx, y, mw, 16).fillAndStroke(ACCENT, BORDER_COLOR);
                tableCols.forEach((c) => {
                    const cw = mw * c.w;
                    doc.fillColor('#fff').fontSize(7).font('Helvetica-Bold').text(c.label.toUpperCase(), tx + 4, y + 4, { width: cw - 8 });
                    tx += cw;
                });
                y += 16;
                tx = mx;
                const rowH = 22;
                doc.rect(mx, y, mw, rowH).lineWidth(0.5).stroke(BORDER_COLOR);
                const rowVals = [
                    `${invoiceType} – ${paymentAgainst}`,
                    'Payment Receipt',
                    paymentTypeLabel,
                    fmt(rateUnitValue),
                    fmt(taxableValue),
                ];
                tableCols.forEach((c, i) => {
                    const cw = mw * c.w;
                    const align = i === 4 ? 'right' : 'left';
                    const cellRightPadding = i === 4 ? 18 : 8;
                    doc.fillColor(TEXT_DARK).fontSize(7.2).font('Helvetica').text(rowVals[i], tx + 4, y + 6, { width: cw - cellRightPadding, align, lineBreak: false });
                    tx += cw;
                });
                y += rowH;

                // Summary rows
                const summaryRows = [
                    ['GROSS AMOUNT', fmt(fb.grossAmount || taxableValue), false],
                    ['TAXABLE VALUE', fmt(taxableValue), false],
                    [`ADD: GST @ ${gstPercent}%`, `+ ${fmt(gstAmount)}`, false],
                    [`LESS: TDS DEDUCTION (${tdsPercent}%)`, `- ${fmt(tdsAmount)}`, false],
                    ['GRAND TOTAL', fmt(grandTotal), true],
                ];
                const sumW = mw * 0.46;
                const sumX = mx + mw - sumW;
                const summaryStartY = y;
                summaryRows.forEach(([l, v, strong], idx) => {
                    if (strong) doc.rect(sumX, y, sumW, 16).fill(ACCENT);
                    doc.fillColor(strong ? '#fff' : TEXT_MUTED).fontSize(6.5).font('Helvetica-Bold').text(l, sumX + 8, y + 5, { width: sumW * 0.56, lineBreak: false });
                    doc.fillColor(strong ? '#fff' : (v.startsWith('-') ? '#dc2626' : TEXT_DARK)).fontSize(7.5).font('Helvetica-Bold').text(v, sumX + sumW * 0.56, y + 4, { width: sumW * 0.42 - 8, align: 'right', lineBreak: false });
                    if (idx < summaryRows.length - 1) {
                        doc.moveTo(mx, y + 16).lineTo(mx + mw, y + 16).lineWidth(0.3).stroke(BORDER_COLOR);
                    }
                    y += 16;
                });
                // Enclose the summary block with side/bottom borders so it reads as one
                // continuous section with the item row above (whose rect provides the top edge).
                doc.rect(mx, summaryStartY, mw, y - summaryStartY).lineWidth(0.5).stroke(BORDER_COLOR);
                y += sectionGap;

                // ============ 5. PAYMENT DETAILS ============
                drawDivider(receiptSettings.paymentDetailsLabel || 'PAYMENT DETAILS');

                const paymentMode = String(m.method || m.paymentMode || registration.paymentMode || 'N/A').toUpperCase();
                const reference = m.transactionId || m.razorpayPaymentId || registration.paymentId || 'N/A';
                const totalPaid = m.amount || registration.amountPaid || 0;
                const paymentStatus = registration.balanceAmount > 0 ? 'Partial Received' : 'Full Received';

                const payStats = [
                    { l: 'PAYMENT MODE', v: paymentMode, icon: ic_wallet },
                    { l: 'TRANSACTION NO.', v: reference, icon: ic_doc },
                    { l: 'PAYMENT DATE', v: formattedDate, icon: ic_cal },
                    { l: 'TOTAL PAID', v: fmt(totalPaid), icon: ic_wallet },
                    { l: 'PAYMENT STATUS', v: paymentStatus, icon: ic_doc },
                ];
                doc.rect(mx, y, mw, 45).lineWidth(1).stroke(BORDER_COLOR);
                const statW = mw / payStats.length;
                payStats.forEach((s, i) => {
                    const itemX = mx + i * statW;
                    const iconX = itemX + 16;
                    const iconY = y + 22.5;
                    doc.circle(iconX, iconY, 10).lineWidth(1).stroke(ACCENT);
                    drawSvgIcon(iconX, iconY, s.icon, 0.42, ACCENT);

                    const textX = iconX + 16;
                    const textW = statW - 36;
                    doc.fillColor(TEXT_MUTED).fontSize(6).font('Helvetica-Bold').text(s.l, textX, y + 16, { width: textW, align: 'left' });
                    doc.fillColor(TEXT_DARK).fontSize(7).font('Helvetica').text(s.v, textX, y + 25, { width: textW, align: 'left' });

                    if (i < payStats.length - 1) doc.moveTo(itemX + statW, y + 8).lineTo(itemX + statW, y + 37).lineWidth(0.5).stroke(BORDER_COLOR);
                });
                y += 45 + sectionGap;

                let contentBottom = y;

                // ============ 6.5. PREPARED BY / REVIEWED BY / AUTHORIZED SIGNATORY ============
                if (receiptSettings.showSignatureStamp) {
                    const User = require('../models/User');
                    const axios = require('axios');
                    const fetchImageBuffer = async (url) => {
                        if (!url) return null;
                        try {
                            const resp = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
                            return Buffer.from(resp.data);
                        } catch (e) { return null; }
                    };

                    const rmName = registration.filledByFullName || registration.spokenWith || '';
                    let rmUser = null;
                    if (rmName) {
                        try { rmUser = await User.findOne({ fullName: rmName }).lean(); } catch (e) { }
                    }
                    let hodUser = null;
                    if (rmUser?.hodName) {
                        try { hodUser = await User.findOne({ fullName: rmUser.hodName }).lean(); } catch (e) { }
                    }
                    const preparedByName = rmName || 'N/A';
                    const preparedByDesignation = rmUser?.designation || 'Relationship Manager';
                    const reviewedByName = rmUser?.hodName || 'N/A';
                    const reviewedByDesignation = rmUser?.hodDesignation || 'HOD';
                    const preparedBySigBuffer = await fetchImageBuffer(rmUser?.signatureImage);
                    const reviewedBySigBuffer = await fetchImageBuffer(hodUser?.signatureImage);

                    const authColW = mw / 3;
                    const authHeaderH = 20;
                    const authBodyH = 100;
                    const authTop = contentBottom;
                    const sigLineY = authTop + authHeaderH + authBodyH - 22;

                    const authCols = [
                        { label: 'PREPARED BY', rows: [['Name', preparedByName], ['Designation', preparedByDesignation], ['Date', formattedDate]], sigBuffer: preparedBySigBuffer },
                        { label: 'REVIEWED BY', rows: [['Name', reviewedByName], ['Designation', reviewedByDesignation], ['Date', formattedDate]], sigBuffer: reviewedBySigBuffer },
                        { label: `FOR ${(settings?.companyName || 'COMPANY').toUpperCase()}`, rows: [] },
                    ];

                    doc.rect(mx, authTop, mw, authHeaderH).fill('#f8fafc');
                    doc.rect(mx, authTop, mw, authHeaderH + authBodyH).lineWidth(1).stroke(BORDER_COLOR);
                    doc.moveTo(mx, authTop + authHeaderH).lineTo(mx + mw, authTop + authHeaderH).lineWidth(0.5).stroke(BORDER_COLOR);

                    authCols.forEach((col, i) => {
                        const cx0 = mx + i * authColW;
                        if (i > 0) {
                            doc.moveTo(cx0, authTop).lineTo(cx0, authTop + authHeaderH + authBodyH).lineWidth(0.5).stroke(BORDER_COLOR);
                        }

                        doc.fillColor(ACCENT).fontSize(8).font('Helvetica-Bold').text(col.label, cx0, authTop + 6, { width: authColW, align: 'center' });

                        if (col.rows.length) {
                            let ry = authTop + authHeaderH + 12;
                            col.rows.forEach(([lbl, val]) => {
                                doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica-Bold').text(lbl, cx0 + 12, ry, { width: 60 });
                                doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica').text(':  ' + val, cx0 + 72, ry, { width: authColW - 84 });
                                ry += 15;
                            });
                            if (col.sigBuffer) {
                                try {
                                    doc.image(col.sigBuffer, cx0 + authColW / 2 - 40, sigLineY - 30, { fit: [80, 28], align: 'center' });
                                } catch (e) { }
                            }
                        } else {
                            if (receiptSettings.stampImage) {
                                const stampPath = path.join(__dirname, '..', receiptSettings.stampImage);
                                if (fs.existsSync(stampPath)) {
                                    doc.image(stampPath, cx0 + 12, authTop + authHeaderH + 8, { fit: [56, 56] });
                                }
                            }
                            if (receiptSettings.signatureImage) {
                                const sigPath = path.join(__dirname, '..', receiptSettings.signatureImage);
                                if (fs.existsSync(sigPath)) {
                                    doc.image(sigPath, cx0 + 74, authTop + authHeaderH + 16, { fit: [authColW - 86, 44] });
                                }
                            }
                        }

                        doc.moveTo(cx0 + 14, sigLineY).lineTo(cx0 + authColW - 14, sigLineY).lineWidth(0.5).stroke(BORDER_COLOR);
                        const sigLabel = col.rows.length ? '(Signature)' : (receiptSettings.signatureLabel || 'Authorized Signatory');
                        doc.fillColor(TEXT_MUTED).fontSize(7.5).font('Helvetica-Oblique').text(sigLabel, cx0, sigLineY + 4, { width: authColW, align: 'center' });
                    });

                    contentBottom = authTop + authHeaderH + authBodyH + sectionGap;
                }
                const printSafeBottomGap = 10;
                // Same left/right margin (mx) as every other section, instead of spanning
                // edge-to-edge.
                const barY = pageH - 22 - printSafeBottomGap;
                // Anchor the thank-you/contact block just above the bottom bar (with a small
                // internal gap between the two lines) instead of floating high above it.
                const footerBlockH = 30;
                const footerTop = Math.max(contentBottom + 10, barY - footerBlockH);

                doc.fillColor(NOTE_COLOR).font('Helvetica-Oblique').fontSize(10).text(receiptSettings.footerThankYouText || 'Thank you for your participation.', mx, footerTop, { width: mw, align: 'center' });
                doc.moveTo(mx + mw / 2 - 100, footerTop + 13).lineTo(mx + mw / 2 + 100, footerTop + 13).lineWidth(0.5).stroke(BORDER_COLOR);

                const contactRowY = footerTop + 17;
                const contactItems = [
                    { draw: drawPhoneIcon, v: settings?.contactPhone || '-' },
                    { draw: drawMailIcon, v: settings?.contactEmail || '-' },
                    { draw: drawGlobeIcon, v: settings?.contactWebsite || '-' },
                ];
                doc.fontSize(9).font('Helvetica');
                let totalW = 0;
                const itemWidths = contactItems.map(c => {
                    const w = doc.widthOfString(c.v);
                    totalW += 17 + w + 40;
                    return w;
                });
                totalW -= 40;

                let cx = mx + (mw - totalW) / 2;
                contactItems.forEach((c, i) => {
                    c.draw(cx + 6, contactRowY + 6, 6, ACCENT);
                    doc.fillColor(TEXT_DARK).fontSize(9).font('Helvetica').text(c.v, cx + 17, contactRowY);
                    cx += 17 + itemWidths[i] + 40;
                });
                doc.rect(mx, barY, mw, 22).fill(ACCENT);
                doc.fillColor('#fff').fontSize(7).font('Helvetica').text(receiptSettings.footerDisclaimerText || 'This is a computer generated document and does not require a physical signature.', mx, barY + 7, { width: mw, align: 'center' });
                doc.text('Page 1 of 1', mx + mw - 70, barY + 7, { width: 60, align: 'right' });

                doc.end();
                stream.on('finish', () => {
                    resolve({ filePath, cloudUrl: getTempPdfUrl(filePath) });
                });
                stream.on('error', reject);
            } catch (err) { reject(err); }
        });
    }

    async generateAccessoryReceipt(order, registration) {
        return new Promise(async (resolve, reject) => {
            try {
                const { headerPath, footerPath } = await resolveHeaderFooterPaths();
                const doc = new PDFDocument({ margin: 0, size: 'A4' });
                const filePath = path.join(TEMP_DIR, `acc_receipt_${order._id}_${Date.now()}.pdf`);
                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                const pageW = doc.page.width;
                const fmt = (n) => `INR ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

                this._headerImg(doc, headerPath);
                let y = doc.y + 10;

                // Title
                doc.rect(40, y, pageW - 80, 22).fill(ORANGE);
                doc.fillColor(WHITE).fontSize(11).font('Helvetica-Bold')
                    .text('ACCESSORY / EXTRAS PURCHASE RECEIPT', 40, y + 6, { width: pageW - 80, align: 'center' });
                y += 30;

                // Meta
                doc.fillColor(GRAY).fontSize(8).font('Helvetica')
                    .text(`Order No: ${order.orderNo}`, 40, y)
                    .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 0, y, { width: pageW - 40, align: 'right' });
                y += 16;
                this._line(doc, 40, y, pageW - 40);
                y += 8;

                // FROM | TO
                const colW = (pageW - 100) / 2;
                const lx = 40, rx = 60 + colW;
                const c1 = registration.contact1 || {};

                doc.rect(lx, y, colW, 80).lineWidth(0.5).stroke('#e5e7eb');
                this._label(doc, 'From', lx + 8, y + 8, colW - 16);
                doc.fillColor(GREEN).fontSize(10).font('Helvetica-Bold').text('IHWE 2026', lx + 8, y + 20, { width: colW - 16 });
                doc.fillColor(GRAY).fontSize(8).font('Helvetica')
                    .text('Namo Gange Wellness Pvt. Ltd.', lx + 8, y + 34, { width: colW - 16 })
                    .text('Pragati Maidan, New Delhi – 110001', lx + 8, y + 46, { width: colW - 16 })
                    .text('info@namogangewellness.com  |  +91-9654900525', lx + 8, y + 58, { width: colW - 16 });

                doc.rect(rx, y, colW, 80).lineWidth(0.5).stroke('#e5e7eb');
                this._label(doc, 'To (Exhibitor)', rx + 8, y + 8, colW - 16);
                doc.fillColor(ORANGE).fontSize(10).font('Helvetica-Bold').text(registration.exhibitorName || 'N/A', rx + 8, y + 20, { width: colW - 16 });
                doc.fillColor(GRAY).fontSize(8).font('Helvetica')
                    .text(`Reg ID: ${registration.registrationId || 'N/A'}`, rx + 8, y + 34, { width: colW - 16 })
                    .text(`Stall: ${registration.participation?.stallFor || 'N/A'}`, rx + 8, y + 46, { width: colW - 16 })
                    .text(c1.email || '', rx + 8, y + 58, { width: colW - 16 });
                y += 88;

                // Items table
                const tW = pageW - 80;
                const cols = [
                    { label: '#', w: tW * 0.05 },
                    { label: 'Item', w: tW * 0.30 },
                    { label: 'Type', w: tW * 0.12 },
                    { label: 'Qty', w: tW * 0.08, align: 'center' },
                    { label: 'Unit Price', w: tW * 0.15, align: 'right' },
                    { label: 'GST', w: tW * 0.10, align: 'right' },
                    { label: 'Total', w: tW * 0.20, align: 'right' },
                ];

                doc.rect(40, y, tW, 18).fill(DARK);
                let tx = 40;
                cols.forEach(col => {
                    doc.fillColor(WHITE).fontSize(8).font('Helvetica-Bold')
                        .text(col.label, tx + 4, y + 5, { width: col.w - 8, align: col.align || 'left' });
                    tx += col.w;
                });
                y += 18;

                order.items.forEach((item, idx) => {
                    const bg = idx % 2 === 0 ? '#f9fafb' : WHITE;
                    y = this._tableRow(doc, [
                        { text: String(idx + 1), w: tW * 0.05 },
                        { text: item.name, w: tW * 0.30 },
                        { text: item.type === 'complimentary' ? 'FREE' : 'Paid', w: tW * 0.12, color: item.type === 'complimentary' ? '#16a34a' : ORANGE, bold: true },
                        { text: String(item.qty), w: tW * 0.08, align: 'center' },
                        { text: item.type === 'complimentary' ? '—' : fmt(item.unitPrice), w: tW * 0.15, align: 'right' },
                        { text: item.type === 'complimentary' ? '—' : fmt(item.gstAmount), w: tW * 0.10, align: 'right' },
                        { text: item.type === 'complimentary' ? 'Complimentary' : fmt(item.totalPrice), w: tW * 0.20, align: 'right', bold: true },
                    ], y, bg);
                });

                this._line(doc, 40, y, 40 + tW, '#e5e7eb');
                y += 8;

                // Summary
                const sumX = 40 + tW * 0.55;
                const sumW = tW * 0.45;
                [
                    { label: 'Subtotal', value: fmt(order.subtotal) },
                    { label: 'Total GST', value: fmt(order.totalGst) },
                ].forEach(row => {
                    doc.fillColor(GRAY).fontSize(8).font('Helvetica')
                        .text(row.label, sumX, y + 4, { width: sumW * 0.55 })
                        .text(row.value, sumX + sumW * 0.55, y + 4, { width: sumW * 0.45, align: 'right' });
                    y += 16;
                });
                this._line(doc, sumX, y, sumX + sumW, GREEN, 1);
                y += 4;
                doc.rect(sumX, y, sumW, 24).fill(GREEN);
                doc.fillColor(WHITE).fontSize(10).font('Helvetica-Bold')
                    .text('GRAND TOTAL', sumX + 8, y + 7, { width: sumW * 0.5 })
                    .text(fmt(order.grandTotal), sumX + sumW * 0.5, y + 7, { width: sumW * 0.5 - 8, align: 'right' });
                y += 32;

                // Status badge
                const statusColor = order.paymentStatus === 'complimentary' ? GREEN : (order.paymentStatus === 'paid' ? '#0891b2' : '#f59e0b');
                doc.rect(40, y, 160, 22).fill(statusColor);
                doc.fillColor(WHITE).fontSize(9).font('Helvetica-Bold')
                    .text(order.paymentStatus.toUpperCase(), 40, y + 7, { width: 160, align: 'center' });

                if (order.transactionId) {
                    doc.fillColor(GRAY).fontSize(8).font('Helvetica')
                        .text(`Txn ID: ${order.transactionId}`, 210, y + 8, { width: pageW - 260 });
                }

                this._footerImg(doc, footerPath);
                doc.end();

                stream.on('finish', () => {
                    const publicUrl = getTempPdfUrl(filePath);
                    resolve({ filePath, cloudUrl: publicUrl });
                });
                stream.on('error', reject);
            } catch (err) { reject(err); }
        });
    }

    async generateClientStatement(ledger, options = {}) {
        return new Promise(async (resolve, reject) => {
            try {
                const { headerPath, footerPath } = await resolveHeaderFooterPaths(
                    options.headerImage,
                    options.footerImage
                );
                const settings = await Settings.findOne();
                const doc = new PDFDocument({ margin: 0, size: 'A4' });
                const safeBase = String(ledger.companyInfo?.name || 'client').replace(/[^a-z0-9]+/gi, '_');
                const fileName = `statement_${safeBase}_${Date.now()}.pdf`;
                const filePath = path.join(TEMP_DIR, fileName);
                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                const pageW = doc.page.width;
                const pageH = doc.page.height;
                const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

                this._headerImg(doc, headerPath);
                let y = doc.y;
                if (!headerPath) {
                    doc.fillColor(GRAY).fontSize(8).font('Helvetica')
                        .text(settings?.companyAddress || '', 40, y, { width: pageW - 80, align: 'center' });
                    y += 20;
                }

                doc.rect(40, y, pageW - 80, 26).fill(BLUE_NAVY);
                doc.fillColor(WHITE).fontSize(13).font('Helvetica-Bold')
                    .text('STATEMENT OF ACCOUNT', 40, y + 7, { width: pageW - 80, align: 'center', characterSpacing: 1 });
                y += 36;

                doc.fillColor(GRAY).fontSize(8).font('Helvetica')
                    .text(`Generated On: ${fmtDate(new Date())}`, 40, y, { width: pageW - 80, align: 'right' });
                y += 16;

                // ── Client Information ──
                const info = ledger.companyInfo || {};
                doc.rect(40, y, 160, 16).fill(BLUE_NAVY);
                doc.fillColor(WHITE).fontSize(8).font('Helvetica-Bold').text('Client Information', 45, y + 4);
                y += 22;
                const colW = (pageW - 100) / 2;
                const leftRows = [
                    ['Client Name:', info.name],
                    ['Contact Person:', info.contactPerson],
                    ['Mobile:', info.mobile],
                    ['Email:', info.email],
                ];
                const rightRows = [
                    ['Stall No.:', info.stallNo],
                    ['GST No.:', info.gstNo],
                    ['PAN No.:', info.panNo],
                    ['State:', info.state],
                ];
                let ly = y, ry = y;
                leftRows.forEach(([label, value]) => {
                    this._label(doc, label, 40, ly, 100);
                    this._value(doc, value, 130, ly, colW - 90);
                    ly += 16;
                });
                rightRows.forEach(([label, value]) => {
                    this._label(doc, label, 60 + colW, ry, 90);
                    this._value(doc, value, 150 + colW, ry, colW - 110);
                    ry += 16;
                });
                y = Math.max(ly, ry) + 10;

                // ── Summary boxes ──
                const fin = ledger.financials || {};
                const boxes = [
                    { label: 'Total Invoiced', value: fmt(fin.totalInvoiced), color: BLUE_NAVY },
                    { label: 'Total Received', value: fmt(fin.totalReceived), color: GREEN },
                    { label: 'Total Adjustments', value: fmt(fin.totalAdjustments), color: ORANGE },
                    { label: 'Outstanding', value: fmt(fin.outstandingAmount), color: '#b91c1c' },
                ];
                const boxW = (pageW - 80) / boxes.length;
                boxes.forEach((box, i) => {
                    const bx = 40 + i * boxW;
                    doc.rect(bx, y, boxW - 6, 38).fill(LGRAY);
                    this._label(doc, box.label, bx + 6, y + 6, boxW - 18);
                    doc.fillColor(box.color).fontSize(9).font('Helvetica-Bold').text(box.value, bx + 6, y + 18, { width: boxW - 18 });
                });
                y += 48;

                // ── Ledger table ──
                const tW = pageW - 80;
                const cols = [
                    { label: 'Date', w: tW * 0.11 },
                    { label: 'Type', w: tW * 0.11 },
                    { label: 'Document No.', w: tW * 0.16 },
                    { label: 'Reference / Narration', w: tW * 0.23 },
                    { label: 'Debit', w: tW * 0.125, align: 'right' },
                    { label: 'Credit', w: tW * 0.125, align: 'right' },
                    { label: 'Balance', w: tW * 0.14, align: 'right' },
                ];
                const drawTableHeader = (yy) => {
                    doc.rect(40, yy, tW, 18).fill(DARK);
                    let tx = 40;
                    cols.forEach((col) => {
                        doc.fillColor(WHITE).fontSize(7.5).font('Helvetica-Bold')
                            .text(col.label, tx + 4, yy + 5, { width: col.w - 8, align: col.align || 'left' });
                        tx += col.w;
                    });
                    return yy + 18;
                };
                y = drawTableHeader(y);

                doc.fillColor(GRAY).fontSize(7).font('Helvetica-Bold')
                    .text('Opening Balance', 40, y + 4, { width: tW - 100 });
                doc.fillColor(DARK).text(fmt(ledger.openingBalance), 40, y + 4, { width: tW, align: 'right' });
                y += 16;

                (ledger.ledger || []).forEach((row, idx) => {
                    const rowCols = [
                        { text: fmtDate(row.date), w: cols[0].w },
                        { text: row.type, w: cols[1].w },
                        { text: row.documentNo, w: cols[2].w },
                        { text: (row.reference || '').replace(/\s*\n\s*/g, ' ').trim(), w: cols[3].w },
                        { text: row.debit ? fmt(row.debit) : '-', w: cols[4].w, align: 'right', color: row.debit ? '#b91c1c' : GRAY },
                        { text: row.credit ? fmt(row.credit) : '-', w: cols[5].w, align: 'right', color: row.credit ? GREEN : GRAY },
                        { text: fmt(row.balance), w: cols[6].w, align: 'right', bold: true },
                    ];
                    const rowHeight = this._measureRowHeight(doc, rowCols);
                    if (y + rowHeight > pageH - 100) {
                        doc.addPage();
                        y = 40;
                        y = drawTableHeader(y);
                    }
                    y = this._wrappedTableRow(doc, rowCols, y, idx % 2 === 0 ? '#fafafa' : null);
                });

                if (y > pageH - 100) {
                    doc.addPage();
                    y = 40;
                }
                y += 6;
                this._line(doc, 40, y, pageW - 40, BLUE_NAVY, 1);
                y += 8;
                doc.fillColor(BLUE_NAVY).fontSize(9).font('Helvetica-Bold')
                    .text(`Closing Balance as on ${fmtDate(new Date())}`, 40, y, { width: tW - 120 });
                doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
                    .text(fmt(ledger.closingBalance), 40, y, { width: tW, align: 'right' });

                if (footerPath) this._footerImg(doc, footerPath);

                doc.end();
                stream.on('finish', () => {
                    const publicUrl = getTempPdfUrl(filePath);
                    resolve({ filePath, cloudUrl: publicUrl });
                });
                stream.on('error', reject);
            } catch (err) { reject(err); }
        });
    }
}

module.exports = new PDFGenerator();
