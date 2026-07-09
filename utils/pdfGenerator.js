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
                // helper for number to words
                const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
                const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
                const inWords = (num) => {
                    if ((num = num.toString()).length > 9) return 'overflow';
                    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
                    if (!n) return '';
                    let str = '';
                    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
                    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
                    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
                    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
                    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only' : 'Only';
                    return str.trim() || 'Zero Only';
                };

                const { headerPath, footerPath } = await resolveHeaderFooterPaths(options.headerImage, options.footerImage);
                const doc = new PDFDocument({ margin: 0, size: 'A4' });

                const paymentIndex = options.paymentIndex !== undefined ? options.paymentIndex : -1;
                const suffix = paymentIndex >= 0 ? `_P${paymentIndex + 1}` : '';
                const safeReceiptBase = String(registration.registrationId || registration._id || 'receipt').replace(/[\\/:*?"<>|]+/g, '_');
                const fileName = `receipt_${safeReceiptBase}${suffix}_${Date.now()}.pdf`;
                const filePath = path.join(TEMP_DIR, fileName);
                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                const pageW = doc.page.width;
                const p = registration.participation || {};
                const c1 = registration.contact1 || {};
                const paymentHistoryEntry = paymentIndex >= 0 && registration.paymentHistory?.[paymentIndex] ? registration.paymentHistory[paymentIndex] : null;
                const m = paymentHistoryEntry || registration.manualPaymentDetails || {};
                const isUSD = p.currency === 'USD';

                // Using Rs. instead of ₹ to avoid Helvetica rendering issues (renders as ¹)
                const curStr = isUSD ? 'USD ' : 'Rs. ';
                const fmt = (n) => `${curStr}${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
                const valFmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

                const Settings = require('../models/Settings');
                const settings = await Settings.findOne();

                const Invoice = require('../models/Invoice');
                const invoice = await Invoice.findOne({
                    $or: [
                        { companyId: registration.clientId || (registration._id ? registration._id.toString() : '') },
                        { company_name: registration.exhibitorName }
                    ]
                }).sort({ added: -1 }).lean();

                // Generate Receipt Number
                const Counter = require('../models/visitor/CounterModel');
                const year = new Date().getFullYear();
                let rNo = registration.customReceiptNo || registration.receiptNo;
                if (!rNo) {
                    const counter = await Counter.findOneAndUpdate({ type: `receipt-ngw-${year}` }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' });
                    rNo = `PR/${String(year).slice(-2)}-${String(year + 1).slice(-2)}/${String(counter.seq).padStart(3, '0')}`;
                    try {
                        if (registration._id && typeof registration.constructor.findByIdAndUpdate === 'function') {
                            await registration.constructor.findByIdAndUpdate(registration._id, { customReceiptNo: rNo });
                        }
                    } catch (e) { }
                }

                this._headerImg(doc, headerPath, true);
                let y = doc.y + 5;

                // Colors
                const NAVY = '#0b3974';
                const BORDER_COLOR = '#d1d5db';
                const TEXT_DARK = '#0f172a';
                const TEXT_MUTED = '#475569';

                // Helpers
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

                // Title
                doc.font('Helvetica-Bold').fontSize(18).fillColor(NAVY).text('PAYMENT RECEIPT', 0, y, { align: 'center', characterSpacing: 1 });
                y += 20;

                const mx = 40;
                const mw = pageW - 80;

                // TOP STATS BOX
                doc.roundedRect(mx, y, mw, 70, 8).lineWidth(1).stroke(BORDER_COLOR);

                const statW = mw / 4;
                const paymentDateObj = new Date(m.paidAt || registration.updatedAt || Date.now());
                const formattedDate = paymentDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                const paymentAgainst = registration.customInvoiceNo || registration.referenceInvoice || registration.invoiceNo || p.invoiceNo || invoice?.invoice_no || 'N/A';

                let paymentType = 'Advance / Partial';
                if (registration.balanceAmount <= 0) paymentType = 'Full Payment';

                const stats = [
                    { label: 'RECEIPT NO.', value: rNo, icon: ic_doc },
                    { label: 'RECEIPT DATE', value: formattedDate, icon: ic_cal },
                    { label: 'PAYMENT AGAINST', value: paymentAgainst, icon: ic_doc },
                    { label: 'PAYMENT TYPE', value: paymentType, icon: ic_wallet },
                ];

                // Leave 65px of dead space on the right side for the RECEIVED badge so no text overlaps
                const effectiveW = mw - 65;
                const customStatW = effectiveW / 4;

                stats.forEach((s, i) => {
                    let cx = mx + i * customStatW + customStatW / 2;

                    doc.circle(cx, y + 20, 10).lineWidth(1).stroke(NAVY);
                    drawSvgIcon(cx, y + 20, s.icon, 0.45, NAVY);

                    doc.fillColor(NAVY).fontSize(7).font('Helvetica-Bold').text(s.label, cx - customStatW / 2, y + 42, { width: customStatW, align: 'center' });
                    doc.fillColor(TEXT_DARK).fontSize(9).font('Helvetica').text(s.value, cx - customStatW / 2, y + 54, { width: customStatW, align: 'center' });

                    if (i < 3) doc.moveTo(mx + (i + 1) * customStatW, y + 15).lineTo(mx + (i + 1) * customStatW, y + 55).lineWidth(0.5).stroke(BORDER_COLOR);
                });

                // RECEIVED BADGE (Perfectly symmetric and aligned)
                const bx = mx + mw - 5;
                const bw = 55;
                const ribbonLeft = bx - bw;

                doc.polygon([bx, y], [ribbonLeft, y], [ribbonLeft, y + 45], [ribbonLeft + bw / 2, y + 55], [bx, y + 45]).fill(NAVY);
                doc.fillColor('#fff').fontSize(8).font('Helvetica-Bold').text('RECEIVED', ribbonLeft, y + 32, { width: bw, align: 'center', characterSpacing: 0.5 });

                const xc = ribbonLeft + bw / 2;
                const yc = y + 16;
                doc.circle(xc, yc, 10).lineWidth(1.5).stroke('#fff');
                doc.moveTo(xc - 4, yc).lineTo(xc - 1, yc + 3).lineTo(xc + 5, yc - 4).stroke('#fff');

                y += 90;

                // RECEIVED FROM & INVOICE REF
                const halfW = (mw - 15) / 2;

                // Left Box: RECEIVED FROM
                doc.circle(mx + 12, y + 8, 12).fill(NAVY);
                drawSvgIcon(mx + 12, y + 8, ic_user, 0.5, '#fff');
                doc.fillColor(NAVY).fontSize(10).font('Helvetica-Bold').text('RECEIVED FROM', mx + 32, y + 3);

                doc.roundedRect(mx, y + 30, halfW, 90, 8).lineWidth(1).stroke(BORDER_COLOR);
                doc.fillColor(TEXT_DARK).fontSize(11).font('Helvetica').text(registration.exhibitorName || 'N/A', mx + 15, y + 45, { width: halfW - 30 });
                const addr = [registration.address, registration.city, registration.state, registration.pincode].filter(Boolean).join(', ');
                doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica').text(addr, mx + 15, y + 60, { width: halfW - 30 });

                // Robust GSTIN lookup (check registration, then invoice)
                const gstinStr = registration.gstNo || registration.gstin || invoice?.gst_no || invoice?.company_gst_no || 'N/A';
                doc.fillColor(TEXT_DARK).font('Helvetica').text(`GSTIN: ${gstinStr}`, mx + 15, y + 85);

                // Robust Contact Person Name logic (prefer full name if available)
                const contactPersonStr = c1 ? `${c1.title ? c1.title + ' ' : ''}${c1.firstName || ''} ${c1.lastName || ''}`.trim() : '';
                let displayName = 'N/A';
                if (registration.filledByFullName && registration.filledByFullName.length > contactPersonStr.length) {
                    displayName = registration.filledByFullName;
                } else if (contactPersonStr.length > 0) {
                    displayName = contactPersonStr;
                } else if (invoice?.consignee_name) {
                    displayName = invoice.consignee_name;
                }

                doc.fillColor(NAVY).text(`Contact Person: ${displayName}`, mx + 15, y + 100);

                // Right Box: INVOICE REFERENCE
                doc.circle(mx + halfW + 15 + 12, y + 8, 12).fill(NAVY);
                drawSvgIcon(mx + halfW + 15 + 12, y + 8, ic_doc, 0.5, '#fff');
                doc.fillColor(NAVY).fontSize(10).font('Helvetica-Bold').text('INVOICE REFERENCE', mx + halfW + 15 + 32, y + 3);

                doc.roundedRect(mx + halfW + 15, y + 30, halfW, 90, 8).lineWidth(1).stroke(BORDER_COLOR);

                const fb = registration.financeBreakdown || {};
                const invVal = invoice?.finalAmount || fb.netPayable || p.amount || 0;

                let rx = mx + halfW + 15 + 15;
                let ry = y + 47;
                doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica').text('Invoice No.', rx, ry);
                doc.fillColor(TEXT_DARK).font('Helvetica').text(paymentAgainst, rx, ry, { width: halfW - 45, align: 'right' });
                doc.moveTo(rx, ry + 16).lineTo(rx + halfW - 30, ry + 16).lineWidth(0.5).stroke(BORDER_COLOR);

                ry += 25;
                doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica').text('Invoice Date', rx, ry);
                const invDate = registration.invoiceDate
                    ? new Date(registration.invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : (invoice?.invoice_date ? invoice.invoice_date : (invoice?.added ? new Date(invoice.added).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'));
                doc.fillColor(TEXT_DARK).font('Helvetica').text(invDate, rx, ry, { width: halfW - 45, align: 'right' });
                doc.moveTo(rx, ry + 16).lineTo(rx + halfW - 30, ry + 16).lineWidth(0.5).stroke(BORDER_COLOR);

                ry += 25;
                doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica').text('Invoice Value', rx, ry);
                doc.fillColor(TEXT_DARK).font('Helvetica').text(fmt(invVal), rx, ry, { width: halfW - 45, align: 'right' });

                y += 135;

                // PAYMENT DETAILS
                doc.circle(mx + 12, y + 8, 12).fill(NAVY);
                drawSvgIcon(mx + 12, y + 8, ic_wallet, 0.5, '#fff');
                doc.fillColor(NAVY).fontSize(10).font('Helvetica-Bold').text('PAYMENT DETAILS', mx + 32, y + 3);

                doc.roundedRect(mx, y + 30, mw, 140, 8).lineWidth(1).stroke(BORDER_COLOR);
                doc.rect(mx + 1, y + 31, 12, 138).fill(NAVY);
                doc.rect(mx + 13, y + 31, mw - 14, 138).fill('#f8fafc');

                const payRows = [
                    { l: 'AMOUNT RECEIVED', v: fmt(m.amount || 0) },
                    { l: 'PAYMENT MODE', v: String(m.method || m.paymentMode || registration.paymentMode || 'N/A').toUpperCase() },
                    { l: 'UTR / TRANSACTION NO.', v: m.transactionId || m.razorpayPaymentId || registration.paymentId || 'N/A' },
                    { l: 'PAYMENT DATE', v: formattedDate },
                    { l: 'BALANCE OUTSTANDING', v: fmt(registration.balanceAmount || 0) }
                ];

                let py = y + 47;
                payRows.forEach((r, i) => {
                    doc.circle(mx + 30, py + 4, 8).fill(NAVY);
                    doc.circle(mx + 30, py + 4, 2.5).fill('#fff'); // Clean dot

                    doc.fillColor(TEXT_DARK).fontSize(9).font('Helvetica-Bold').text(r.l, mx + 45, py);
                    doc.font('Helvetica').fontSize(11).text(r.v, mx, py - 2, { width: mw - 20, align: 'right' });
                    if (i < 4) doc.moveTo(mx + 45, py + 18).lineTo(mx + mw - 20, py + 18).lineWidth(0.5).stroke(BORDER_COLOR);
                    py += 24;
                });

                y += 195;

                // RECEIVED AMOUNT & REMARKS
                // Left Box: Blue Background
                doc.roundedRect(mx, y, halfW - 10, 95, 8).fill(NAVY);

                // Vertical divider line
                doc.moveTo(mx + halfW + 2, y + 5).lineTo(mx + halfW + 2, y + 90).lineWidth(1).stroke('#e2e8f0');

                // Compute Layout for Left Box
                const numStr = `${isUSD ? '$' : 'Rs.'} ${valFmt(m.amount || 0)}/-`;
                doc.fontSize(22).font('Helvetica-Bold');
                const numW = doc.widthOfString(numStr);
                doc.fontSize(9);
                const titleW = doc.widthOfString('RECEIVED AMOUNT');
                const textBlockW = Math.max(titleW, numW);

                const gap = 15;
                const outerR = 20;
                const innerR = 16;
                const totalW = (outerR * 2) + gap + textBlockW;

                const startX = mx + (halfW - 10 - totalW) / 2 - 15; // Shifted left for optical balance
                const cy = y + 40; // Shifted up so 3-line wrapped text breathes

                // Double Ring Circle
                const circleX = startX + outerR;
                doc.circle(circleX, cy, outerR).lineWidth(1.2).stroke('#fff');
                doc.circle(circleX, cy, innerR).fill('#fff');

                // Inner Circle Icon (Rs. or USD)
                doc.fillColor(NAVY).fontSize(15).font('Helvetica-Bold').text(isUSD ? '$' : 'Rs.', circleX - innerR, cy - 5, { width: innerR * 2, align: 'center' });

                // Text Block
                const textX = startX + (outerR * 2) + gap;

                // 'RECEIVED AMOUNT'
                doc.fillColor('#fff').fontSize(9).font('Helvetica-Bold').text('RECEIVED AMOUNT', textX, cy - 24);

                // Amount String
                doc.fillColor('#fff').fontSize(22).font('Helvetica-Bold').text(numStr, textX, cy - 11);

                // Words
                const wordAmt = inWords(m.amount || 0);
                const curWord = isUSD ? 'Dollars' : 'Rupees';
                const availableW = (mx + halfW - 10) - textX - 10;
                doc.fillColor('#fff').fontSize(10).font('Helvetica-Oblique').text(`(${curWord} ${wordAmt})`, textX, cy + 14, { width: availableW });

                // Right Box: Remarks
                const remarksX = mx + halfW + 15;
                doc.circle(remarksX + 10, y + 10, 10).fill(NAVY);
                drawSvgIcon(remarksX + 10, y + 10, ic_doc, 0.45, '#fff');

                doc.fillColor(NAVY).fontSize(10).font('Helvetica-Bold').text('REMARKS', remarksX + 26, y + 5);

                doc.fillColor(TEXT_DARK).fontSize(9).font('Helvetica').text('Received towards participation in the', remarksX, y + 30);
                doc.font('Helvetica-Bold').text('9th International Health & Wellness Expo', remarksX, y + 45);
                doc.text('(IHWE Global Edition)', remarksX, y + 60, { continued: true }).font('Helvetica').text(' scheduled at Pragati Maidan, New Delhi.');

                y += 135;

                // Footer: Thank you & Stamp
                doc.font('Helvetica-Oblique').fontSize(22).fillColor(NAVY).text('Thank You!', mx, y);
                doc.font('Helvetica').fontSize(10).fillColor(TEXT_DARK).text('We appreciate your trust.', mx, y + 25);
                doc.moveTo(mx, y + 45).lineTo(mx + 130, y + 45).lineWidth(1).stroke(BORDER_COLOR);

                const companyName = settings?.companyName || 'Namo Gange Wellness Pvt. Ltd.';
                doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY).text(`For ${companyName}`, mx + halfW + 15, y, { width: halfW, align: 'center' });

                try {
                    const sigY = y + 15;
                    const centerBox = mx + halfW + 15 + (halfW / 2);

                    if (settings?.companyStamp) {
                        const stampP = path.resolve(__dirname, '..', settings.companyStamp.replace(/^\//, ''));
                        if (fs.existsSync(stampP)) {
                            doc.image(stampP, centerBox - 70, sigY + 5, { fit: [60, 60], align: 'center' });
                        }
                    }
                    if (settings?.authorizedSignature) {
                        const sigP = path.resolve(__dirname, '..', settings.authorizedSignature.replace(/^\//, ''));
                        if (fs.existsSync(sigP)) {
                            doc.image(sigP, centerBox + 10, sigY + 10, { fit: [80, 50], align: 'center' });
                        }
                    }
                } catch (e) { console.log('Error drawing stamp/sig:', e); }

                // Shifted down to y+90 to clear the 60px height of the stamp
                doc.moveTo(mx + halfW + 15 + 40, y + 90).lineTo(mx + halfW + 15 + halfW - 40, y + 90).lineWidth(0.5).stroke(BORDER_COLOR);
                doc.font('Helvetica-Bold').fontSize(9).fillColor(TEXT_DARK).text('Authorized Signatory', mx + halfW + 15, y + 95, { width: halfW, align: 'center' });

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
