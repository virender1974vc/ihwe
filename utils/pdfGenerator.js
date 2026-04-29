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
    // If caller already passed explicit paths, use them
    if (optionsHeaderImage && fs.existsSync(optionsHeaderImage)) {
        return { headerPath: optionsHeaderImage, footerPath: optionsFooterImage || null };
    }

    // Try to load from Settings model (emailTemplateHeader / emailTemplateFooter fields)
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
                // Resolve header/footer images dynamically
                const { headerPath, footerPath } = await resolveHeaderFooterPaths(
                    options.headerImage,
                    options.footerImage
                );

                const settings = await Settings.findOne();
                const doc = new PDFDocument({ margin: 0, size: 'A4' });
                const paymentIndex = options.paymentIndex !== undefined ? options.paymentIndex : -1;
                const suffix = paymentIndex >= 0 ? `_P${paymentIndex + 1}` : '';
                const fileName = `receipt_${registration.registrationId || registration._id}${suffix}_${Date.now()}.pdf`;
                const filePath = path.join(TEMP_DIR, fileName);
                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                const pageW = doc.page.width;
                const p = registration.participation || {};
                const paymentHistoryEntry = paymentIndex >= 0 && registration.paymentHistory?.[paymentIndex]
                    ? registration.paymentHistory[paymentIndex]
                    : null;
                const m = paymentHistoryEntry || registration.manualPaymentDetails || {};
                const fb = registration.financeBreakdown || {};
                const cur = p.currency === 'USD' ? 'USD ' : 'INR ';
                const fmt = (n) => `${cur}${Number(n || 0).toLocaleString('en-IN')}`;
                // --- Generate Receipt Number ---
                const Counter = require('../models/visitor/CounterModel');
                const year = new Date().getFullYear();
                let rNo = registration.customReceiptNo;
                if (!rNo) {
                    const counter = await Counter.findOneAndUpdate(
                        { type: `receipt-ngw-${year}` },
                        { $inc: { seq: 1 } },
                        { upsert: true, new: true }
                    );
                    rNo = `NGW/IHWE/${year}/${String(counter.seq).padStart(3, '0')}`;
                    await registration.constructor.findByIdAndUpdate(registration._id, { customReceiptNo: rNo });
                }

                this._headerImg(doc, headerPath);
                let y = doc.y;
                const hasCustomHeader = !!headerPath;
                if (!hasCustomHeader) {
                    const addr = settings?.companyAddress || '12/51, Site 2, Sunrise Industrial Area, Mohan Nagar, Ghaziabad - 200107, UP, India';
                    doc.fillColor(GRAY).fontSize(8).font('Helvetica')
                        .text(addr, 40, y, { width: pageW - 80, align: 'center' });

                    const addrHeight = doc.heightOfString(addr, { width: pageW - 80 });
                    y += addrHeight + 4;

                    doc.text(`GSTIN: ${settings?.companyGst || 'N/A'}  |  CIN: ${settings?.companyCin || 'N/A'}`, 40, y, { width: pageW - 80, align: 'center' });
                    y += 18;
                } else {
                    y += 10;
                }

                // ── Title strip ──
                doc.rect(40, y, pageW - 80, 30).fill(BLUE_NAVY);
                doc.fillColor(WHITE).fontSize(16).font('Helvetica-Bold')
                    .text('PAYMENT RECEIPT', 40, y + 8, { width: pageW - 80, align: 'center', characterSpacing: 1 });
                y += 45;

                // ── Receipt Meta ──
                doc.fillColor(BLUE_NAVY).fontSize(9).font('Helvetica-Bold').text(`Receipt No.: ${rNo}`, 40, y);
                doc.fillColor(GRAY).fontSize(9).font('Helvetica').text(`Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 40, y, { width: pageW - 80, align: 'right' });
                y += 25;

                // ── Client Information ──
                doc.rect(40, y, 160, 18).fill(BLUE_NAVY);
                doc.fillColor(WHITE).fontSize(9).font('Helvetica-Bold').text('Client Information', 45, y + 5);
                y += 25;

                const clientRows = [
                    { label: 'Client Name:', value: registration.exhibitorName },
                    { label: 'Contact Person:', value: `${registration.contact1?.title || ''} ${registration.contact1?.firstName || ''} ${registration.contact1?.lastName || ''}`.trim() },
                    { label: 'Mobile No.:', value: registration.contact1?.mobile || 'N/A' },
                    { label: 'Email ID:', value: registration.contact1?.email || 'N/A' },
                    { label: 'Address:', value: `${registration.address || ''}, ${registration.city || ''}, ${registration.state || ''}, ${registration.country || ''}`.trim() },
                ];
                clientRows.forEach(row => {
                    this._label(doc, row.label, 60, y, 100);
                    this._value(doc, row.value, 160, y, pageW - 200);
                    y += 18;
                    this._line(doc, 60, y - 4, pageW - 40, '#f1f5f9');
                });
                y += 15;

                // ── Two Column: Booking & Financial ──
                const bookingY = y;
                // LEFT: Booking Details
                doc.rect(40, y, 160, 18).fill(BLUE_NAVY);
                doc.fillColor(WHITE).fontSize(9).font('Helvetica-Bold').text('Booking Details', 45, y + 5);
                y += 25;
                const bookingRows = [
                    { label: 'Event:', value: registration.eventId?.name || 'IHWE 2026' },
                    { label: 'Stall Booking No.:', value: registration.registrationId || 'N/A' },
                    { label: 'Stall Size:', value: `${p.stallSize || 0} Sq. Meter` },
                    { label: 'Rate per Sq. Meter:', value: fmt(p.rate) },
                    { label: 'Stall Number:', value: p.stallFor || 'N/A' },
                ];
                bookingRows.forEach(row => {
                    this._label(doc, row.label, 60, y, 100);
                    this._value(doc, row.value, 160, y, 140);
                    y += 18;
                    this._line(doc, 60, y - 4, 300, '#f1f5f9');
                });
                let fy = bookingY;
                const fx = 320;
                const fw = pageW - fx - 40;
                doc.rect(fx, fy, fw, 18).fill(BLUE_NAVY);
                doc.fillColor(WHITE).fontSize(9).font('Helvetica-Bold').text('Financial Summary', fx + 5, fy + 5);
                fy += 25;

                const subtotalVal = fb.subtotal || p.amount || 0;
                const gstVal = fb.gstAmount || Math.round(subtotalVal * 0.18);
                const tdsVal = fb.tdsAmount || Math.round(subtotalVal * (registration.chosenTdsPercent || 0) / 100);
                const netVal = fb.netPayable || (subtotalVal + gstVal - tdsVal);
                const grossVal = fb.grossAmount || subtotalVal;
                const invoiceTotalVal = subtotalVal + gstVal;

                const summaryRows = [
                    { label: `Total Stall Cost (${fmt(p.rate)} x ${p.stallSize} Sqm)`, value: fmt(grossVal), bg: LGRAY },
                ];

                if (fb.stallDiscountAmount > 0) {
                    summaryRows.push({ label: `Less: Stall Discount (${fb.stallDiscountPercent || 0}%)`, value: `- ${fmt(fb.stallDiscountAmount)}`, bg: WHITE, color: BLUE_NAVY });
                }

                if (fb.discountAmount > 0) {
                    summaryRows.push({ label: `Less: Full Payment Discount (${fb.discountPercent || 0}%)`, value: `- ${fmt(fb.discountAmount)}`, bg: WHITE, color: BLUE_NAVY });
                }

                summaryRows.push(
                    { label: 'Subtotal (Taxable Value)', value: fmt(subtotalVal), bg: LGRAY, bold: true },
                    { label: 'Add: GST @ 18%', value: `+ ${fmt(gstVal)}`, bg: WHITE, color: BLUE_NAVY },
                );
                summaryRows.forEach(row => {
                    doc.rect(fx, fy, fw, 18).fill(row.bg);
                    doc.fillColor(BLUE_NAVY).fontSize(8).font(row.bold ? 'Helvetica-Bold' : 'Helvetica')
                        .text(row.label, fx + 6, fy + 5, { width: fw * 0.65 });
                    doc.fillColor(row.color || DARK).fontSize(8).font('Helvetica-Bold')
                        .text(row.value, fx + fw * 0.65, fy + 5, { width: fw * 0.35 - 6, align: 'right' });
                    fy += 19;
                });

                doc.rect(fx, fy, fw, 1).fill(BLUE_NAVY);
                fy += 4;
                const contractTotal = invoiceTotalVal;
                doc.fillColor(GRAY).fontSize(7).font('Helvetica-Bold').text('CONTRACT TOTAL (Incl. GST)', fx + 6, fy, { width: fw * 0.65 });
                doc.fillColor(DARK).fontSize(8).font('Helvetica-Bold').text(fmt(contractTotal), fx + fw * 0.65, fy, { width: fw * 0.35 - 6, align: 'right' });
                fy += 16;
                this._line(doc, fx, fy, fx + fw, '#e5e7eb');
                fy += 6;
                if (tdsVal > 0) {
                    doc.rect(fx, fy, fw, 18).fill(LGRAY);
                    doc.fillColor(BLUE_NAVY).fontSize(8).font('Helvetica').text(`Less: TDS @ ${registration.chosenTdsPercent || 0}%`, fx + 6, fy + 5, { width: fw * 0.65 });
                    doc.fillColor('#dc2626').fontSize(8).font('Helvetica-Bold').text(`- ${fmt(tdsVal)}`, fx + fw * 0.65, fy + 5, { width: fw * 0.35 - 6, align: 'right' });
                    fy += 24;
                }

                const history = registration.paymentHistory || [];
                const latestPayment = history.length > 0 ? history[history.length - 1] : { amount: registration.amountPaid };
                const priorPaid = registration.amountPaid - latestPayment.amount;

                if (priorPaid > 0) {
                    doc.fillColor(GRAY).fontSize(7).font('Helvetica-Bold').text('ALREADY RECEIVED (PRIOR)', fx + 6, fy, { width: fw * 0.55 });
                    doc.fillColor(DARK).fontSize(8).font('Helvetica-Bold').text(fmt(priorPaid), fx + fw * 0.55, fy, { width: fw * 0.45 - 6, align: 'right' });
                    fy += 14;
                }

                doc.rect(fx, fy, fw, 24).fill('#fef3c7');
                doc.fillColor(BLUE_NAVY).fontSize(10).font('Helvetica-Bold')
                    .text('RECEIVED NOW', fx + 6, fy + 7, { width: fw * 0.55 })
                    .text(fmt(latestPayment.amount), fx + fw * 0.55, fy + 7, { width: fw * 0.45 - 6, align: 'right' });
                fy += 28;

                const balanceVal = registration.balanceAmount || 0;
                doc.rect(fx, fy, fw, 22).fill('#fef2f2');
                doc.fillColor('#b91c1c').fontSize(9).font('Helvetica-Bold')
                    .text('BALANCE REMAINING', fx + 6, fy + 7, { width: fw * 0.55 })
                    .text(fmt(balanceVal), fx + fw * 0.55, fy + 7, { width: fw * 0.45 - 6, align: 'right' });
                fy += 32;

                // ── Payment Details ──
                y = Math.max(y, fy + 20);
                doc.rect(40, y, 160, 18).fill(BLUE_NAVY);
                doc.fillColor(WHITE).fontSize(9).font('Helvetica-Bold').text('Payment Details', 45, y + 5);
                y += 25;
                const payRows = [
                    { label: 'Payment Mode:', value: (latestPayment.paymentMode || registration.paymentMode || 'N/A').toUpperCase() },
                    { label: 'Transaction / Reference No.:', value: latestPayment.transactionId || m.transactionId || registration.paymentId || 'N/A' },
                    { label: 'Total Paid (Cumulative):', value: fmt(registration.amountPaid) },
                    { label: 'Payment Date:', value: new Date(latestPayment.paidAt || m.paidAt || registration.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) },
                ];
                payRows.forEach(row => {
                    this._label(doc, row.label, 60, y, 140);
                    this._value(doc, row.value, 200, y, pageW - 240);
                    y += 18;
                    this._line(doc, 60, y - 4, pageW - 40, '#f1f5f9');
                });
                const endPaymentY = y;

                // ── Declaration ──
                y = endPaymentY + 30;
                doc.rect(40, y, 75, 18).fill(BLUE_NAVY);
                doc.fillColor(WHITE).fontSize(9).font('Helvetica-Bold').text('Declaration', 45, y + 5);
                y += 25;
                const isFull = registration.balanceAmount <= 1;
                const decs = [
                    isFull ? 'Full payment received. Booking confirmed.' : 'Partial payment received. Booking held until balance',
                    'Receipt is valid subject to realization of funds.',
                    'This receipt is non-transferable without prior written approval.'
                ];
                decs.forEach(dec => {
                    doc.fillColor(ORANGE).fontSize(10).text('-', 40, y);
                    doc.fillColor(GRAY).fontSize(8).font('Helvetica').text(dec, 55, y, { width: 340 });
                    y += 14;
                });

                // ── Signature & Stamp ──
                let sigY = y + 20;
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
                this._line(doc, sigX, sigY, sigX + 220, BLUE_NAVY);
                doc.fillColor(DARK).fontSize(8).font('Helvetica-Bold').text('Authorized Signatory', sigX, sigY + 5, { width: 220, align: 'center' });

                // ── QR Code ──
                const qrX = pageW - 120, qrY = y + 15;
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

    async generateAccessoryReceipt(order, registration) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 0, size: 'A4' });
                const filePath = path.join(TEMP_DIR, `acc_receipt_${order._id}_${Date.now()}.pdf`);
                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                const pageW = doc.page.width;
                const fmt = (n) => `INR ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

                this._headerImg(doc);
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
}

module.exports = new PDFGenerator();
