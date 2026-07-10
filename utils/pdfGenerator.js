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

    // Measures how tall a row needs to be given each cell's wrapped text, so rows
    // with long narration/description text never overlap the row drawn after them.
    _measureRowHeight(doc, cols, minHeight = 18) {
        let maxHeight = minHeight;
        cols.forEach(({ text, w, bold }) => {
            doc.fontSize(8).font(bold ? 'Helvetica-Bold' : 'Helvetica');
            const h = doc.heightOfString(String(text ?? ''), { width: w - 8 });
            maxHeight = Math.max(maxHeight, h + 8);
        });
        return maxHeight;
    }

    // Like _tableRow, but sizes the row to fit wrapped multi-line cell content instead
    // of assuming a fixed single-line height (which caused overlapping/garbled rows
    // whenever a cell's text — e.g. a long item description — wrapped to 2+ lines).
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
                const fmt = (n) => `${curStr}${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

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

                // Simple hand-drawn icons (primitives only, no SVG path parsing) for the new
                // header/footer contact icons — kept intentionally basic for reliability.
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
                    doc.roundedRect(cx - r * 0.5, cy - r, r, r * 2, r * 0.3).lineWidth(0.8).stroke(color);
                    doc.restore();
                };
                const drawPinIcon = (cx, cy, r, color) => {
                    doc.save();
                    doc.circle(cx, cy - r * 0.2, r * 0.55).lineWidth(0.8).stroke(color);
                    doc.moveTo(cx, cy + r * 0.3).lineTo(cx, cy + r).lineWidth(0.8).stroke(color);
                    doc.restore();
                };
                const drawBuildingIcon = (cx, cy, r, color) => {
                    doc.save();
                    doc.rect(cx - r * 0.7, cy - r, r * 1.4, r * 2).lineWidth(0.8).stroke(color);
                    doc.restore();
                };

                let y = 15;

                // ============ 1. HEADER BAND ============
                // If a Header Image (Payment Management) is uploaded, it IS the entire top
                // banner — wordmark, contact info, GSTIN/CIN, Head Office, all of it — drawn
                // full-width, same convention as the header-image banners used elsewhere in
                // this app (see _headerImg). With nothing uploaded, fall back to the
                // structured, field-driven header below so the receipt still works out of
                // the box.
                let headerBannerDrawn = false;
                let headerConsumedH = headerH;
                // Wide, short banners (the intended shape for this slot) scale to full width
                // with a modest height. A square/tall image dropped in here by mistake would
                // otherwise stretch to a huge height at full page width — cap it so a wrong
                // upload degrades gracefully instead of blowing out the whole layout. And
                // unlike the fallback (structured) header, the image's OWN height is used —
                // never padded up to headerBandHeight — so a short banner doesn't leave a
                // dead gap underneath it before the next section.
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
                let evMidY = y + 10;
                const fmtEvDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
                const dateStr = eventDoc?.startDate ? `${fmtEvDate(eventDoc.startDate)}${eventDoc.endDate ? ' - ' + fmtEvDate(eventDoc.endDate) : ''}` : 'TBA';
                drawPinIcon(evMidX + 8, evMidY + 8, 8, ACCENT);
                doc.fillColor(TEXT_MUTED).fontSize(7).font('Helvetica-Bold').text('DATE:', evMidX + 22, evMidY);
                doc.fillColor(TEXT_DARK).fontSize(8).font('Helvetica').text(dateStr, evMidX + 22, evMidY + 10, { width: evMidW - 25 });
                evMidY += 34;
                drawPinIcon(evMidX + 8, evMidY + 8, 8, ACCENT);
                doc.fillColor(TEXT_MUTED).fontSize(7).font('Helvetica-Bold').text('VENUE:', evMidX + 22, evMidY);
                doc.fillColor(TEXT_DARK).fontSize(8).font('Helvetica').text((eventDoc?.location || 'Pragati Maidan, New Delhi, India').toUpperCase(), evMidX + 22, evMidY + 10, { width: evMidW - 25 });

                const boxX = mx + evColW + evMidW;
                const boxW = evRightW;
                doc.roundedRect(boxX, y, boxW, eventH, 6).lineWidth(1).stroke(BORDER_COLOR);
                doc.fillColor(ACCENT).fontSize(10).font('Helvetica-Bold').text(receiptSettings.receiptTitleLabel || 'PAYMENT RECEIPT', boxX, y + 8, { width: boxW, align: 'center' });
                const formattedDate = new Date(m.paidAt || registration.updatedAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                const infoRows = [
                    ['Receipt No.', rNo],
                    ['Reg ID', registration.registrationId || registration._id?.toString().slice(-8) || 'N/A'],
                    ['Date', formattedDate],
                ];
                let boxY = y + 26;
                infoRows.forEach(([l, v]) => {
                    doc.fillColor(TEXT_MUTED).fontSize(7).font('Helvetica-Bold').text(l, boxX + 10, boxY, { width: 55 });
                    doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica').text(':  ' + (v || 'N/A'), boxX + 65, boxY, { width: boxW - 75 });
                    boxY += 15;
                });

                y += eventH + sectionGap;

                // ============ 3. FROM / TO BAND ============
                const halfW = (mw - 12) / 2;
                const boxTop = y + sectionGap * 2;
                const rowW = halfW - 24;

                const fromAddr = settings?.companyAddress || 'N/A';
                const exAddr = [registration.address, registration.city, registration.state, registration.pincode].filter(Boolean).join(', ') || 'N/A';

                // Box height is driven by actual measured content (address wrapping, and TO
                // having two contact lines vs FROM's one) — not just infoBandHeight — so a
                // long address or a phone+email pair stacked on separate lines never spills
                // past the box border into the section below.
                doc.fontSize(7.5).font('Helvetica');
                const fromAddrH = doc.heightOfString(fromAddr, { width: rowW });
                const toAddrH = doc.heightOfString(exAddr, { width: rowW });
                const fromInnerH = 30 + 12 + fromAddrH + 10 + 8 + 12 + 10;
                const toInnerH = 30 + 12 + toAddrH + 10 + 8 + 13 + 12 + 10;
                const boxH = Math.max(infoH - 16, fromInnerH, toInnerH);

                // FROM (Organiser)
                doc.roundedRect(mx, boxTop, halfW, 18, 4).fill(ORGANISER);
                drawBuildingIcon(mx + 14, boxTop + 9, 6, '#fff');
                doc.fillColor('#fff').fontSize(8.5).font('Helvetica-Bold').text(receiptSettings.fromLabel || 'FROM (ORGANISER)', mx + 26, boxTop + 5, { width: halfW - 30 });
                doc.roundedRect(mx, boxTop + 18, halfW, boxH - 18, 4).lineWidth(1).stroke(BORDER_COLOR);
                let fy = boxTop + 30;
                doc.fillColor(TEXT_DARK).fontSize(9.5).font('Helvetica-Bold').text(settings?.companyName || 'N/A', mx + 12, fy, { width: rowW });
                fy += 12;
                doc.fillColor(TEXT_MUTED).fontSize(7.5).font('Helvetica').text(fromAddr, mx + 12, fy, { width: rowW });
                fy += fromAddrH + 10;
                doc.moveTo(mx + 12, fy).lineTo(mx + halfW - 12, fy).dash(2, { space: 2 }).lineWidth(0.5).stroke(BORDER_COLOR);
                doc.undash();
                fy += 8;
                drawMailIcon(mx + 16, fy + 6, 5, TEXT_DARK);
                doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica').text(settings?.contactEmail || '-', mx + 26, fy + 2, { width: rowW - 14 });

                // TO (Exhibitor)
                const rX = mx + halfW + 12;
                doc.roundedRect(rX, boxTop, halfW, 18, 4).fill(EXHIBITOR);
                drawSvgIcon(rX + 14, boxTop + 9, ic_user, 0.4, '#fff');
                doc.fillColor('#fff').fontSize(8.5).font('Helvetica-Bold').text(receiptSettings.toLabel || 'TO (EXHIBITOR)', rX + 26, boxTop + 5, { width: halfW - 30 });
                doc.roundedRect(rX, boxTop + 18, halfW, boxH - 18, 4).lineWidth(1).stroke(BORDER_COLOR);
                let ty = boxTop + 30;
                doc.fillColor(TEXT_DARK).fontSize(9.5).font('Helvetica-Bold').text(registration.exhibitorName || 'N/A', rX + 12, ty, { width: rowW });
                ty += 12;
                doc.fillColor(TEXT_MUTED).fontSize(7.5).font('Helvetica').text(exAddr, rX + 12, ty, { width: rowW });
                ty += toAddrH + 10;
                doc.moveTo(rX + 12, ty).lineTo(rX + halfW - 12, ty).dash(2, { space: 2 }).lineWidth(0.5).stroke(BORDER_COLOR);
                doc.undash();
                ty += 8;
                drawPhoneIcon(rX + 16, ty + 6, 5, TEXT_DARK);
                doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica').text(c1.mobile || c1.whatsapp || '-', rX + 26, ty + 2, { width: rowW - 14 });
                ty += 13;
                drawMailIcon(rX + 16, ty + 6, 5, TEXT_DARK);
                doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica').text(c1.email || '-', rX + 26, ty + 2, { width: rowW - 14 });

                y = boxTop + boxH + sectionGap;

                // ============ 4. INVOICE DETAILS ============
                const paymentAgainst = registration.customInvoiceNo || registration.referenceInvoice || registration.invoiceNo || p.invoiceNo || invoice?.invoice_no || 'N/A';
                const invoiceType = invoice?.invoice_no ? 'Tax Invoice' : (invoice ? 'Proforma Invoice' : 'Payment Receipt');
                let paymentTypeLabel = 'Advance / Partial';
                if (registration.balanceAmount <= 0) paymentTypeLabel = 'Final Payment';

                const drawDivider = (label) => {
                    doc.moveTo(mx, y + 6).lineTo(mx + mw / 2 - 70, y + 6).lineWidth(0.5).stroke(BORDER_COLOR);
                    doc.fillColor(ACCENT).fontSize(9).font('Helvetica-Bold').text(label, mx + mw / 2 - 65, y, { width: 140, align: 'center' });
                    doc.moveTo(mx + mw / 2 + 70, y + 6).lineTo(mx + mw, y + 6).lineWidth(0.5).stroke(BORDER_COLOR);
                    y += 18;
                };
                drawDivider(receiptSettings.invoiceDetailsLabel || 'INVOICE DETAILS');

                const gridFields = [
                    ['INVOICE NO.', paymentAgainst],
                    ['INVOICE TYPE', invoiceType],
                    ['PAYMENT TYPE', paymentTypeLabel],
                    ['DOC TYPE', 'Payment Receipt'],
                    ['QTY', '1'],
                    ['EVENT', eventDoc?.name || 'IHWE 2026'],
                ];
                const gridColW = mw / gridFields.length;
                // Long values (e.g. a lengthy event name) can wrap to several lines — measure
                // the tallest cell first so the row below (the item table) never overlaps it.
                doc.fontSize(7.5).font('Helvetica-Bold');
                const gridValueHeight = Math.max(...gridFields.map((f) => doc.heightOfString(String(f[1]), { width: gridColW - 4 })));
                gridFields.forEach((f, i) => {
                    const gx = mx + i * gridColW;
                    doc.fillColor(TEXT_MUTED).fontSize(6.5).font('Helvetica-Bold').text(f[0], gx, y, { width: gridColW - 4, align: 'center' });
                    doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica-Bold').text(String(f[1]), gx, y + 10, { width: gridColW - 4, align: 'center' });
                });
                y += 10 + gridValueHeight + 8;

                // Item table (single summary row — this app doesn't carry itemized line items
                // for a payment receipt, only an invoice-level amount, same as before)
                const fb = registration.financeBreakdown || {};
                const invVal = invoice?.finalAmount || fb.netPayable || p.amount || 0;
                const tableCols = [
                    { label: 'Description', w: 0.4 },
                    { label: 'Doc Type', w: 0.17 },
                    { label: 'Payment Type', w: 0.17 },
                    { label: 'Rate/Unit', w: 0.13 },
                    { label: 'Amount', w: 0.13 },
                ];
                let tx = mx;
                doc.rect(mx, y, mw, 16).fill(ACCENT);
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
                    fmt(invVal),
                    fmt(invVal),
                ];
                tableCols.forEach((c, i) => {
                    const cw = mw * c.w;
                    doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica').text(rowVals[i], tx + 4, y + 6, { width: cw - 8, align: 'left' });
                    tx += cw;
                });
                y += rowH;

                // Summary rows
                const gstPercent = p.gstPercent || 18;
                const taxableValue = fb.subtotal || Math.round(invVal / (1 + gstPercent / 100));
                const gstAmount = fb.gstAmount || Math.max(0, invVal - taxableValue);
                const tdsPercent = fb.tdsPercent || registration.chosenTdsPercent || 0;
                const tdsAmount = fb.tdsAmount || 0;
                const grandTotal = taxableValue + gstAmount - tdsAmount;

                const summaryRows = [
                    ['GROSS AMOUNT', fmt(fb.grossAmount || invVal), false],
                    ['TAXABLE VALUE', fmt(taxableValue), false],
                    [`ADD: GST @ ${gstPercent}%`, `+ ${fmt(gstAmount)}`, false],
                    [`LESS: TDS DEDUCTION (${tdsPercent}%)`, `- ${fmt(tdsAmount)}`, false],
                    ['GRAND TOTAL', fmt(grandTotal), true],
                ];
                const sumW = mw * 0.42;
                const sumX = mx + mw - sumW;
                summaryRows.forEach(([l, v, strong]) => {
                    if (strong) doc.rect(sumX, y, sumW, 18).fill(ACCENT);
                    doc.fillColor(strong ? '#fff' : TEXT_DARK).fontSize(8).font(strong ? 'Helvetica-Bold' : 'Helvetica').text(l, sumX + 8, y + 4, { width: sumW * 0.55 });
                    doc.fillColor(strong ? '#fff' : (v.startsWith('-') ? '#dc2626' : TEXT_DARK)).fontSize(8).font(strong ? 'Helvetica-Bold' : 'Helvetica').text(v, sumX + sumW * 0.5, y + 4, { width: sumW * 0.47 - 8, align: 'right' });
                    doc.moveTo(mx, y + 16).lineTo(mx + mw, y + 16).lineWidth(0.3).stroke(BORDER_COLOR);
                    y += 16;
                });
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
                    { l: 'TOTAL PAID', v: fmt(totalPaid), icon: ic_rupee },
                    { l: 'PAYMENT STATUS', v: paymentStatus, icon: ic_doc },
                ];
                doc.roundedRect(mx, y, mw, 55, 6).lineWidth(1).stroke(BORDER_COLOR);
                const statW = mw / payStats.length;
                payStats.forEach((s, i) => {
                    const cx = mx + i * statW + statW / 2;
                    doc.circle(cx, y + 16, 10).lineWidth(1).stroke(ACCENT);
                    drawSvgIcon(cx, y + 16, s.icon, 0.42, ACCENT);
                    doc.fillColor(TEXT_MUTED).fontSize(6.5).font('Helvetica-Bold').text(s.l, cx - statW / 2 + 4, y + 32, { width: statW - 8, align: 'center' });
                    doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica').text(s.v, cx - statW / 2 + 4, y + 42, { width: statW - 8, align: 'center' });
                    if (i < payStats.length - 1) doc.moveTo(mx + (i + 1) * statW, y + 8).lineTo(mx + (i + 1) * statW, y + 48).lineWidth(0.5).stroke(BORDER_COLOR);
                });
                y += 55 + sectionGap;

                // ============ 6. EXHIBITOR DETAILS / IMPORTANT NOTE ============
                const boxTop2 = y + sectionGap * 2;
                const noteItems = (receiptSettings.importantNoteItems || []).slice(0, 4);
                doc.fontSize(7).font('Helvetica');
                // Measure each bullet's wrapped height up front so items never overlap when
                // one of them wraps to more than one line, and size the box to fit them all.
                const noteItemHeights = noteItems.map((item, i) => doc.heightOfString(`${i + 1}. ${item}`, { width: halfW - 20 }));
                const noteContentHeight = noteItemHeights.reduce((sum, h) => sum + h + 4, 0);
                const boxH2 = Math.max(74, 18 + 16 + noteContentHeight + 10);
                doc.roundedRect(mx, boxTop2, halfW, 18, 4).fill(EXHIBITOR);
                drawSvgIcon(mx + 14, boxTop2 + 9, ic_user, 0.4, '#fff');
                doc.fillColor('#fff').fontSize(8.5).font('Helvetica-Bold').text(receiptSettings.exhibitorDetailsLabel || 'EXHIBITOR DETAILS', mx + 26, boxTop2 + 5);
                doc.roundedRect(mx, boxTop2 + 18, halfW, boxH2 - 18, 4).lineWidth(1).stroke(BORDER_COLOR);

                const contactPersonStr = c1 ? `${c1.title ? c1.title + ' ' : ''}${c1.firstName || ''} ${c1.lastName || ''}`.trim() : '';
                const displayName = contactPersonStr || registration.filledByFullName || invoice?.consignee_name || 'N/A';
                const contactMobile = c1.mobile || c1.whatsapp || '';

                let exY = boxTop2 + 30;
                doc.fillColor(TEXT_MUTED).fontSize(7.5).font('Helvetica-Bold').text('Contact Person', mx + 12, exY, { width: 90 });
                doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica').text(':  ' + displayName + (contactMobile ? ` / ${contactMobile}` : ''), mx + 100, exY, { width: halfW - 112 });
                exY += 16;
                doc.fillColor(TEXT_MUTED).fontSize(7.5).font('Helvetica-Bold').text('Relationship Manager', mx + 12, exY, { width: 90 });
                doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica').text(':  ' + (registration.filledByFullName || registration.spokenWith || 'Direct'), mx + 100, exY, { width: halfW - 112 });

                const rX2 = mx + halfW + 12;
                doc.roundedRect(rX2, boxTop2, halfW, 18, 4).fill(NOTE_COLOR);
                doc.fillColor('#fff').fontSize(8.5).font('Helvetica-Bold').text(receiptSettings.importantNoteLabel || 'IMPORTANT NOTE', rX2 + 14, boxTop2 + 5, { width: halfW - 20 });
                doc.roundedRect(rX2, boxTop2 + 18, halfW, boxH2 - 18, 4).lineWidth(1).stroke(BORDER_COLOR);
                let noteY = boxTop2 + 26;
                noteItems.forEach((item, i) => {
                    doc.fillColor(TEXT_DARK).fontSize(7).font('Helvetica').text(`${i + 1}. ${item}`, rX2 + 10, noteY, { width: halfW - 20 });
                    noteY += noteItemHeights[i] + 4;
                });

                const contentBottom = boxTop2 + boxH2 + sectionGap;

                // ============ 7. FOOTER ============
                // Anchored to the page bottom, but never overlaps content above it even if
                // the configured band heights push content unusually far down the page.
                const footerTop = Math.max(contentBottom, pageH - footerH);
                doc.fillColor(NOTE_COLOR).font('Helvetica-Oblique').fontSize(10).text(receiptSettings.footerThankYouText || 'Thank you for your participation.', mx, footerTop, { width: mw, align: 'center' });
                doc.moveTo(mx + mw / 2 - 100, footerTop + 16).lineTo(mx + mw / 2 + 100, footerTop + 16).lineWidth(0.5).stroke(BORDER_COLOR);

                const contactRowY = footerTop + 24;
                const contactItems = [
                    { draw: drawPhoneIcon, v: settings?.contactPhone || '-' },
                    { draw: drawMailIcon, v: settings?.contactEmail || '-' },
                    { draw: drawGlobeIcon, v: settings?.contactWebsite || '-' },
                ];
                const cItemW = mw / contactItems.length;
                contactItems.forEach((c, i) => {
                    const cx = mx + i * cItemW + cItemW / 2 - 40;
                    c.draw(cx, contactRowY + 5, 5, ACCENT);
                    doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica').text(c.v, cx + 10, contactRowY, { width: cItemW - 20 });
                });

                // Same left/right margin (mx) as every other section, instead of spanning
                // edge-to-edge.
                const barY = pageH - 22;
                doc.rect(mx, barY, mw, 22).fill(ACCENT);
                doc.fillColor('#fff').fontSize(7).font('Helvetica').text(receiptSettings.footerDisclaimerText || 'This is a computer generated document and does not require a physical signature.', mx + 10, barY + 7, { width: mw - 80 });
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
