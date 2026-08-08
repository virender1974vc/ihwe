// const PDFDocument = require('pdfkit');
// const fs = require('fs');
// const path = require('path');
// const QRCode = require('qrcode');
// const Settings = require('../models/Settings');

// const TEMP_DIR = path.join(__dirname, '..', 'temp');
// if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
// function getTempPdfUrl(filePath) {
//     const fileName = path.basename(filePath);
//     const backendUrl = (process.env.BACKEND_URL || process.env.SITE_URL || 'http://localhost:5000').replace(/\/$/, '');
//     return `${backendUrl}/temp/${fileName}`;
// }

// // Resolve header/footer image paths dynamically from Settings, with hardcoded filenames as fallback
// async function resolveHeaderFooterPaths(optionsHeaderImage, optionsFooterImage) {
//     if (optionsHeaderImage && fs.existsSync(optionsHeaderImage)) {
//         return { headerPath: optionsHeaderImage, footerPath: optionsFooterImage || null };
//     }
//     try {
//         const settings = await Settings.findOne().lean();
//         const uploadsBase = path.join(__dirname, '..');

//         let headerPath = null;
//         let footerPath = null;

//         // Settings may store relative paths like /uploads/email-templates/filename.jpg
//         if (settings?.emailTemplateHeader) {
//             const rel = settings.emailTemplateHeader.replace(/^\//, '');
//             const candidate = path.join(uploadsBase, rel);
//             if (fs.existsSync(candidate)) headerPath = candidate;
//         }
//         if (settings?.emailTemplateFooter) {
//             const rel = settings.emailTemplateFooter.replace(/^\//, '');
//             const candidate = path.join(uploadsBase, rel);
//             if (fs.existsSync(candidate)) footerPath = candidate;
//         }

//         // Fallback: scan uploads/email-templates for any jpeg/jpg/png files
//         if (!headerPath || !footerPath) {
//             const emailTemplatesDir = path.join(uploadsBase, 'uploads', 'email-templates');
//             if (fs.existsSync(emailTemplatesDir)) {
//                 const files = fs.readdirSync(emailTemplatesDir)
//                     .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
//                     .sort();
//                 if (!headerPath && files.length > 0) {
//                     headerPath = path.join(emailTemplatesDir, files[0]);
//                 }
//                 if (!footerPath && files.length > 1) {
//                     footerPath = path.join(emailTemplatesDir, files[files.length - 1]);
//                 }
//             }
//         }

//         return { headerPath, footerPath };
//     } catch (e) {
//         return { headerPath: null, footerPath: null };
//     }
// }

// const GREEN = '#23471d';
// const GREEN_DEEP = '#1a3a14';
// const BLUE_NAVY = '#1e3a8a';
// const BLUE_LIGHT = '#eff6ff';
// const ORANGE = '#d26019';
// const GRAY = '#6b7280';
// const LGRAY = '#f3f4f6';
// const DARK = '#111827';
// const WHITE = '#ffffff';

// class PDFGenerator {
//     _headerImg(doc, customPath, isReceipt = false) {
//         const headerPath = customPath || null;
//         const topPadding = 10;
//         const sidePadding = isReceipt ? 0 : 40;
//         if (headerPath && fs.existsSync(headerPath)) {
//             const imgW = doc.page.width - (sidePadding * 2);
//             try {
//                 const img = doc.openImage(headerPath);
//                 const scale = imgW / img.width;
//                 const imgH = img.height * scale;
//                 doc.image(img, sidePadding, topPadding, { width: imgW });
//                 doc.y = topPadding + imgH + 10;
//             } catch (e) {
//                 doc.image(headerPath, sidePadding, topPadding, { width: imgW });
//                 doc.y = topPadding + 110 + 10;
//             }
//         } else {
//             doc.rect(0, 0, doc.page.width, 80).fill(GREEN);
//             doc.fillColor(WHITE).fontSize(18).font('Helvetica-Bold')
//                 .text('9th International Health & Wellness Expo 2026', 40, 28, { width: doc.page.width - 80, align: 'center' });
//             doc.y = 90;
//         }
//     }

//     _footerImg(doc, customPath) {
//         const pageH = doc.page.height;
//         const pageW = doc.page.width;
//         const footerPath = customPath || null;
//         if (footerPath && fs.existsSync(footerPath)) {
//             const fH = 70;
//             doc.image(footerPath, 0, pageH - fH, { width: pageW });
//         } else {
//             doc.rect(0, pageH - 40, pageW, 40).fill(GREEN);
//             doc.fillColor(WHITE).fontSize(8).font('Helvetica')
//                 .text('© 2026 IHWE | Namo Gange Wellness Pvt. Ltd.', 0, pageH - 24, { width: pageW, align: 'center' });
//         }
//     }

//     _line(doc, x1, y, x2, color = '#e5e7eb', w = 0.5) {
//         doc.moveTo(x1, y).lineTo(x2, y).lineWidth(w).stroke(color);
//     }

//     _label(doc, text, x, y, w) {
//         doc.fillColor(GRAY).fontSize(7).font('Helvetica-Bold')
//             .text(text.toUpperCase(), x, y, { width: w, characterSpacing: 0.3 });
//     }

//     _value(doc, text, x, y, w, opts = {}) {
//         doc.fillColor(opts.color || DARK).fontSize(opts.size || 9).font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
//             .text(text || 'N/A', x, y, { width: w, ...opts });
//     }

//     _tableRow(doc, cols, y, bg) {
//         const pageW = doc.page.width;
//         if (bg) doc.rect(40, y, pageW - 80, 18).fill(bg);
//         let x = 40;
//         cols.forEach(({ text, w, align, bold, color }) => {
//             doc.fillColor(color || DARK).fontSize(8).font(bold ? 'Helvetica-Bold' : 'Helvetica')
//                 .text(text || '', x + 4, y + 4, { width: w - 8, align: align || 'left' });
//             x += w;
//         });
//         return y + 18;
//     }
//     _measureRowHeight(doc, cols, minHeight = 18) {
//         let maxHeight = minHeight;
//         cols.forEach(({ text, w, bold }) => {
//             doc.fontSize(8).font(bold ? 'Helvetica-Bold' : 'Helvetica');
//             const h = doc.heightOfString(String(text ?? ''), { width: w - 8 });
//             maxHeight = Math.max(maxHeight, h + 8);
//         });
//         return maxHeight;
//     }
//     _wrappedTableRow(doc, cols, y, bg) {
//         const pageW = doc.page.width;
//         const rowHeight = this._measureRowHeight(doc, cols);
//         if (bg) doc.rect(40, y, pageW - 80, rowHeight).fill(bg);
//         let x = 40;
//         cols.forEach(({ text, w, align, bold, color }) => {
//             doc.fillColor(color || DARK).fontSize(8).font(bold ? 'Helvetica-Bold' : 'Helvetica')
//                 .text(text || '', x + 4, y + 4, { width: w - 8, align: align || 'left' });
//             x += w;
//         });
//         return y + rowHeight;
//     }
//     async generateRegistrationForm(registration, options = {}) {
//         return new Promise(async (resolve, reject) => {
//             try {
//                 // Resolve header/footer images dynamically
//                 const { headerPath, footerPath } = await resolveHeaderFooterPaths(
//                     options.headerImage,
//                     options.footerImage
//                 );

//                 const doc = new PDFDocument({ margin: 0, size: 'A4' });
//                 const filePath = path.join(TEMP_DIR, `registration_${registration._id}.pdf`);
//                 const stream = fs.createWriteStream(filePath);
//                 doc.pipe(stream);

//                 const pageW = doc.page.width;
//                 const p = registration.participation || {};
//                 const c1 = registration.contact1 || {};
//                 const cur = p.currency === 'USD' ? 'USD ' : 'INR ';
//                 const fmt = (n) => `${cur}${Number(n || 0).toLocaleString('en-IN')}`;

//                 // ── Header image ──
//                 this._headerImg(doc, headerPath);
//                 let y = doc.y;

//                 // ── Document title strip ──
//                 doc.rect(40, y, pageW - 80, 22).fill(GREEN);
//                 doc.fillColor(WHITE).fontSize(11).font('Helvetica-Bold')
//                     .text('EXHIBITOR REGISTRATION', 40, y + 6, { width: pageW - 80, align: 'center' });
//                 y += 30;

//                 // ── Meta row ──
//                 doc.fillColor(GRAY).fontSize(8).font('Helvetica')
//                     .text(`Reg ID: ${registration.registrationId || 'N/A'}`, 40, y)
//                     .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 40, y, { width: pageW - 80, align: 'right' });
//                 y += 16;
//                 this._line(doc, 40, y, pageW - 40);
//                 y += 8;

//                 // ── Two-column: IHWE details | Client details ──
//                 const colW = (pageW - 100) / 2;
//                 const lx = 40, rx = 60 + colW;

//                 const Settings = require('../models/Settings');
//                 const settings = await Settings.findOne();

//                 // Left box - IHWE / FROM
//                 doc.rect(lx, y, colW, 125).lineWidth(0.5).stroke('#e5e7eb');
//                 this._label(doc, 'From', lx + 8, y + 8, colW - 16);
//                 doc.fillColor(GREEN).fontSize(10).font('Helvetica-Bold')
//                     .text(settings?.companyName || 'Namo Gange Wellness Pvt. Ltd.', lx + 8, y + 20, { width: colW - 16 });
//                 doc.fillColor(GRAY).fontSize(8).font('Helvetica')
//                     .text(settings?.companyAddress || '12/29, Site-II, Loni Road, Industrial Area, Mohan Nagar, Ghaziabad, India', lx + 8, y + 36, { width: colW - 16 });

//                 let currentLeftY = Math.max(doc.y + 6, y + 72);

//                 doc.text(`GST: ${settings?.companyGst || 'N/A'}`, lx + 8, currentLeftY, { width: colW - 16 });
//                 doc.text(`CIN: ${settings?.companyCin || 'N/A'}`, lx + 8, currentLeftY + 12, { width: colW - 16 });
//                 doc.text('info@namogangewellness.com  |  www.ihwe.in', lx + 8, currentLeftY + 24, { width: colW - 16 });

//                 // Right box - Client / TO
//                 doc.rect(rx, y, colW, 125).lineWidth(0.5).stroke('#e5e7eb');
//                 this._label(doc, 'To (Exhibitor)', rx + 8, y + 8, colW - 16);
//                 doc.fillColor(ORANGE).fontSize(10).font('Helvetica-Bold')
//                     .text(registration.exhibitorName || 'N/A', rx + 8, y + 20, { width: colW - 16 });
//                 doc.fillColor(GRAY).fontSize(8).font('Helvetica')
//                     .text(registration.typeOfBusiness || '', rx + 8, y + 34, { width: colW - 16 })
//                     .text([registration.address, registration.city, registration.state].filter(Boolean).join(', '), rx + 8, y + 46, { width: colW - 16 })
//                     .text(`${registration.country || ''} ${registration.pincode ? '– ' + registration.pincode : ''}`, rx + 8, y + 58, { width: colW - 16 })
//                     .text(c1.mobile || '', rx + 8, y + 70, { width: colW - 16 })
//                     .text(c1.email || '', rx + 8, y + 82, { width: colW - 16 });

//                 y += 125;
//                 const infoW = (pageW - 80) / 6;
//                 const infos = [
//                     { label: 'Stall No.', value: p.stallFor || 'N/A' },
//                     { label: 'Stall Type', value: p.stallType || 'N/A' },
//                     { label: 'Scheme', value: p.stallScheme || 'N/A' },
//                     { label: 'Dimension', value: p.dimension || 'N/A' },
//                     { label: 'Stall Size', value: p.stallSize ? `${p.stallSize} SQM` : 'N/A' },
//                     { label: 'Event', value: registration.eventId?.name || '9IHWE 2026' },
//                 ];
//                 infos.forEach((info, i) => {
//                     const ix = 40 + i * infoW;
//                     doc.rect(ix, y, infoW - 4, 36).fill(LGRAY);
//                     this._label(doc, info.label, ix + 6, y + 6, infoW - 12);
//                     doc.fillColor(GREEN).fontSize(8).font('Helvetica-Bold')
//                         .text(info.value, ix + 6, y + 18, { width: infoW - 12 });
//                 });
//                 y += 44;

//                 // ── Items table ──
//                 const tW = pageW - 80;
//                 const cols = [
//                     { label: 'Description', w: tW * 0.40 },
//                     { label: 'Dimensions', w: tW * 0.15 },
//                     { label: 'Scheme', w: tW * 0.15 },
//                     { label: 'Rate/SQM', w: tW * 0.15, align: 'right' },
//                     { label: 'Amount', w: tW * 0.15, align: 'right' },
//                 ];

//                 // Table header
//                 doc.rect(40, y, tW, 18).fill(DARK);
//                 let tx = 40;
//                 cols.forEach(col => {
//                     doc.fillColor(WHITE).fontSize(8).font('Helvetica-Bold')
//                         .text(col.label, tx + 4, y + 5, { width: col.w - 8, align: col.align || 'left' });
//                     tx += col.w;
//                 });
//                 y += 18;
//                 y = this._tableRow(doc, [
//                     { text: `${p.stallType || 'Shell Space'} – Stall ${p.stallFor || 'N/A'}`, w: tW * 0.40 },
//                     { text: p.dimension || 'N/A', w: tW * 0.15 },
//                     { text: p.stallScheme || 'N/A', w: tW * 0.15 },
//                     { text: fmt(p.rate), w: tW * 0.15, align: 'right' },
//                     { text: fmt(p.amount), w: tW * 0.15, align: 'right' },
//                 ], y, '#f9fafb');
//                 this._line(doc, 40, y, 40 + tW, '#e5e7eb');
//                 y += 4;

//                 // ── Summary box (right-aligned) ──
//                 const sumX = 40 + tW * 0.55;
//                 const sumW = tW * 0.45;
//                 const fb = registration.financeBreakdown || {};
//                 const subtotalVal = fb.subtotal || p.amount || 0;
//                 const gstVal = fb.gstAmount || Math.round(subtotalVal * 0.18);
//                 const tdsVal = fb.tdsAmount || Math.round(subtotalVal * (registration.chosenTdsPercent || 0) / 100);
//                 const netVal = fb.netPayable || (subtotalVal + gstVal - tdsVal);
//                 const grossVal = fb.grossAmount || subtotalVal;

//                 const summaryRows = [
//                     { label: 'Gross Amount', value: fmt(grossVal) },
//                 ];

//                 if (fb.stallDiscountAmount > 0) {
//                     summaryRows.push({ label: `Less: Stall Discount (${fb.stallDiscountPercent || 0}%)`, value: `- ${fmt(fb.stallDiscountAmount)}` });
//                 }
//                 const isFullPlan = registration.paymentPlanType === 'full' || fb.isFullPayment === true;
//                 if (isFullPlan && fb.discountAmount > 0) {
//                     summaryRows.push({ label: `Less: Full Payment Discount (${fb.discountPercent || 0}%)`, value: `- ${fmt(fb.discountAmount)}` });
//                 }

//                 if (fb.stallDiscountAmount > 0 || (isFullPlan && fb.discountAmount > 0)) {
//                     summaryRows.push({ label: 'Subtotal (Taxable Value)', value: fmt(subtotalVal) });
//                 }

//                 summaryRows.push({ label: `GST @ ${p.gstPercent || 18}%`, value: `+ ${fmt(gstVal)}` });

//                 if (tdsVal > 0) {
//                     summaryRows.push({ label: `Less: TDS @ ${registration.chosenTdsPercent || 0}%`, value: `- ${fmt(tdsVal)}` });
//                 }

//                 summaryRows.forEach(row => {
//                     doc.fillColor(GRAY).fontSize(8).font('Helvetica')
//                         .text(row.label, sumX, y + 4, { width: sumW * 0.55 })
//                         .text(row.value, sumX + sumW * 0.55, y + 4, { width: sumW * 0.45, align: 'right' });
//                     y += 16;
//                 });
//                 this._line(doc, sumX, y, sumX + sumW, GREEN, 1);
//                 y += 4;
//                 doc.rect(sumX, y, sumW, 24).fill(GREEN);
//                 doc.fillColor(WHITE).fontSize(10).font('Helvetica-Bold')
//                     .text('GRAND TOTAL', sumX + 8, y + 7, { width: sumW * 0.5 })
//                     .text(fmt(fb.netPayable || netVal), sumX + sumW * 0.5, y + 7, { width: sumW * 0.5 - 8, align: 'right' });
//                 y += 32;

//                 // ── Contact & CRM ──
//                 this._line(doc, 40, y, pageW - 40);
//                 y += 8;
//                 const cW = (pageW - 80) / 4;
//                 [
//                     { label: 'Exhibitor Name (Co)', value: registration.exhibitorName || 'N/A' },
//                     { label: 'Authorized Person', value: `${c1.title || ''} ${c1.firstName || ''} ${c1.lastName || ''}`.trim() || 'N/A' },
//                     { label: 'Exhibitor Mobile No.', value: c1.mobile || 'N/A' },
//                     { label: 'Relationship Manager', value: registration.spokenWith || 'N/A' },
//                 ].forEach((item, i) => {
//                     this._label(doc, item.label, 40 + i * cW, y, cW - 8);
//                     this._value(doc, item.value, 40 + i * cW, y + 12, cW - 8);
//                 });
//                 y += 30;
//                 const statusColors = { pending: '#f59e0b', approved: '#22c55e', paid: GREEN, 'advance-paid': '#0891b2', confirmed: '#3b82f6', rejected: '#ef4444', 'payment-failed': '#dc2626' };
//                 doc.rect(40, y, 130, 22).fill(statusColors[registration.status] || GRAY);
//                 doc.fillColor(WHITE).fontSize(9).font('Helvetica-Bold')
//                     .text(`STATUS: ${(registration.status || 'PENDING').toUpperCase()}`, 40, y + 7, { width: 130, align: 'center' });

//                 // ── Signature & Stamp ──
//                 let sigY = y + 40;
//                 const sigX = 40;

//                 const sigPath = settings?.authorizedSignature ? path.resolve(__dirname, '..', settings.authorizedSignature.replace(/^\//, '')) : null;
//                 const stampPath = settings?.companyStamp ? path.resolve(__dirname, '..', settings.companyStamp.replace(/^\//, '')) : null;

//                 if (sigPath && fs.existsSync(sigPath)) {
//                     doc.image(sigPath, sigX + 10, sigY + 5, { height: 40 });
//                 }
//                 if (stampPath && fs.existsSync(stampPath)) {
//                     doc.image(stampPath, sigX + 130, sigY, { height: 50 });
//                 }
//                 sigY += 50;
//                 this._line(doc, sigX, sigY, sigX + 220, GREEN);
//                 doc.fillColor(DARK).fontSize(8).font('Helvetica-Bold').text('Authorized Signatory', sigX, sigY + 5, { width: 220, align: 'center' });

//                 // ── QR Code ──
//                 const qrX = pageW - 120, qrY = y + 35;
//                 try {
//                     const qrPayload = JSON.stringify({ registrationId: String(registration.registrationId || '').trim() });
//                     if (!registration.registrationId) throw new Error('Exhibitor registration ID is missing');
//                     const qrBuffer = await QRCode.toBuffer(qrPayload, { margin: 1, width: 80 });
//                     doc.image(qrBuffer, qrX, qrY, { width: 80 });
//                     doc.fillColor(GRAY).fontSize(7).text('Exhibitor Entry QR', qrX, qrY + 85, { width: 80, align: 'center' });
//                 } catch (qrErr) { console.error('QR Generate Error:', qrErr); }

//                 doc.end();
//                 stream.on('finish', () => {
//                     const publicUrl = getTempPdfUrl(filePath);
//                     resolve({ filePath, cloudUrl: publicUrl });
//                 });
//                 stream.on('error', reject);
//             } catch (err) { reject(err); }
//         });
//     }

//     // ─── Payment Receipt ──────────────────────────────────────────────────────

//     async generatePaymentSlip(registration, options = {}) {
//         return new Promise(async (resolve, reject) => {
//             try {
//                 const PaymentReceiptSettings = require('../models/PaymentReceiptSettings');
//                 const Event = require('../models/Event');
//                 const mongoose = require('mongoose');

//                 const doc = new PDFDocument({ margin: 0, size: 'A4' });

//                 const paymentIndex = options.paymentIndex !== undefined ? options.paymentIndex : -1;
//                 const suffix = paymentIndex >= 0 ? `_P${paymentIndex + 1}` : '';
//                 const safeReceiptBase = String(registration.registrationId || registration._id || 'receipt').replace(/[\\/:*?"<>|]+/g, '_');
//                 const fileName = `receipt_${safeReceiptBase}${suffix}_${Date.now()}.pdf`;
//                 const filePath = path.join(TEMP_DIR, fileName);
//                 const stream = fs.createWriteStream(filePath);
//                 doc.pipe(stream);

//                 const pageW = doc.page.width;
//                 const pageH = doc.page.height;
//                 const p = registration.participation || {};
//                 const c1 = registration.contact1 || {};
//                 const paymentHistoryEntry = paymentIndex >= 0 && registration.paymentHistory?.[paymentIndex] ? registration.paymentHistory[paymentIndex] : null;
//                 const m = paymentHistoryEntry || registration.manualPaymentDetails || {};
//                 const isUSD = p.currency === 'USD';

//                 const curStr = isUSD ? 'USD ' : '';
//                 const fmt = (n) => `${curStr}${Math.round(Number(n || 0)).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

//                 const Settings = require('../models/Settings');
//                 const settings = await Settings.findOne();

//                 let receiptSettings = await PaymentReceiptSettings.findOne();
//                 if (!receiptSettings) receiptSettings = new PaymentReceiptSettings({});

//                 const Invoice = require('../models/Invoice');
//                 const invoice = await Invoice.findOne({
//                     $or: [
//                         { companyId: registration.clientId || (registration._id ? registration._id.toString() : '') },
//                         { company_name: registration.exhibitorName }
//                     ]
//                 }).sort({ added: -1 }).lean();

//                 // Generate Receipt Number (unchanged logic — only the fallback prefix is now configurable)
//                 const Counter = require('../models/visitor/CounterModel');
//                 const year = new Date().getFullYear();
//                 let rNo = registration.customReceiptNo || registration.receiptNo;
//                 if (!rNo) {
//                     const counter = await Counter.findOneAndUpdate({ type: `receipt-ngw-${year}` }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' });
//                     rNo = `${receiptSettings.receiptNumberPrefix || 'PR/'}${String(year).slice(-2)}-${String(year + 1).slice(-2)}/${String(counter.seq).padStart(3, '0')}`;
//                     try {
//                         if (registration._id && typeof registration.constructor.findByIdAndUpdate === 'function') {
//                             await registration.constructor.findByIdAndUpdate(registration._id, { customReceiptNo: rNo });
//                         }
//                     } catch (e) { }
//                 }

//                 // Event info — registration.eventId usually isn't populated at the call sites
//                 // that hit this function, so resolve it defensively.
//                 let eventDoc = null;
//                 if (registration.eventId && typeof registration.eventId === 'object' && registration.eventId.name) {
//                     eventDoc = registration.eventId;
//                 } else if (registration.eventId && mongoose.Types.ObjectId.isValid(registration.eventId)) {
//                     try { eventDoc = await Event.findById(registration.eventId).lean(); } catch (e) { }
//                 }

//                 // ---- Colors & band sizes (admin-configurable via PaymentReceiptSettings) ----
//                 const clamp = (val, min, max, fallback) => {
//                     const n = Number(val);
//                     if (!Number.isFinite(n)) return fallback;
//                     return Math.min(max, Math.max(min, n));
//                 };
//                 const ORGANISER = receiptSettings.organiserBandColor || '#0b3974';
//                 const EXHIBITOR = receiptSettings.exhibitorBandColor || '#1a7a3c';
//                 const ACCENT = receiptSettings.accentColor || '#0b3974';
//                 const NOTE_COLOR = receiptSettings.noteColor || '#c2410c';
//                 const BORDER_COLOR = '#d1d5db';
//                 const TEXT_DARK = '#0f172a';
//                 const TEXT_MUTED = '#475569';

//                 const headerH = clamp(receiptSettings.headerBandHeight, 70, 140, 95);
//                 const eventH = clamp(receiptSettings.eventBandHeight, 60, 120, 85);
//                 const infoH = clamp(receiptSettings.infoBandHeight, 80, 160, 115);
//                 const footerH = clamp(receiptSettings.footerBandHeight, 60, 110, 85);
//                 const mx = clamp(receiptSettings.pageMarginX, 15, 50, 30);
//                 const sectionGap = clamp(receiptSettings.sectionGap, 0, 30, 8);
//                 const mw = pageW - mx * 2;

//                 // ---- Icon helpers ----
//                 // Reused as-is from the previous layout (already proven to render correctly).
//                 const drawSvgIcon = (cx, cy, pathData, scale = 0.5, color = '#fff') => {
//                     doc.save();
//                     doc.translate(cx - (12 * scale), cy - (12 * scale));
//                     doc.scale(scale);
//                     doc.path(pathData).fill(color);
//                     doc.restore();
//                 };
//                 const ic_doc = 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z';
//                 const ic_cal = 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z';
//                 const ic_user = 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z';
//                 const ic_rupee = 'M13.66,7c-0.19,1.13-0.89,2-2.14,2.54L15.34,16H12.9l-3.33-5.83H9.4V16H7.8v-5.83H6.06V8.65h1.74V7H6.06V5.48h3.33v1.51h1.15c0.55,0,0.92-0.27,0.92-0.82H6.06V4.65h7.6v1.51H10.4C10.74,6.47,11.2,6.6,11.72,6.6c0.81,0,1.38-0.34,1.52-1.13h2.15v1.52H13.66z';
//                 const ic_wallet = 'M21 7.28V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-2.28c.59-.35 1-.98 1-1.72V9c0-.74-.41-1.37-1-1.72zM20 9v6h-2.5V9H20zM7 9h8v2H7V9zm0 4h5v2H7v-2z';
//                 const ic_business = 'M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z';
//                 const ic_bell = 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z';
//                 const drawMailIcon = (cx, cy, r, color) => {
//                     doc.save();
//                     doc.rect(cx - r, cy - r * 0.7, r * 2, r * 1.4).lineWidth(0.8).stroke(color);
//                     doc.moveTo(cx - r, cy - r * 0.7).lineTo(cx, cy + r * 0.2).lineTo(cx + r, cy - r * 0.7).lineWidth(0.8).stroke(color);
//                     doc.restore();
//                 };
//                 const drawGlobeIcon = (cx, cy, r, color) => {
//                     doc.save();
//                     doc.circle(cx, cy, r).lineWidth(0.8).stroke(color);
//                     doc.ellipse(cx, cy, r * 0.45, r).lineWidth(0.6).stroke(color);
//                     doc.moveTo(cx - r, cy).lineTo(cx + r, cy).lineWidth(0.6).stroke(color);
//                     doc.restore();
//                 };
//                 const drawPhoneIcon = (cx, cy, r, color) => {
//                     doc.save();
//                     doc.roundedRect(cx - r * 0.7, cy - r, r * 1.4, r * 2, r * 0.3).lineWidth(0.8).stroke(color);
//                     doc.moveTo(cx - r * 0.2, cy - r * 0.6).lineTo(cx + r * 0.2, cy - r * 0.6).lineWidth(0.5).stroke(color);
//                     doc.circle(cx, cy + r * 0.6, r * 0.15).fillAndStroke(color, color);
//                     doc.restore();
//                 };
//                 const drawPinIcon = (cx, cy, r, color) => {
//                     doc.save();
//                     doc.circle(cx, cy - r * 0.2, r * 0.55).lineWidth(0.8).stroke(color);
//                     doc.moveTo(cx, cy + r * 0.3).lineTo(cx, cy + r).lineWidth(0.8).stroke(color);
//                     doc.restore();
//                 };
//                 const drawCalendarIcon = (cx, cy, r, color) => {
//                     doc.save();
//                     doc.roundedRect(cx - r * 0.8, cy - r * 0.6, r * 1.6, r * 1.6, r * 0.2).lineWidth(0.8).stroke(color);
//                     doc.moveTo(cx - r * 0.8, cy - r * 0.1).lineTo(cx + r * 0.8, cy - r * 0.1).lineWidth(0.8).stroke(color);
//                     doc.moveTo(cx - r * 0.4, cy - r * 0.9).lineTo(cx - r * 0.4, cy - r * 0.4).lineWidth(0.8).stroke(color);
//                     doc.moveTo(cx + r * 0.4, cy - r * 0.9).lineTo(cx + r * 0.4, cy - r * 0.4).lineWidth(0.8).stroke(color);
//                     doc.restore();
//                 };
//                 const drawStarIcon = (cx, cy, r, color) => {
//                     doc.save();
//                     const points = 5;
//                     const innerRadius = r * 0.4;
//                     const outerRadius = r * 0.9;
//                     let path = '';
//                     for (let i = 0; i < points * 2; i++) {
//                         const radius = i % 2 === 0 ? outerRadius : innerRadius;
//                         const angle = (i * Math.PI) / points - Math.PI / 2;
//                         const x = cx + radius * Math.cos(angle);
//                         const y = cy + radius * Math.sin(angle);
//                         path += (i === 0 ? 'M' : 'L') + x + ',' + y;
//                     }
//                     doc.path(path + ' Z').lineWidth(0.8).stroke(color);
//                     doc.restore();
//                 };

//                 const formatDate = (value) => {
//                     if (!value) return 'N/A';
//                     const d = new Date(value);
//                     if (Number.isNaN(d.getTime())) return String(value);
//                     return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
//                 };
//                 const formattedDate = formatDate(m.paidAt || m.neft_date || registration.updatedAt || Date.now());
//                 const fmtEvDate = (d) => d ? formatDate(d) : '';
//                 const formatEventShortRange = (start, end) => {
//                     if (!start || !end) return '(21-23 August 2026)';
//                     const s = new Date(start);
//                     const e = new Date(end);
//                     if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return '(21-23 August 2026)';
//                     const monthYear = e.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
//                     return `(${s.getDate()}-${e.getDate()} ${monthYear})`;
//                 };
//                 const eventName = eventDoc?.name || '9th International Health & Wellness Expo, 2026';
//                 const dateStr = eventDoc?.startDate ? `${fmtEvDate(eventDoc.startDate)}${eventDoc.endDate ? ' - ' + fmtEvDate(eventDoc.endDate) : ''}` : '21 Aug 2026 - 23 Aug 2026';
//                 const eventSubDate = eventDoc?.startDate && eventDoc?.endDate ? formatEventShortRange(eventDoc.startDate, eventDoc.endDate) : '(21-23 August 2026)';
//                 const venueText = eventDoc?.location || 'Pragati Maidan, New Delhi - 110001, Delhi, India';
//                 const clean = (v, fallback = '-') => (v === undefined || v === null || String(v).trim() === '') ? fallback : String(v).trim();
//                 const fullName = (contact) => clean(contact?.name || `${contact?.title ? contact.title + ' ' : ''}${contact?.firstName || ''} ${contact?.lastName || ''}`.trim(), '');

//                 const Payment = require('../models/Payment');
//                 let accountPayment = null;
//                 if (paymentHistoryEntry?.accountPaymentId && mongoose.Types.ObjectId.isValid(paymentHistoryEntry.accountPaymentId)) {
//                     try { accountPayment = await Payment.findById(paymentHistoryEntry.accountPaymentId).lean(); } catch (e) { }
//                 }

//                 const paymentMode = clean(accountPayment?.payment_mode || m.method || m.paymentMode || registration.paymentMode, 'N/A').toUpperCase();
//                 const reference = clean(accountPayment?.utr_no || accountPayment?.cheque_no || accountPayment?.card_transaction_no || accountPayment?.wallet_transaction_no || accountPayment?.cash_receipt_no || m.transactionId || m.razorpayPaymentId || registration.paymentId, 'N/A');
//                 const totalPaid = Number(accountPayment?.amount_text || m.amount || registration.amountPaid || 0);
//                 const paymentDate = formatDate(accountPayment?.payment_date || accountPayment?.neft_date || m.paidAt || registration.updatedAt || Date.now());
//                 const receivedBank = clean(accountPayment?.neft_bank || accountPayment?.cheque_bank || accountPayment?.wallet_name || accountPayment?.card_name || accountPayment?.bankName, '-');
//                 const paymentAgainst = clean(registration.customInvoiceNo || registration.referenceInvoice || registration.invoiceNo || p.invoiceNo || invoice?.invoice_no || accountPayment?.invoice_id, 'N/A');
//                 const fb = registration.financeBreakdown || {};
//                 const invVal = Number(registration.receiptInvoiceAmount || fb.invoiceAmount || fb.totalAmount || p.total || invoice?.finalAmount || fb.netPayable || p.amount || 0);
//                 const stallAmount = Number(fb.subtotal || p.amount || Math.round(invVal / (1 + (Number(p.gstPercent || 18) / 100))) || 0);
//                 const grandTotal = Number(fb.netPayable || p.total || invVal || 0);
//                 const hasMsme = !!(registration.msme?.udyamRegNo || registration.msme?.udyamRegistrationNo || registration.msme?.udyamNo);
//                 const udyamNo = clean(registration.msme?.udyamRegNo || registration.msme?.udyamRegistrationNo || registration.msme?.udyamNo, '');
//                 const contactName = fullName(c1) || clean(registration.msme?.udyamContactPerson, 'Authorized Signatory');
//                 const clientEmail = clean(c1.email || registration.companyEmail || registration.msme?.udyamEmailId, '-');
//                 const clientMobile = clean(c1.mobile || c1.whatsapp || registration.msme?.udyamMobileNo, '-');
//                 const preparedByName = clean(accountPayment?.added_by || m.addedBy || m.createdByName || registration.updatedByName || registration.filledByFullName, 'N/A');
//                 const reviewedByName = clean(registration.reviewedByName || registration.hodName, 'N/A / HOD');

//                 const drawSectionBox = (x, top, w, h, radius = 3) => {
//                     doc.roundedRect(x, top, w, h, radius).lineWidth(0.7).stroke(BORDER_COLOR);
//                 };
//                 const drawHeaderLabel = (x, top, w, h, color, label) => {
//                     doc.roundedRect(x, top, w, h, 3).fill(color);
//                     doc.rect(x, top + h - 2, w, 2).fill(color);
//                     doc.fillColor('#fff').fontSize(8.5).font('Helvetica-Bold').text(label, x + 12, top + 5, { width: w - 24 });
//                 };
//                 const lineText = (text, x, top, w, opts = {}) => {
//                     doc.fillColor(opts.color || TEXT_DARK).fontSize(opts.size || 7.5).font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').text(text, x, top, { width: w, lineGap: opts.lineGap || 1, align: opts.align || 'left' });
//                 };

//                 let y = 36;

//                 // Header
//                 let logoDrawn = false;
//                 if (settings?.logo) {
//                     try {
//                         const logoPath = path.resolve(__dirname, '..', String(settings.logo).replace(/^\//, ''));
//                         if (fs.existsSync(logoPath)) {
//                             doc.image(logoPath, mx + 16, y + 12, { fit: [170, 55] });
//                             logoDrawn = true;
//                         }
//                     } catch (e) { }
//                 }
//                 doc.rect(mx - 8, y + 1, 16, 70).fill(ACCENT);
//                 if (!logoDrawn) {
//                     doc.fillColor(ORANGE).fontSize(18).font('Helvetica-Bold').text('NAMO', mx + 20, y + 18, { continued: true });
//                     doc.fillColor('#0070ba').text('GANGE');
//                     doc.fillColor(TEXT_MUTED).fontSize(13).font('Helvetica').text('WELLNESS PVT. LTD.', mx + 45, y + 45, { width: 170 });
//                 }
//                 const headX = mx + 175;
//                 const headW = mw - 175;
//                 doc.rect(headX, y + 3, headW, 68).fill(ACCENT);
//                 doc.fillColor('#fff').fontSize(7).font('Helvetica').text(`${clean(settings?.contactEmail || settings?.receiptContactEmail || 'info@namogangewellness.com')}  |  ${clean(settings?.contactWebsite || 'www.namogangewellness.com')}`, headX + 12, y + 18, { width: headW * 0.58 });
//                 doc.text(`GSTIN - ${clean(settings?.companyGst, '09AAFCN9238F1Z6')}  |  CIN No. ${clean(settings?.companyCin, 'U85320DL2018PTC329002')}`, headX + 12, y + 43, { width: headW * 0.58 });
//                 doc.moveTo(headX + headW * 0.62, y + 14).lineTo(headX + headW * 0.62, y + 64).lineWidth(0.5).stroke('#dbeafe');
//                 doc.fillColor('#fff').fontSize(7.4).font('Helvetica-Bold').text(receiptSettings.headOfficeLabel || 'Head Office:', headX + headW * 0.65, y + 14, { width: headW * 0.32 });
//                 doc.font('Helvetica').fontSize(7.1).text(`${clean(settings?.companyName, 'Namo Gange Wellness Pvt. Ltd.')},\n${clean(settings?.companyAddress, '12/52, Site-II, Loni Road Industrial Area, Mohan Nagar, Ghaziabad-201007, Uttar Pradesh, India')}`, headX + headW * 0.65, y + 27, { width: headW * 0.32, lineGap: 1 });
//                 y += 96;

//                 // Title and receipt meta
//                 doc.fillColor(ACCENT).fontSize(20).font('Helvetica-Bold').text(receiptSettings.receiptTitleLabel || 'PAYMENT RECEIPT', mx + 95, y, { width: 230, align: 'center' });
//                 doc.moveTo(mx + 95, y + 30).lineTo(mx + 255, y + 30).lineWidth(0.6).stroke('#8aa0c7');
//                 doc.polygon([mx + 175, y + 25], [mx + 179, y + 30], [mx + 175, y + 35], [mx + 171, y + 30]).fill(ACCENT);
//                 const metaX = mx + 330;
//                 [
//                     ['Receipt No.', rNo],
//                     ['Receipt Date', formattedDate],
//                     ['Registration ID', clean(registration.registrationId || registration._id?.toString().slice(-8), 'N/A')],
//                 ].forEach((row, idx) => {
//                     const yy = y + idx * 17;
//                     doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica-Bold').text(row[0], metaX, yy, { width: 68 });
//                     doc.text(':', metaX + 70, yy, { width: 8 });
//                     doc.font('Helvetica').text(row[1], metaX + 86, yy, { width: mw - (metaX - mx) - 86 });
//                 });
//                 y += 58;

//                 // Event strip
//                 const eventBoxH = 55;
//                 drawSectionBox(mx, y, mw, eventBoxH, 4);
//                 const evThird = mw / 3;
//                 const evRows = [
//                     { icon: 'cal', label: 'EVENT NAME', v1: eventName, v2: eventSubDate },
//                     { icon: 'cal', label: 'EVENT DATE', v1: dateStr, v2: '' },
//                     { icon: 'pin', label: 'EVENT VENUE', v1: venueText, v2: '' },
//                 ];
//                 evRows.forEach((item, idx) => {
//                     const x = mx + evThird * idx;
//                     if (idx > 0) doc.moveTo(x, y + 8).lineTo(x, y + eventBoxH - 8).dash(1.5, { space: 2 }).lineWidth(0.5).stroke(BORDER_COLOR).undash();
//                     if (item.icon === 'pin') drawPinIcon(x + 22, y + 22, 12, ACCENT);
//                     else drawCalendarIcon(x + 22, y + 21, 12, ACCENT);
//                     lineText(item.label, x + 48, y + 12, evThird - 58, { size: 7, bold: true, color: ACCENT });
//                     lineText(item.v1, x + 48, y + 26, evThird - 58, { size: 7 });
//                     if (item.v2) lineText(item.v2, x + 48, y + 41, evThird - 58, { size: 7 });
//                 });
//                 y += eventBoxH + sectionGap;

//                 // FROM / TO
//                 const halfW = (mw - 10) / 2;
//                 const boxTop = y;
//                 const rowW = halfW - 24;

//                 let fromAddr = settings?.companyAddress || '12/29, Site-II, Sunrise Industrial Area, Mohan Nagar, Ghaziabad - 201007, Uttar Pradesh, India';
//                 if (settings?.addresses?.length) {
//                     const addr = settings.addresses[0];
//                     const parts = [addr.street, [addr.city, addr.zipCode].filter(Boolean).join(' - '), addr.state, addr.country].filter(Boolean);
//                     if (parts.length) fromAddr = parts.join(', ');
//                 }
//                 const exAddr = [
//                     registration.address,
//                     [registration.city, registration.pincode].filter(Boolean).join(' - '),
//                     registration.state,
//                     registration.country || 'India',
//                 ].filter(Boolean).join(', ');
//                 const boxH = 166;
//                 drawHeaderLabel(mx, boxTop, halfW, 20, ORGANISER, receiptSettings.fromLabel || 'FROM (ORGANISER)');
//                 drawSectionBox(mx, boxTop, halfW, boxH, 4);
//                 let fy = boxTop + 31;
//                 lineText(clean(settings?.companyName, 'Namo Gange Wellness Pvt. Ltd.'), mx + 12, fy, rowW, { size: 9.5, bold: true, color: ACCENT });
//                 fy += 18;
//                 lineText(fromAddr, mx + 12, fy, rowW, { size: 7.4, lineGap: 2 });
//                 fy += 46;
//                 doc.moveTo(mx + 12, fy).lineTo(mx + halfW - 22, fy).dash(1, { space: 2 }).lineWidth(0.5).stroke(BORDER_COLOR).undash();
//                 fy += 10;
//                 lineText('ACCOUNTS DEPARTMENT', mx + 12, fy, rowW, { size: 7.2, bold: true, color: ACCENT });
//                 fy += 15;
//                 drawPhoneIcon(mx + 16, fy + 5, 5, ACCENT);
//                 lineText(clean(settings?.contactPhone, '+91 96549 00525'), mx + 30, fy, rowW - 18, { size: 7.4 });
//                 fy += 15;
//                 drawMailIcon(mx + 16, fy + 5, 5, ACCENT);
//                 lineText(clean(settings?.contactEmail, 'accounts@namogangewellness.com'), mx + 30, fy, rowW - 18, { size: 7.4 });
//                 fy += 15;
//                 drawGlobeIcon(mx + 16, fy + 5, 5, ACCENT);
//                 lineText(clean(settings?.contactWebsite, 'www.namogangewellness.com'), mx + 30, fy, rowW - 18, { size: 7.4 });
//                 fy += 24;
//                 lineText(`GSTIN:  ${clean(settings?.companyGst, '09AAFCN9238F1Z6')}`, mx + 12, fy, rowW, { size: 7.4, bold: true, color: ACCENT });

//                 const rX = mx + halfW + 10;
//                 drawHeaderLabel(rX, boxTop, halfW, 20, EXHIBITOR, receiptSettings.toLabel || 'TO (CLIENT)');
//                 drawSectionBox(rX, boxTop, halfW, boxH, 4);
//                 let ty = boxTop + 31;
//                 lineText(clean(registration.exhibitorName, 'N/A'), rX + 12, ty, rowW, { size: 9.5, bold: true, color: hasMsme ? EXHIBITOR : TEXT_DARK });
//                 ty += 16;
//                 if (hasMsme) {
//                     lineText(`(Udyam Registration No.: ${udyamNo})`, rX + 12, ty, rowW, { size: 7.2 });
//                     ty += 13;
//                     lineText('Under MSME PMS Scheme', rX + 12, ty, rowW, { size: 7.2 });
//                 } else {
//                     lineText(exAddr || '-', rX + 12, ty, rowW, { size: 7.2, lineGap: 2 });
//                 }
//                 ty = boxTop + 86;
//                 doc.moveTo(rX + 12, ty).lineTo(rX + halfW - 22, ty).dash(1, { space: 2 }).lineWidth(0.5).stroke(BORDER_COLOR).undash();
//                 ty += 12;
//                 [
//                     ['Contact Person', contactName],
//                     ['Mobile', clientMobile],
//                     ['Email', clientEmail],
//                 ].forEach(([label, value]) => {
//                     lineText(label, rX + 12, ty, 75, { size: 7.3 });
//                     lineText(':', rX + 82, ty, 8, { size: 7.3 });
//                     lineText(value, rX + 98, ty, rowW - 90, { size: 7.3 });
//                     ty += 20;
//                 });
//                 lineText(hasMsme ? 'GSTIN / UDYAM' : 'GSTIN', rX + 12, boxTop + 148, 75, { size: 7.4, bold: true, color: EXHIBITOR });
//                 lineText(':', rX + 82, boxTop + 148, 8, { size: 7.4, bold: true });
//                 lineText(hasMsme ? udyamNo : clean(registration.gstNo, 'N/A'), rX + 98, boxTop + 148, rowW - 90, { size: 7.4 });
//                 y = boxTop + boxH + sectionGap;

//                 // Payment details table
//                 const paymentHeaderH = 16;
//                 const rowH = 18;
//                 const paymentRows = [
//                     ['Amount Received', fmt(totalPaid)],
//                     ['Payment Mode', paymentMode],
//                     ['Transaction ID', reference],
//                     ['Transaction Date', paymentDate],
//                     ['Received In Bank', receivedBank],
//                     ['Against Invoice', paymentAgainst],
//                 ];
//                 doc.roundedRect(mx, y, mw, paymentHeaderH, 4).fill(EXHIBITOR);
//                 doc.rect(mx, y + paymentHeaderH - 2, mw, 2).fill(EXHIBITOR);
//                 doc.fillColor('#fff').fontSize(8.5).font('Helvetica-Bold').text(receiptSettings.paymentDetailsLabel || 'PAYMENT DETAILS', mx, y + 4, { width: mw, align: 'center' });
//                 y += paymentHeaderH;
//                 doc.rect(mx, y, mw, rowH).fill('#edf6ee');
//                 lineText('Particulars', mx + 58, y + 5, 160, { size: 7.2, bold: true, align: 'center' });
//                 lineText('Details', mx + 210, y + 5, mw - 220, { size: 7.2, bold: true });
//                 y += rowH;
//                 paymentRows.forEach((row, idx) => {
//                     const yy = y + idx * rowH;
//                     doc.rect(mx, yy, mw, rowH).lineWidth(0.3).stroke(BORDER_COLOR);
//                     doc.circle(mx + 20, yy + rowH / 2, 6).fill(EXHIBITOR);
//                     const icon = idx === 0 ? ic_rupee : idx === 1 || idx === 4 ? ic_business : idx === 2 ? ic_doc : idx === 3 ? ic_cal : ic_doc;
//                     drawSvgIcon(mx + 20, yy + rowH / 2, icon, 0.32, '#fff');
//                     lineText(row[0], mx + 40, yy + 5, 135, { size: 7.3, bold: true });
//                     doc.moveTo(mx + 165, yy).lineTo(mx + 165, yy + rowH).lineWidth(0.3).stroke(BORDER_COLOR);
//                     lineText(row[1], mx + 188, yy + 5, mw - 200, { size: 7.4 });
//                 });
//                 y += paymentRows.length * rowH + sectionGap;

//                 // Narration
//                 const stallSize = p.stallSize ? `${p.stallSize} Sqmt.` : 'N/A';
//                 const stallNo = clean(p.stallFor || p.stallNo, 'N/A');
//                 const stallType = clean(p.stallType, 'Stall');
//                 const narrationParts = [
//                     `${eventName} ${eventSubDate} at ${venueText},`,
//                     `Stall No. ${stallNo}${p.hallNo ? `, Hall No.- ${p.hallNo}` : ''} Booked by ${clean(registration.exhibitorName, 'N/A')}${hasMsme ? ` (Udyam Registration No.: ${udyamNo}) under MSME PMS Scheme` : ''}.`,
//                     `${stallType} Total Size: ${stallSize} @ ${fmt(p.rate || stallAmount)} per Sqmt. Total Stall Amount: ${fmt(grandTotal)}.`,
//                     `Advance payment received through ${paymentMode} ${receivedBank !== '-' ? `in ${receivedBank}` : ''} on ${paymentDate}, Transaction ID: ${reference}.`,
//                     `Against Proforma Invoice No. ${paymentAgainst}.`,
//                 ];
//                 const narrH = 88;
//                 drawSectionBox(mx, y, mw, narrH, 4);
//                 doc.roundedRect(mx + 14, y + 25, 18, 22, 2).fill(EXHIBITOR);
//                 drawSvgIcon(mx + 23, y + 36, ic_doc, 0.42, '#fff');
//                 lineText('NARRATION', mx + 42, y + 10, 100, { size: 8, bold: true, color: EXHIBITOR });
//                 lineText(narrationParts.join(' '), mx + 42, y + 26, mw - 58, { size: 7.3, lineGap: 1.5 });
//                 y += narrH + sectionGap;

//                 // Authorization strip
//                 const authH = 62;
//                 const authColW = mw / 3;
//                 drawSectionBox(mx, y, mw, authH, 4);
//                 [0, 1].forEach((i) => doc.moveTo(mx + authColW * (i + 1), y + 10).lineTo(mx + authColW * (i + 1), y + authH - 10).dash(1, { space: 2 }).lineWidth(0.5).stroke(BORDER_COLOR).undash());
//                 const authData = [
//                     ['PREPARED BY', preparedByName, formattedDate],
//                     ['REVIEWED BY', reviewedByName, formattedDate],
//                     ['AUTHORIZED SIGNATORY', `For ${clean(settings?.companyName, 'Namo Gange Wellness Pvt. Ltd.')}`, ''],
//                 ];
//                 authData.forEach((col, idx) => {
//                     const x = mx + authColW * idx;
//                     lineText(col[0], x, y + 12, authColW, { size: 7.4, bold: true, color: ACCENT, align: 'center' });
//                     lineText(col[1], x + 8, y + 28, authColW - 16, { size: 7.2, align: 'center' });
//                     if (col[2]) lineText(col[2], x + 8, y + 43, authColW - 16, { size: 7.2, align: 'center' });
//                     if (idx === 2 && receiptSettings.showSignatureStamp) {
//                         if (receiptSettings.stampImage) {
//                             const stampPath = path.join(__dirname, '..', receiptSettings.stampImage);
//                             if (fs.existsSync(stampPath)) doc.image(stampPath, x + 30, y + 27, { fit: [35, 35] });
//                         }
//                         if (receiptSettings.signatureImage) {
//                             const sigPath = path.join(__dirname, '..', receiptSettings.signatureImage);
//                             if (fs.existsSync(sigPath)) doc.image(sigPath, x + 78, y + 30, { fit: [authColW - 100, 26] });
//                         }
//                     }
//                 });

//                 doc.end();
//                 stream.on('finish', () => {
//                     resolve({ filePath, cloudUrl: getTempPdfUrl(filePath) });
//                 });
//                 stream.on('error', reject);
//             } catch (err) { reject(err); }
//         });
//     }

//     async generateAccessoryReceipt(order, registration) {
//         return new Promise(async (resolve, reject) => {
//             try {
//                 const { headerPath, footerPath } = await resolveHeaderFooterPaths();
//                 const doc = new PDFDocument({ margin: 0, size: 'A4' });
//                 const filePath = path.join(TEMP_DIR, `acc_receipt_${order._id}_${Date.now()}.pdf`);
//                 const stream = fs.createWriteStream(filePath);
//                 doc.pipe(stream);

//                 const pageW = doc.page.width;
//                 const fmt = (n) => `INR ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

//                 this._headerImg(doc, headerPath);
//                 let y = doc.y + 10;

//                 // Title
//                 doc.rect(40, y, pageW - 80, 22).fill(ORANGE);
//                 doc.fillColor(WHITE).fontSize(11).font('Helvetica-Bold')
//                     .text('ACCESSORY / EXTRAS PURCHASE RECEIPT', 40, y + 6, { width: pageW - 80, align: 'center' });
//                 y += 30;

//                 // Meta
//                 doc.fillColor(GRAY).fontSize(8).font('Helvetica')
//                     .text(`Order No: ${order.orderNo}`, 40, y)
//                     .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 0, y, { width: pageW - 40, align: 'right' });
//                 y += 16;
//                 this._line(doc, 40, y, pageW - 40);
//                 y += 8;

//                 // FROM | TO
//                 const colW = (pageW - 100) / 2;
//                 const lx = 40, rx = 60 + colW;
//                 const c1 = registration.contact1 || {};

//                 doc.rect(lx, y, colW, 80).lineWidth(0.5).stroke('#e5e7eb');
//                 this._label(doc, 'From', lx + 8, y + 8, colW - 16);
//                 doc.fillColor(GREEN).fontSize(10).font('Helvetica-Bold').text('IHWE 2026', lx + 8, y + 20, { width: colW - 16 });
//                 doc.fillColor(GRAY).fontSize(8).font('Helvetica')
//                     .text('Namo Gange Wellness Pvt. Ltd.', lx + 8, y + 34, { width: colW - 16 })
//                     .text('Pragati Maidan, New Delhi – 110001', lx + 8, y + 46, { width: colW - 16 })
//                     .text('info@namogangewellness.com  |  +91-9654900525', lx + 8, y + 58, { width: colW - 16 });

//                 doc.rect(rx, y, colW, 80).lineWidth(0.5).stroke('#e5e7eb');
//                 this._label(doc, 'To (Exhibitor)', rx + 8, y + 8, colW - 16);
//                 doc.fillColor(ORANGE).fontSize(10).font('Helvetica-Bold').text(registration.exhibitorName || 'N/A', rx + 8, y + 20, { width: colW - 16 });
//                 doc.fillColor(GRAY).fontSize(8).font('Helvetica')
//                     .text(`Reg ID: ${registration.registrationId || 'N/A'}`, rx + 8, y + 34, { width: colW - 16 })
//                     .text(`Stall: ${registration.participation?.stallFor || 'N/A'}`, rx + 8, y + 46, { width: colW - 16 })
//                     .text(c1.email || '', rx + 8, y + 58, { width: colW - 16 });
//                 y += 88;

//                 // Items table
//                 const tW = pageW - 80;
//                 const cols = [
//                     { label: '#', w: tW * 0.05 },
//                     { label: 'Item', w: tW * 0.30 },
//                     { label: 'Type', w: tW * 0.12 },
//                     { label: 'Qty', w: tW * 0.08, align: 'center' },
//                     { label: 'Unit Price', w: tW * 0.15, align: 'right' },
//                     { label: 'GST', w: tW * 0.10, align: 'right' },
//                     { label: 'Total', w: tW * 0.20, align: 'right' },
//                 ];

//                 doc.rect(40, y, tW, 18).fill(DARK);
//                 let tx = 40;
//                 cols.forEach(col => {
//                     doc.fillColor(WHITE).fontSize(8).font('Helvetica-Bold')
//                         .text(col.label, tx + 4, y + 5, { width: col.w - 8, align: col.align || 'left' });
//                     tx += col.w;
//                 });
//                 y += 18;

//                 order.items.forEach((item, idx) => {
//                     const bg = idx % 2 === 0 ? '#f9fafb' : WHITE;
//                     y = this._tableRow(doc, [
//                         { text: String(idx + 1), w: tW * 0.05 },
//                         { text: item.name, w: tW * 0.30 },
//                         { text: item.type === 'complimentary' ? 'FREE' : 'Paid', w: tW * 0.12, color: item.type === 'complimentary' ? '#16a34a' : ORANGE, bold: true },
//                         { text: String(item.qty), w: tW * 0.08, align: 'center' },
//                         { text: item.type === 'complimentary' ? '—' : fmt(item.unitPrice), w: tW * 0.15, align: 'right' },
//                         { text: item.type === 'complimentary' ? '—' : fmt(item.gstAmount), w: tW * 0.10, align: 'right' },
//                         { text: item.type === 'complimentary' ? 'Complimentary' : fmt(item.totalPrice), w: tW * 0.20, align: 'right', bold: true },
//                     ], y, bg);
//                 });

//                 this._line(doc, 40, y, 40 + tW, '#e5e7eb');
//                 y += 8;

//                 // Summary
//                 const sumX = 40 + tW * 0.55;
//                 const sumW = tW * 0.45;
//                 [
//                     { label: 'Subtotal', value: fmt(order.subtotal) },
//                     { label: 'Total GST', value: fmt(order.totalGst) },
//                 ].forEach(row => {
//                     doc.fillColor(GRAY).fontSize(8).font('Helvetica')
//                         .text(row.label, sumX, y + 4, { width: sumW * 0.55 })
//                         .text(row.value, sumX + sumW * 0.55, y + 4, { width: sumW * 0.45, align: 'right' });
//                     y += 16;
//                 });
//                 this._line(doc, sumX, y, sumX + sumW, GREEN, 1);
//                 y += 4;
//                 doc.rect(sumX, y, sumW, 24).fill(GREEN);
//                 doc.fillColor(WHITE).fontSize(10).font('Helvetica-Bold')
//                     .text('GRAND TOTAL', sumX + 8, y + 7, { width: sumW * 0.5 })
//                     .text(fmt(order.grandTotal), sumX + sumW * 0.5, y + 7, { width: sumW * 0.5 - 8, align: 'right' });
//                 y += 32;

//                 // Status badge
//                 const statusColor = order.paymentStatus === 'complimentary' ? GREEN : (order.paymentStatus === 'paid' ? '#0891b2' : '#f59e0b');
//                 doc.rect(40, y, 160, 22).fill(statusColor);
//                 doc.fillColor(WHITE).fontSize(9).font('Helvetica-Bold')
//                     .text(order.paymentStatus.toUpperCase(), 40, y + 7, { width: 160, align: 'center' });

//                 if (order.transactionId) {
//                     doc.fillColor(GRAY).fontSize(8).font('Helvetica')
//                         .text(`Txn ID: ${order.transactionId}`, 210, y + 8, { width: pageW - 260 });
//                 }

//                 this._footerImg(doc, footerPath);
//                 doc.end();

//                 stream.on('finish', () => {
//                     const publicUrl = getTempPdfUrl(filePath);
//                     resolve({ filePath, cloudUrl: publicUrl });
//                 });
//                 stream.on('error', reject);
//             } catch (err) { reject(err); }
//         });
//     }

//     async generateClientStatement(ledger, options = {}) {
//         return new Promise(async (resolve, reject) => {
//             try {
//                 const { headerPath, footerPath } = await resolveHeaderFooterPaths(
//                     options.headerImage,
//                     options.footerImage
//                 );
//                 const settings = await Settings.findOne();
//                 const doc = new PDFDocument({ margin: 0, size: 'A4' });
//                 const safeBase = String(ledger.companyInfo?.name || 'client').replace(/[^a-z0-9]+/gi, '_');
//                 const fileName = `statement_${safeBase}_${Date.now()}.pdf`;
//                 const filePath = path.join(TEMP_DIR, fileName);
//                 const stream = fs.createWriteStream(filePath);
//                 doc.pipe(stream);

//                 const pageW = doc.page.width;
//                 const pageH = doc.page.height;
//                 const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
//                 const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

//                 this._headerImg(doc, headerPath);
//                 let y = doc.y;
//                 if (!headerPath) {
//                     doc.fillColor(GRAY).fontSize(8).font('Helvetica')
//                         .text(settings?.companyAddress || '', 40, y, { width: pageW - 80, align: 'center' });
//                     y += 20;
//                 }

//                 doc.rect(40, y, pageW - 80, 26).fill(BLUE_NAVY);
//                 doc.fillColor(WHITE).fontSize(13).font('Helvetica-Bold')
//                     .text('STATEMENT OF ACCOUNT', 40, y + 7, { width: pageW - 80, align: 'center', characterSpacing: 1 });
//                 y += 36;

//                 doc.fillColor(GRAY).fontSize(8).font('Helvetica')
//                     .text(`Generated On: ${fmtDate(new Date())}`, 40, y, { width: pageW - 80, align: 'right' });
//                 y += 16;

//                 // ── Client Information ──
//                 const info = ledger.companyInfo || {};
//                 doc.rect(40, y, 160, 16).fill(BLUE_NAVY);
//                 doc.fillColor(WHITE).fontSize(8).font('Helvetica-Bold').text('Client Information', 45, y + 4);
//                 y += 22;
//                 const colW = (pageW - 100) / 2;
//                 const leftRows = [
//                     ['Client Name:', info.name],
//                     ['Contact Person:', info.contactPerson],
//                     ['Mobile:', info.mobile],
//                     ['Email:', info.email],
//                 ];
//                 const rightRows = [
//                     ['Stall No.:', info.stallNo],
//                     ['GST No.:', info.gstNo],
//                     ['PAN No.:', info.panNo],
//                     ['State:', info.state],
//                 ];
//                 let ly = y, ry = y;
//                 leftRows.forEach(([label, value]) => {
//                     this._label(doc, label, 40, ly, 100);
//                     this._value(doc, value, 130, ly, colW - 90);
//                     ly += 16;
//                 });
//                 rightRows.forEach(([label, value]) => {
//                     this._label(doc, label, 60 + colW, ry, 90);
//                     this._value(doc, value, 150 + colW, ry, colW - 110);
//                     ry += 16;
//                 });
//                 y = Math.max(ly, ry) + 10;

//                 // ── Summary boxes ──
//                 const fin = ledger.financials || {};
//                 const boxes = [
//                     { label: 'Total Invoiced', value: fmt(fin.totalInvoiced), color: BLUE_NAVY },
//                     { label: 'Total Received', value: fmt(fin.totalReceived), color: GREEN },
//                     { label: 'Total Adjustments', value: fmt(fin.totalAdjustments), color: ORANGE },
//                     { label: 'Outstanding', value: fmt(fin.outstandingAmount), color: '#b91c1c' },
//                 ];
//                 const boxW = (pageW - 80) / boxes.length;
//                 boxes.forEach((box, i) => {
//                     const bx = 40 + i * boxW;
//                     doc.rect(bx, y, boxW - 6, 38).fill(LGRAY);
//                     this._label(doc, box.label, bx + 6, y + 6, boxW - 18);
//                     doc.fillColor(box.color).fontSize(9).font('Helvetica-Bold').text(box.value, bx + 6, y + 18, { width: boxW - 18 });
//                 });
//                 y += 48;

//                 // ── Ledger table ──
//                 const tW = pageW - 80;
//                 const cols = [
//                     { label: 'Date', w: tW * 0.11 },
//                     { label: 'Type', w: tW * 0.11 },
//                     { label: 'Document No.', w: tW * 0.16 },
//                     { label: 'Reference / Narration', w: tW * 0.23 },
//                     { label: 'Debit', w: tW * 0.125, align: 'right' },
//                     { label: 'Credit', w: tW * 0.125, align: 'right' },
//                     { label: 'Balance', w: tW * 0.14, align: 'right' },
//                 ];
//                 const drawTableHeader = (yy) => {
//                     doc.rect(40, yy, tW, 18).fill(DARK);
//                     let tx = 40;
//                     cols.forEach((col) => {
//                         doc.fillColor(WHITE).fontSize(7.5).font('Helvetica-Bold')
//                             .text(col.label, tx + 4, yy + 5, { width: col.w - 8, align: col.align || 'left' });
//                         tx += col.w;
//                     });
//                     return yy + 18;
//                 };
//                 y = drawTableHeader(y);

//                 doc.fillColor(GRAY).fontSize(7).font('Helvetica-Bold')
//                     .text('Opening Balance', 40, y + 4, { width: tW - 100 });
//                 doc.fillColor(DARK).text(fmt(ledger.openingBalance), 40, y + 4, { width: tW, align: 'right' });
//                 y += 16;

//                 (ledger.ledger || []).forEach((row, idx) => {
//                     const rowCols = [
//                         { text: fmtDate(row.date), w: cols[0].w },
//                         { text: row.type, w: cols[1].w },
//                         { text: row.documentNo, w: cols[2].w },
//                         { text: (row.reference || '').replace(/\s*\n\s*/g, ' ').trim(), w: cols[3].w },
//                         { text: row.debit ? fmt(row.debit) : '-', w: cols[4].w, align: 'right', color: row.debit ? '#b91c1c' : GRAY },
//                         { text: row.credit ? fmt(row.credit) : '-', w: cols[5].w, align: 'right', color: row.credit ? GREEN : GRAY },
//                         { text: fmt(row.balance), w: cols[6].w, align: 'right', bold: true },
//                     ];
//                     const rowHeight = this._measureRowHeight(doc, rowCols);
//                     if (y + rowHeight > pageH - 100) {
//                         doc.addPage();
//                         y = 40;
//                         y = drawTableHeader(y);
//                     }
//                     y = this._wrappedTableRow(doc, rowCols, y, idx % 2 === 0 ? '#fafafa' : null);
//                 });

//                 if (y > pageH - 100) {
//                     doc.addPage();
//                     y = 40;
//                 }
//                 y += 6;
//                 this._line(doc, 40, y, pageW - 40, BLUE_NAVY, 1);
//                 y += 8;
//                 doc.fillColor(BLUE_NAVY).fontSize(9).font('Helvetica-Bold')
//                     .text(`Closing Balance as on ${fmtDate(new Date())}`, 40, y, { width: tW - 120 });
//                 doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
//                     .text(fmt(ledger.closingBalance), 40, y, { width: tW, align: 'right' });

//                 if (footerPath) this._footerImg(doc, footerPath);

//                 doc.end();
//                 stream.on('finish', () => {
//                     const publicUrl = getTempPdfUrl(filePath);
//                     resolve({ filePath, cloudUrl: publicUrl });
//                 });
//                 stream.on('error', reject);
//             } catch (err) { reject(err); }
//         });
//     }
// }

// module.exports = new PDFGenerator();
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
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
                    const qrPayload = JSON.stringify({ registrationId: String(registration.registrationId || '').trim() });
                    if (!registration.registrationId) throw new Error('Exhibitor registration ID is missing');
                    const qrBuffer = await QRCode.toBuffer(qrPayload, { margin: 1, width: 80 });
                    doc.image(qrBuffer, qrX, qrY, { width: 80 });
                    doc.fillColor(GRAY).fontSize(7).text('Exhibitor Entry QR', qrX, qrY + 85, { width: 80, align: 'center' });
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

                const curStr = isUSD ? 'USD ' : '';
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
                const ORGANISER = receiptSettings.organiserBandColor || '#002D6D';
                const EXHIBITOR = receiptSettings.exhibitorBandColor || '#013811';
                const CLIENT_GREEN = '#013811';
                const ACCENT = receiptSettings.accentColor || '#002F73';
                const NOTE_COLOR = receiptSettings.noteColor || '#c2410c';
                const SECTION_BAND = receiptSettings.sectionBandColor || EXHIBITOR;
                const SECTION_TEXT = receiptSettings.sectionBandTextColor || '#ffffff';
                const AUTH_BAND = receiptSettings.authBandColor || ACCENT;
                const AUTH_TEXT = receiptSettings.authBandTextColor || '#ffffff';
                const FOOTER_BAR = receiptSettings.footerBarColor || ACCENT;
                const FOOTER_TEXT = receiptSettings.footerBarTextColor || '#ffffff';
                const RECEIPT_TITLE_BAND = receiptSettings.receiptTitleBandColor || '#ffffff';
                const BORDER_COLOR = '#B2B8C8';
                const TEXT_DARK = '#111111';
                const TEXT_MUTED = '#334155';

                const headerH = clamp(receiptSettings.headerBandHeight, 70, 140, 95);
                const eventH = clamp(receiptSettings.eventBandHeight, 42, 80, 52);
                const infoH = clamp(receiptSettings.infoBandHeight, 80, 160, 115);
                const footerH = clamp(receiptSettings.footerBandHeight, 60, 110, 85);
                const mx = clamp(receiptSettings.pageMarginX, 15, 50, 30);
                const sectionGap = clamp(receiptSettings.sectionGap, 0, 30, 4);
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
                const ic_hash = 'M20 10h-4l.7-4h-2l-.7 4h-4l.7-4h-2L7.3 10H4v2h2.95l-.7 4H3v2h2.9l-.7 4h2l.7-4h4l-.7 4h2l.7-4H18v-2h-2.95l.7-4H20v-2zm-7.05 6h-4l.7-4h4l-.7 4z';
                const ic_wallet = 'M21 7.28V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-2.28c.59-.35 1-.98 1-1.72V9c0-.74-.41-1.37-1-1.72zM20 9v6h-2.5V9H20zM7 9h8v2H7V9zm0 4h5v2H7v-2z';
                const ic_business = 'M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z';
                const ic_bell = 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z';
                const drawMailIcon = (cx, cy, r, color) => {
                    // Sharp outlined envelope like the reference.
                    doc.save();
                    const w = r * 2.05;
                    const h = r * 1.34;
                    const x = cx - w / 2;
                    const y0 = cy - h / 2;
                    doc.roundedRect(x, y0, w, h, r * 0.06).lineWidth(0.82).stroke(color);
                    doc.moveTo(x + 0.22, y0 + 0.2)
                        .lineTo(cx, y0 + h * 0.62)
                        .lineTo(x + w - 0.22, y0 + 0.2)
                        .lineWidth(0.82)
                        .stroke(color);
                    doc.restore();
                };

                const drawGlobeIcon = (cx, cy, r, color) => {
                    // Globe with meridians + equator, matching the reference icon family.
                    doc.save();
                    doc.circle(cx, cy, r).lineWidth(0.78).stroke(color);
                    doc.ellipse(cx, cy, r * 0.44, r).lineWidth(0.62).stroke(color);
                    doc.moveTo(cx - r, cy).lineTo(cx + r, cy).lineWidth(0.62).stroke(color);
                    doc.ellipse(cx, cy, r, r * 0.42).lineWidth(0.5).stroke(color);
                    doc.restore();
                };

                const drawPhoneIcon = (cx, cy, r, color) => {
                    // Outline handset — closer to the organiser contact icon in the reference.
                    doc.save();
                    const s = (r * 2.0) / 24;
                    doc.translate(cx - 12 * s, cy - 12 * s);
                    doc.scale(s);
                    doc.path('M6.54 5.87 5.29 7.12c-.36.36-.47.89-.28 1.36 1.37 3.33 4.01 5.98 7.35 7.35.47.19 1 .08 1.36-.28l1.25-1.25c.33-.33.82-.44 1.26-.28 1.02.36 2.11.55 3.22.55.72 0 1.3.58 1.3 1.3V19c0 .72-.58 1.3-1.3 1.3C10.3 20.3 3.7 13.7 3.7 5.55c0-.72.58-1.3 1.3-1.3h3.15c.72 0 1.3.58 1.3 1.3 0 1.11.19 2.2.55 3.22.16.44.05.93-.28 1.26l-1.88 1.84')
                        .lineWidth(1.45)
                        .lineCap('round')
                        .lineJoin('round')
                        .stroke(color);
                    doc.restore();
                };

                const drawPinIcon = (cx, cy, r, color) => {
                    // Outlined map-pin with inner dot.
                    doc.save();
                    const top = cy - r * 1.02;
                    doc.moveTo(cx, cy + r * 0.98)
                        .bezierCurveTo(
                            cx - r * 0.28, cy + r * 0.52,
                            cx - r * 0.98, cy - r * 0.02,
                            cx - r * 0.98, cy - r * 0.37
                        )
                        .bezierCurveTo(
                            cx - r * 0.98, cy - r * 0.89,
                            cx - r * 0.52, top,
                            cx, top
                        )
                        .bezierCurveTo(
                            cx + r * 0.52, top,
                            cx + r * 0.98, cy - r * 0.89,
                            cx + r * 0.98, cy - r * 0.37
                        )
                        .bezierCurveTo(
                            cx + r * 0.98, cy - r * 0.02,
                            cx + r * 0.28, cy + r * 0.52,
                            cx, cy + r * 0.98
                        )
                        .lineWidth(0.9)
                        .stroke(color);
                    doc.circle(cx, cy - r * 0.36, r * 0.28).lineWidth(0.8).stroke(color);
                    doc.restore();
                };

                const drawCalendarIcon = (cx, cy, r, color) => {
                    // Outline calendar for event strip / organiser section.
                    doc.save();
                    const x = cx - r * 0.80;
                    const y0 = cy - r * 0.58;
                    const w = r * 1.60;
                    const h = r * 1.52;

                    doc.roundedRect(x, y0, w, h, r * 0.15).lineWidth(0.84).stroke(color);

                    doc.moveTo(x, y0 + r * 0.40)
                        .lineTo(x + w, y0 + r * 0.40)
                        .lineWidth(0.75)
                        .stroke(color);

                    doc.moveTo(cx - r * 0.40, y0 - r * 0.22)
                        .lineTo(cx - r * 0.40, y0 + r * 0.16)
                        .lineWidth(1.0)
                        .stroke(color);
                    doc.moveTo(cx + r * 0.40, y0 - r * 0.22)
                        .lineTo(cx + r * 0.40, y0 + r * 0.16)
                        .lineWidth(1.0)
                        .stroke(color);

                    // 2 x 2 date squares
                    const cell = Math.max(0.72, r * 0.16);
                    const gap = r * 0.20;
                    const sx = cx - gap * 0.75;
                    const sy = cy + r * 0.02;
                    [-1, 1].forEach((mx) => {
                        [-1, 1].forEach((my) => {
                            doc.rect(sx + mx * gap - cell / 2, sy + my * gap * 0.85 - cell / 2, cell, cell).fill(color);
                        });
                    });

                    doc.restore();
                };

                const drawFilledCalendarIcon = (cx, cy, r, color) => {
                    // Filled calendar for the payment table circular badges.
                    drawSvgIcon(cx, cy, ic_cal, (r * 1.9) / 24, color);
                };

                const drawBankIcon = (cx, cy, r, color) => {
                    drawSvgIcon(cx, cy, 'M12 2 2 7v2h20V7L12 2zm-7 9v6h3v-6H5zm5 0v6h4v-6h-4zm6 0v6h3v-6h-3zM2 19v2h20v-2H2z', (r * 2.05) / 24, color);
                };

                const drawHashIcon = (cx, cy, r, color) => {
                    drawSvgIcon(cx, cy, ic_hash, (r * 2.0) / 24, color);
                };

                const drawSmallDocumentIcon = (cx, cy, r, color) => {
                    // Simple receipt/document glyph with three horizontal lines.
                    doc.save();
                    const w = r * 1.2;
                    const h = r * 1.55;
                    const x = cx - w / 2;
                    const y0 = cy - h / 2;
                    doc.roundedRect(x, y0, w, h, r * 0.08).fill(color);

                    // Knock-out lines using the surrounding green/blue is not possible safely,
                    // so draw short transparent-looking gaps by using white only when requested.
                    // In the payment circles the document itself is white, matching the reference.
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

                const formatDate = (value) => {
                    if (!value) return 'N/A';
                    const d = new Date(value);
                    if (Number.isNaN(d.getTime())) return String(value);
                    const day = d.toLocaleDateString('en-GB', { day: '2-digit' });
                    const month = d.toLocaleDateString('en-GB', { month: 'short' });
                    const year = d.toLocaleDateString('en-GB', { year: 'numeric' });
                    return `${day}-${month}-${year}`;
                };
                const formattedDate = formatDate(m.paidAt || m.neft_date || registration.updatedAt || Date.now());
                const fmtEvDate = (d) => d ? formatDate(d) : '';
                const formatEventShortRange = (start, end) => {
                    if (!start || !end) return '(21-23 August 2026)';
                    const s = new Date(start);
                    const e = new Date(end);
                    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return '(21-23 August 2026)';
                    const monthYear = e.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
                    return `(${s.getDate()}-${e.getDate()} ${monthYear})`;
                };
                const formatEventNarrationRange = (start, end) => {
                    const fallback = '21-23 August 2026';
                    if (!start || !end) return fallback;
                    const s = new Date(start);
                    const e = new Date(end);
                    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return fallback;
                    const monthYear = e.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
                    return `${s.getDate()}–${e.getDate()} ${monthYear}`;
                };
                const formatLongDate = (value) => {
                    if (!value) return formattedDate;
                    const d = new Date(value);
                    if (Number.isNaN(d.getTime())) return String(value);
                    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
                };
                const eventName = eventDoc?.name || '9th International Health & Wellness Expo, 2026';
                const dateStr = eventDoc?.startDate ? `${fmtEvDate(eventDoc.startDate)}${eventDoc.endDate ? ' - ' + fmtEvDate(eventDoc.endDate) : ''}` : '21 Aug 2026 - 23 Aug 2026';
                const eventSubDate = eventDoc?.startDate && eventDoc?.endDate ? formatEventShortRange(eventDoc.startDate, eventDoc.endDate) : '(21-23 August 2026)';
                const venueText = eventDoc?.location || 'Pragati Maidan, New Delhi - 110001, Delhi, India';
                const clean = (v, fallback = '-') => (v === undefined || v === null || String(v).trim() === '') ? fallback : String(v).trim();
                const sentenceCase = (value, fallback = '') => {
                    const raw = clean(value, fallback);
                    if (!raw || raw === '-') return raw;
                    const lower = raw.toLowerCase();
                    return lower.charAt(0).toUpperCase() + lower.slice(1);
                };
                const toWords = (value) => {
                    const n = Math.floor(Number(value || 0));
                    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
                    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
                    const convert = (num) => {
                        if (num < 20) return ones[num];
                        if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ` ${ones[num % 10]}` : '');
                        if (num < 1000) return `${ones[Math.floor(num / 100)]} Hundred${num % 100 ? ` ${convert(num % 100)}` : ''}`;
                        if (num < 100000) return `${convert(Math.floor(num / 1000))} Thousand${num % 1000 ? ` ${convert(num % 1000)}` : ''}`;
                        if (num < 10000000) return `${convert(Math.floor(num / 100000))} Lakh${num % 100000 ? ` ${convert(num % 100000)}` : ''}`;
                        return `${convert(Math.floor(num / 10000000))} Crore${num % 10000000 ? ` ${convert(num % 10000000)}` : ''}`;
                    };
                    return n ? `Rupees ${convert(n).trim()} Only` : 'Rupees Zero Only';
                };
                const fullName = (contact) => clean(contact?.name || `${contact?.title ? contact.title + ' ' : ''}${contact?.firstName || ''} ${contact?.lastName || ''}`.trim(), '');
                const resolveUploadPath = (value) => {
                    if (!value) return null;
                    const rel = String(value).replace(/^\//, '');
                    const candidate = path.resolve(__dirname, '..', rel);
                    return fs.existsSync(candidate) ? candidate : null;
                };
                const fetchImageBuffer = (url) => new Promise((resolve) => {
                    const client = String(url).startsWith('https:') ? https : http;
                    client.get(url, (response) => {
                        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                            response.resume();
                            fetchImageBuffer(response.headers.location).then(resolve);
                            return;
                        }
                        if (response.statusCode !== 200) {
                            response.resume();
                            resolve(null);
                            return;
                        }
                        const chunks = [];
                        response.on('data', (chunk) => chunks.push(chunk));
                        response.on('end', () => resolve(Buffer.concat(chunks)));
                    }).on('error', () => resolve(null));
                });
                const resolvePdfImageSource = async (value) => {
                    if (!value) return null;
                    const raw = String(value);
                    if (/^https?:\/\//i.test(raw)) return fetchImageBuffer(raw);
                    if (/^data:image\/[a-z0-9.+-]+;base64,/i.test(raw)) {
                        return Buffer.from(raw.split(',')[1] || '', 'base64');
                    }
                    return resolveUploadPath(raw);
                };

                const Payment = require('../models/Payment');
                let accountPayment = null;
                if (paymentHistoryEntry?.accountPaymentId && mongoose.Types.ObjectId.isValid(paymentHistoryEntry.accountPaymentId)) {
                    try { accountPayment = await Payment.findById(paymentHistoryEntry.accountPaymentId).lean(); } catch (e) { }
                }

                const paymentMode = clean(accountPayment?.payment_mode || m.method || m.paymentMode || registration.paymentMode, 'N/A').toUpperCase();
                const normalizeReceiptPaymentMode = (mode) => {
                    const raw = clean(mode, 'N/A');
                    const normalized = raw.toUpperCase().replace(/\s+PAYMENTS?$/i, '').trim();
                    const hasNeft = /NEFT/i.test(normalized);
                    const hasRtgs = /RTGS/i.test(normalized);
                    if (hasNeft && !hasRtgs) return 'NEFT';
                    if (hasRtgs && !hasNeft) return 'RTGS';
                    if (hasNeft && hasRtgs) return 'NEFT';
                    if (/BANK\s*TRANSFER/i.test(normalized)) return 'BANK TRANSFER';
                    return normalized;
                };
                const reference = clean(accountPayment?.utr_no || accountPayment?.cheque_no || accountPayment?.card_transaction_no || accountPayment?.wallet_transaction_no || accountPayment?.cash_receipt_no || m.transactionId || m.razorpayPaymentId || registration.paymentId, 'N/A');
                const totalPaid = Number(accountPayment?.amount_text || m.amount || registration.amountPaid || 0);
                const paymentDate = formatDate(accountPayment?.payment_date || accountPayment?.neft_date || m.paidAt || registration.updatedAt || Date.now());
                const receivedBank = clean(accountPayment?.neft_bank || accountPayment?.cheque_bank || accountPayment?.wallet_name || accountPayment?.card_name || accountPayment?.bankName, 'Kotak Mahindra Bank');
                let receivedBankBranch = clean(
                    accountPayment?.bank_branch ||
                    accountPayment?.branch ||
                    accountPayment?.bankBranch ||
                    accountPayment?.bankbranch ||
                    registration.bankDetails?.branch ||
                    (/kotak/i.test(receivedBank) ? 'Jagriti Enclave, Anand Vihar, Delhi' : ''),
                    '-'
                );
                if (
                    receivedBankBranch &&
                    receivedBank &&
                    receivedBankBranch.toLowerCase() === receivedBank.toLowerCase() &&
                    /kotak/i.test(receivedBank)
                ) {
                    receivedBankBranch = 'Jagriti Enclave, Anand Vihar, Delhi';
                }
                const paymentAgainst = clean(registration.customInvoiceNo || registration.referenceInvoice || registration.invoiceNo || p.invoiceNo || invoice?.invoice_no || accountPayment?.invoice_id, 'N/A');
                const fb = registration.financeBreakdown || {};
                const invVal = Number(registration.receiptInvoiceAmount || fb.invoiceAmount || fb.totalAmount || p.total || invoice?.finalAmount || fb.netPayable || p.amount || 0);
                const stallAmount = Number(fb.subtotal || p.amount || Math.round(invVal / (1 + (Number(p.gstPercent || 18) / 100))) || 0);
                const grandTotal = Number(fb.netPayable || p.total || invVal || 0);
                const hasMsme = !!(registration.msme?.udyamRegNo || registration.msme?.udyamRegistrationNo || registration.msme?.udyamNo);
                const udyamNo = clean(registration.msme?.udyamRegNo || registration.msme?.udyamRegistrationNo || registration.msme?.udyamNo, '');
                const contactName = fullName(c1) || clean(registration.msme?.udyamContactPerson, 'Authorized Signatory');
                const clientEmail = clean(c1.email || registration.companyEmail || registration.msme?.udyamEmailId, '-');
                const clientMobile = clean(c1.mobile || c1.whatsapp || registration.msme?.udyamMobileNo, '-');
                const preparedByIdentity = clean(
                    accountPayment?.added_by ||
                    m.addedBy ||
                    m.createdByName ||
                    registration.updatedByName ||
                    registration.filledByFullName ||
                    registration.filledBy,
                    ''
                );

                const preparedByName = clean(preparedByIdentity, 'N/A');

                // Resolve the HOD of the person who created/recorded this payment.
                // REVIEWED BY should show the actual HOD name, not the literal "N/A / HOD".
                let creatorProfile = null;
                if (preparedByIdentity) {
                    try {
                        const User = require('../models/User');
                        const escapedIdentity = String(preparedByIdentity)
                            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                        if (mongoose.Types.ObjectId.isValid(preparedByIdentity)) {
                            creatorProfile = await User.findById(preparedByIdentity)
                                .select('fullName username email mobile designation department hodName reportingToName signatureImage')
                                .lean();
                        }

                        if (!creatorProfile) {
                            creatorProfile = await User.findOne({
                            $or: [
                                { username: preparedByIdentity },
                                { fullName: preparedByIdentity },
                                { email: preparedByIdentity },
                            ],
                        })
                            .select('fullName username email mobile designation department hodName reportingToName signatureImage')
                            .lean();
                        }

                        if (!creatorProfile) {
                            creatorProfile = await User.findOne({
                                $or: [
                                    { username: { $regex: new RegExp(`^${escapedIdentity}$`, 'i') } },
                                    { fullName: { $regex: new RegExp(`^${escapedIdentity}$`, 'i') } },
                                    { email: { $regex: new RegExp(`^${escapedIdentity}$`, 'i') } },
                                ],
                            })
                                .select('fullName username email mobile designation department hodName reportingToName signatureImage')
                                .lean();
                        }
                    } catch (hodLookupErr) {
                        console.error('Receipt HOD lookup error:', hodLookupErr);
                    }
                }

                const generatedByName = clean(
                    creatorProfile?.fullName ||
                    creatorProfile?.username ||
                    preparedByIdentity,
                    'N/A'
                );
                const generatedByDepartment = 'ACCOUNTS DEPARTMENT';
                const generatedByPhone = clean(
                    creatorProfile?.mobile,
                    settings?.contactPhone || '+91 96549 00525'
                );
                const generatedByEmail = clean(
                    creatorProfile?.email,
                    settings?.contactEmail || 'info@namogangewellness.com'
                );

                const reviewedByName = clean(
                    registration.reviewedByName ||
                    registration.hodName ||
                    creatorProfile?.hodName ||
                    creatorProfile?.reportingToName,
                    'N/A'
                );

                let reviewerProfile = null;
                if (reviewedByName && reviewedByName !== 'N/A') {
                    try {
                        const User = require('../models/User');
                        const escapedReviewer = String(reviewedByName)
                            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                        if (mongoose.Types.ObjectId.isValid(reviewedByName)) {
                            reviewerProfile = await User.findById(reviewedByName)
                                .select('signatureImage')
                                .lean();
                        }

                        if (!reviewerProfile) {
                            reviewerProfile = await User.findOne({
                            $or: [
                                { username: reviewedByName },
                                { fullName: reviewedByName },
                                { email: reviewedByName },
                                { username: { $regex: new RegExp(`^${escapedReviewer}$`, 'i') } },
                                { fullName: { $regex: new RegExp(`^${escapedReviewer}$`, 'i') } },
                                { email: { $regex: new RegExp(`^${escapedReviewer}$`, 'i') } },
                            ],
                        })
                            .select('signatureImage')
                            .lean();
                        }
                    } catch (reviewerLookupErr) {
                        console.error('Receipt reviewer signature lookup error:', reviewerLookupErr);
                    }
                }

                const drawSectionBox = (x, top, w, h, radius = 3) => {
                    if (radius > 0) doc.roundedRect(x, top, w, h, radius).lineWidth(0.8).stroke(BORDER_COLOR);
                    else doc.rect(x, top, w, h).lineWidth(0.8).stroke(BORDER_COLOR);
                };
                const drawHeaderLabel = (x, top, w, h, color, label) => {
                    doc.rect(x, top, w, h).fill(color);
                    doc.rect(x, top + h - 2, w, 2).fill(color);
                    const labelSize = 8.2;
                    doc.fillColor('#fff').fontSize(labelSize).font('Helvetica-Bold');
                    doc.text(label, x + 12, top + Math.max(0, (h - labelSize) / 2) + 1.2, { width: w - 24, align: 'center' });
                };
                const lineText = (text, x, top, w, opts = {}) => {
                    doc.fillColor(opts.color || TEXT_DARK).fontSize(opts.size || 7.5).font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').text(text, x, top, { width: w, lineGap: opts.lineGap || 1, align: opts.align || 'left' });
                };

                // Measure text using the exact same font size/weight that will be rendered.
                // This lets variable client/event/narration content expand only when needed,
                // preventing clipping without changing the PDF page size or typography.
                const measureText = (text, w, opts = {}) => {
                    doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(opts.size || 7.5);
                    return doc.heightOfString(String(text ?? ''), {
                        width: w,
                        lineGap: opts.lineGap || 1,
                    });
                };

                let y = mx;

                // Thin outer page border — matches the supplied receipt reference.
                doc.rect(0.6, 0.6, pageW - 1.2, pageH - 1.2)
                    .lineWidth(0.7)
                    .stroke(ACCENT);

                // Header
                const customHeaderPath = resolveUploadPath(receiptSettings.headerLogoImage);
                if (customHeaderPath) {
                    doc.image(customHeaderPath, mx, y, {
                        fit: [mw, headerH],
                        align: 'center',
                        valign: 'center',
                    });
                    doc.rect(mx, y, mw, headerH).lineWidth(0.8).stroke(BORDER_COLOR);
                    y += headerH + sectionGap;
                } else {
                    const headerContentH = Math.max(68, headerH - 24);
                    let logoDrawn = false;
                    if (settings?.logo) {
                        try {
                            const logoPath = path.resolve(__dirname, '..', String(settings.logo).replace(/^\//, ''));
                            if (fs.existsSync(logoPath)) {
                                doc.image(logoPath, mx + 16, y + 12, { fit: [170, Math.min(55, headerContentH - 15)] });
                                logoDrawn = true;
                            }
                        } catch (e) { }
                    }
                    doc.rect(mx - 8, y + 1, 16, headerContentH).fill(ACCENT);
                    if (!logoDrawn) {
                        doc.fillColor(ORANGE).fontSize(18).font('Helvetica-Bold').text('NAMO', mx + 20, y + 18, { continued: true });
                        doc.fillColor('#0070ba').text('GANGE');
                        doc.fillColor(TEXT_MUTED).fontSize(13).font('Helvetica').text('WELLNESS PVT. LTD.', mx + 45, y + 45, { width: 170 });
                    }
                    const headX = mx + 175;
                    const headW = mw - 175;
                    doc.rect(headX, y + 3, headW, headerContentH - 2).fill(ACCENT);
                    doc.fillColor('#fff').fontSize(7).font('Helvetica').text(`${clean(settings?.contactEmail || settings?.receiptContactEmail || 'info@namogangewellness.com')}  |  ${clean(settings?.contactWebsite || 'www.namogangewellness.com')}`, headX + 12, y + 18, { width: headW * 0.58 });
                    doc.text(`GSTIN - ${clean(settings?.companyGst, '09AAFCN9238F1Z6')}  |  CIN No. ${clean(settings?.companyCin, 'U85320DL2018PTC329002')}`, headX + 12, y + 49, { width: headW * 0.58 });
                    doc.moveTo(headX + headW * 0.62, y + 14).lineTo(headX + headW * 0.62, y + headerContentH - 7).lineWidth(0.5).stroke('#dbeafe');
                    doc.fillColor('#fff').fontSize(7.4).font('Helvetica-Bold').text(receiptSettings.headOfficeLabel || 'Head Office:', headX + headW * 0.65, y + 14, { width: headW * 0.32 });
                    doc.font('Helvetica').fontSize(7.1).text(`${clean(settings?.companyName, 'Namo Gange Wellness Pvt. Ltd.')},\n${clean(settings?.companyAddress, '12/52, Site-II, Loni Road Industrial Area, Mohan Nagar, Ghaziabad-201007, Uttar Pradesh, India')}`, headX + headW * 0.65, y + 27, { width: headW * 0.32, lineGap: 1 });
                    y += headerH;
                }

                // Title and receipt meta
                if (String(RECEIPT_TITLE_BAND).toLowerCase() !== '#ffffff') {
                    doc.roundedRect(mx + 70, y - 5, 210, 32, 3).fill(RECEIPT_TITLE_BAND);
                }
                const titleY = y + 8;
                const titleW = 240;
                const titleX = mx + 48;
                doc.fillColor(ACCENT).fontSize(20).font('Helvetica-Bold').text(receiptSettings.receiptTitleLabel || 'PAYMENT RECEIPT', titleX, titleY, { width: titleW, align: 'center' });
                doc.moveTo(titleX + 30, titleY + 25).lineTo(titleX + titleW - 30, titleY + 25).lineWidth(0.6).stroke('#8aa0c7');
                doc.polygon([titleX + titleW / 2, titleY + 21], [titleX + titleW / 2 + 4, titleY + 25], [titleX + titleW / 2, titleY + 29], [titleX + titleW / 2 - 4, titleY + 25]).fill(ACCENT);
                const metaX = mx + 330;
                const metaTop = y + 3;
                [
                    ['Receipt No.', rNo],
                    ['Receipt Date', formattedDate],
                    ['PI Number', clean(registration.registrationId || registration._id?.toString().slice(-8), 'N/A')],
                ].forEach((row, idx) => {
                    // Tight metadata spacing; typography and column widths are unchanged.
                    const yy = metaTop + idx * 13;
                    doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica-Bold').text(row[0], metaX, yy, { width: 68 });
                    doc.text(':', metaX + 70, yy, { width: 8 });
                    doc.font('Helvetica').text(row[1], metaX + 86, yy, { width: mw - (metaX - mx) - 86 });
                });
                y += 44;

                // Event strip - same compact reference look, but expands safely for wrapped content.
                const evThird = mw / 3;
                const eventDisplayName = eventName.replace(/\s*\(?\d{1,2}\s*-\s*\d{1,2}\s+[A-Za-z]+\s+\d{4}\)?\s*/g, '').trim();
                const evRows = [
                    { icon: 'cal', label: 'EVENT NAME', v1: eventDisplayName || eventName, v2: '' },
                    { icon: 'cal', label: 'EVENT DATE', v1: dateStr, v2: '' },
                    { icon: 'pin', label: 'EVENT VENUE', v1: venueText, v2: '' },
                ];
                const eventTextW = evThird - 58;
                const eventNeededH = Math.max(...evRows.map((item) => {
                    const mainH = measureText(item.v1, eventTextW, { size: 7 });
                    const subH = item.v2 ? measureText(item.v2, eventTextW, { size: 7 }) + 2 : 0;
                    return 20 + mainH + subH + 5;
                }));
                const eventBoxH = Math.max(40, Math.min(eventH, Math.ceil(eventNeededH)));

                drawSectionBox(mx, y, mw, eventBoxH, 0);
                evRows.forEach((item, idx) => {
                    const x = mx + evThird * idx;
                    if (idx > 0) {
                        doc.moveTo(x, y + 6).lineTo(x, y + eventBoxH - 6)
                            .lineWidth(0.5).stroke(BORDER_COLOR);
                    }
                    if (item.icon === 'pin') drawPinIcon(x + 23, y + 19, 9.8, ACCENT);
                    else drawCalendarIcon(x + 23, y + 18.5, 9.8, ACCENT);

                    lineText(item.label, x + 48, y + 8, eventTextW, { size: 6.8, bold: true, color: ACCENT });
                    lineText(item.v1, x + 48, y + 19, eventTextW, { size: 6.8 });

                    if (item.v2) {
                        const mainH = measureText(item.v1, eventTextW, { size: 7 });
                        lineText(item.v2, x + 48, y + 24 + mainH, eventTextW, { size: 7 });
                    }
                });
                y += eventBoxH + sectionGap;

                // FROM / TO
                const halfW = (mw - 10) / 2;
                const boxTop = y;
                const rowW = halfW - 24;

                let fromAddr = settings?.companyAddress || '12/52, Site-II, Loni Road, Industrial Area, Mohan Nagar, Ghaziabad - 201007, Uttar Pradesh, India';
                if (settings?.addresses?.length) {
                    const addr = settings.addresses[0];
                    const parts = [addr.street, [addr.city, addr.zipCode].filter(Boolean).join(' - '), addr.state, addr.country].filter(Boolean);
                    if (parts.length) fromAddr = parts.join(', ');
                }
                const exAddr = [
                    registration.address,
                    [registration.city, registration.pincode].filter(Boolean).join(' - '),
                    registration.state,
                    registration.country || 'India',
                ].filter(Boolean).join(', ');
                const organiserWebsite = clean(settings?.contactWebsite, 'www.namogangewellness.com');
                const clientWebsite = clean(registration.website || registration.companyWebsite || registration.websiteUrl, '-');
                const organiserRows = [
                    ['Full Name', generatedByName],
                    ['Mobile No.', generatedByPhone],
                    ['Email', generatedByEmail],
                    ['Website', organiserWebsite],
                    ['GSTIN No.', clean(settings?.companyGst, '09AAFCN9238F1Z6')],
                ];
                const clientRows = [
                    ['Full Name', contactName],
                    ['Mobile No.', clientMobile],
                    ['Email', clientEmail],
                    ['Website', clientWebsite],
                    ['GSTIN No.', hasMsme ? udyamNo : clean(registration.gstNo, 'N/A')],
                ];
                const leftAddressH = measureText(fromAddr, rowW, { size: 7.4, lineGap: 2 });

                const rightPrimaryLines = [];
                if (hasMsme) {
                    rightPrimaryLines.push(`(Udyam Registration No.: ${udyamNo})`);
                    rightPrimaryLines.push('Under MSME PMS Scheme');
                } else {
                    rightPrimaryLines.push(exAddr || '-');
                }

                const rightPrimaryHeights = rightPrimaryLines.map((line) =>
                    measureText(line, rowW, { size: 7.2, lineGap: 2 })
                );

                // Shared compact vertical rhythm for both FROM and TO sections.
                // This keeps both columns visually balanced and removes the large blank middle gap.
                const headerBandH = 16;
                const contentTop = 24;
                const titleStep = 12;
                const afterPrimaryGap = 4;
                const afterDividerGap = 6;
                const rowStep = 11;
                const bottomPadding = 8;

                const rightPrimaryH = hasMsme
                    ? rightPrimaryHeights.reduce((sum, h) => sum + h, 0) + 3
                    : rightPrimaryHeights[0];
                const primaryTextH = Math.max(leftAddressH, rightPrimaryH);

                const rightNeededH =
                    contentTop +
                    titleStep +
                    primaryTextH +
                    afterPrimaryGap +
                    afterDividerGap +
                    clientRows.length * rowStep +
                    bottomPadding;

                const leftAlignedNeededH =
                    contentTop +
                    titleStep +
                    primaryTextH +
                    afterPrimaryGap +
                    afterDividerGap +
                    organiserRows.length * rowStep +
                    bottomPadding;

                // Same height for both boxes; grows only when real content requires it.
                const boxH = Math.min(160, Math.max(112, Math.ceil(Math.max(leftAlignedNeededH, rightNeededH))));
                const drawDetailRows = (rows, x, startY, labelColor) => {
                    let rowY = startY;
                    rows.forEach(([label, value]) => {
                        lineText(label, x + 12, rowY, 62, { size: 7.2, bold: true, color: labelColor });
                        lineText(':', x + 76, rowY, 8, { size: 7.2, bold: true });
                        lineText(value, x + 88, rowY, rowW - 76, { size: 7.2 });
                        rowY += rowStep;
                    });
                    return rowY;
                };

                // ---------------- FROM (ORGANISER) ----------------
                drawHeaderLabel(mx, boxTop, halfW, headerBandH, ORGANISER, 'FROM (Organiser Details)');
                drawSectionBox(mx, boxTop, halfW, boxH, 0);

                let fy = boxTop + contentTop;

                lineText(
                    clean(settings?.companyName || 'Namo Gange Wellness Pvt. Ltd.', 'Namo Gange Wellness Pvt. Ltd.'),
                    mx + 12,
                    fy,
                    rowW,
                    { size: 9.5, bold: true, color: ACCENT }
                );

                fy += titleStep;

                lineText(fromAddr, mx + 12, fy, rowW, { size: 7.4, lineGap: 2 });
                fy += primaryTextH + afterPrimaryGap;

                doc.moveTo(mx + 12, fy)
                    .lineTo(mx + halfW - 22, fy)
                    .lineWidth(0.5)
                    .stroke(BORDER_COLOR);

                fy += afterDividerGap;
                drawDetailRows(organiserRows, mx, fy, ACCENT);

                // ---------------- TO (CLIENT) ----------------
                const rX = mx + halfW + 10;

                drawHeaderLabel(rX, boxTop, halfW, headerBandH, CLIENT_GREEN, 'TO (Client Details)');
                drawSectionBox(rX, boxTop, halfW, boxH, 0);

                let ty = boxTop + contentTop;

                lineText(
                    clean(registration.exhibitorName, 'N/A'),
                    rX + 12,
                    ty,
                    rowW,
                    { size: 9.5, bold: true, color: hasMsme ? CLIENT_GREEN : TEXT_DARK }
                );

                ty += titleStep;

                if (hasMsme) {
                    lineText(
                        `(Udyam Registration No.: ${udyamNo})`,
                        rX + 12,
                        ty,
                        rowW,
                        { size: 7.2 }
                    );
                    ty += rightPrimaryHeights[0] + 3;

                    lineText(
                        'Under MSME PMS Scheme',
                        rX + 12,
                        ty,
                        rowW,
                        { size: 7.2 }
                    );
                    ty += rightPrimaryHeights[1];
                } else {
                    lineText(
                        exAddr || '-',
                        rX + 12,
                        ty,
                        rowW,
                        { size: 7.2, lineGap: 2 }
                    );
                }

                ty = boxTop + contentTop + titleStep + primaryTextH + afterPrimaryGap;

                doc.moveTo(rX + 12, ty)
                    .lineTo(rX + halfW - 22, ty)
                    .lineWidth(0.5)
                    .stroke(BORDER_COLOR);

                ty += afterDividerGap;
                drawDetailRows(clientRows, rX, ty, CLIENT_GREEN);

                y = boxTop + boxH + sectionGap;

                // Payment details table
                const PAYMENT_GREEN = CLIENT_GREEN;
                const PAYMENT_LIGHT = '#edf6ee';
                const PAYMENT_BORDER = '#a9b8ad';
                const paymentHeaderH = headerBandH;
                const rowH = 20;
                const paymentModeFull = normalizeReceiptPaymentMode(paymentMode);
                const paymentModeDisplay = paymentModeFull === 'N/A' ? 'N/A' : `Payment Received By ${paymentModeFull}`;
                const numericReference = String(reference || '').replace(/\D/g, '') || reference;
                const paymentAgainstType = clean(
                    registration.receiptDocumentType ||
                    (String(paymentAgainst).toUpperCase().includes('PI') ? 'Proforma Invoice' : 'Invoice'),
                    'Proforma Invoice'
                );
                const paymentTypeText = clean(accountPayment?.pymnt_type || m.paymentType || m.pymnt_type || p.stallScheme, '');
                const paymentTypeLower = paymentTypeText.toLowerCase();
                const receiptPaymentTypeLabel = paymentTypeLower.includes('running')
                    ? 'Running'
                    : (paymentTypeLower.includes('final') || paymentTypeLower.includes('full'))
                        ? 'Full'
                        : paymentTypeLower.includes('adj')
                            ? 'Adjustment'
                            : 'Advance';
                doc.roundedRect(mx, y, mw, paymentHeaderH, 4).fill(PAYMENT_GREEN);
                doc.rect(mx, y + paymentHeaderH - 2, mw, 2).fill(PAYMENT_GREEN);
                const paymentHeaderLabel = receiptSettings.paymentDetailsLabel || 'PAYMENT DETAILS';
                const paymentHeaderSize = 8.5;
                doc.fillColor('#ffffff').fontSize(paymentHeaderSize).font('Helvetica-Bold');
                doc.text(paymentHeaderLabel, mx, y + Math.max(0, (paymentHeaderH - paymentHeaderSize) / 2) + 1.2, { width: mw, align: 'center' });
                y += paymentHeaderH;
                const paymentColXs = [
                    mx,
                    mx + mw * 0.18,
                    mx + mw * 0.45,
                    mx + mw * 0.59,
                    mx + mw,
                ];
                const paymentGridRows = [
                    [['Amount Received', fmt(totalPaid)], ['Amount in Words', toWords(totalPaid)]],
                    [['Payment Type', receiptPaymentTypeLabel], ['Payment Mode', paymentModeDisplay]],
                    [['Transaction No.', numericReference], ['Transaction Date', paymentDate]],
                    [['Received In Bank', receivedBank], ['Branch', receivedBankBranch || '-']],
                    [['Against Invoice/Proforma', paymentAgainst], ['Document Number', `${paymentAgainstType} / ${fmt(totalPaid)}`]],
                ];
                const paymentTableTop = y;
                const paymentTableH = paymentGridRows.length * rowH;
                doc.rect(mx, paymentTableTop, mw, paymentTableH).lineWidth(0.45).stroke(PAYMENT_BORDER);

                paymentGridRows.forEach((pairs, rowIdx) => {
                    const yy = paymentTableTop + rowIdx * rowH;
                    const rowColXs = paymentColXs;
                    if (rowIdx % 2 === 0) doc.rect(mx, yy, mw, rowH).fill(PAYMENT_LIGHT);
                    doc.rect(mx, yy, mw, rowH).lineWidth(0.45).stroke(PAYMENT_BORDER);
                    for (let c = 1; c < 4; c += 1) {
                        const xLine = rowColXs[c];
                        doc.moveTo(xLine, yy).lineTo(xLine, yy + rowH).lineWidth(0.45).stroke(PAYMENT_BORDER);
                    }

                    pairs.forEach(([label, value], pairIdx) => {
                        const labelX = rowColXs[pairIdx * 2];
                        const valueX = rowColXs[pairIdx * 2 + 1];
                        const labelW = rowColXs[pairIdx * 2 + 1] - labelX;
                        const valueW = rowColXs[pairIdx * 2 + 2] - valueX;
                        doc.fillColor(TEXT_DARK).fontSize(7.1).font('Helvetica-Bold')
                            .text(label, labelX + 8, yy + 5, { width: labelW - 14, height: rowH - 7, lineGap: 0 });
                        doc.fillColor(TEXT_DARK).fontSize(7.1).font('Helvetica')
                            .text(value, valueX + 8, yy + 5, { width: valueW - 14, height: rowH - 7, lineGap: 0, ellipsis: true });
                    });
                });
                y += paymentTableH + sectionGap;

                // Narration
                const stallSizeText = p.stallSize ? `${Number(p.stallSize).toLocaleString('en-IN')} Sq. Mt.` : 'N/A';
                const narrationEventName = eventName
                    .replace(/\s*\(?\d{1,2}\s*[-–]\s*\d{1,2}\s+[A-Za-z]+\s+\d{4}\)?\s*/g, '')
                    .replace(/IHWE\s+Global Edition/i, 'IHWE – Global Edition')
                    .trim();
                const narrationEventRange = formatEventNarrationRange(eventDoc?.startDate, eventDoc?.endDate);
                const narrationVenue = venueText.replace(/Hall Nos?\.\s*12,\s*Pragati Maidan(?:,\s*New Delhi)?(?:\s*[-–]\s*110001)?(?:,\s*Delhi,\s*India)?/i, 'Hall No. 12, Bharat Mandapam (Pragati Maidan), New Delhi');
                const narrationPaymentMode = /neft|rtgs/i.test(paymentModeFull)
                    ? `Bank Transfer (${paymentModeFull})`
                    : sentenceCase(paymentModeFull, 'Bank Transfer');
                const receiptPaymentKind = paymentTypeLower.includes('remaining')
                    ? 'remaining payment'
                    : paymentTypeLower.includes('running')
                        ? 'running payment'
                        : paymentTypeLower.includes('final')
                            ? 'final payment'
                            : paymentTypeLower.includes('full')
                                ? 'full payment'
                        : paymentTypeLower.includes('adj')
                            ? 'adjustment payment'
                            : 'advance payment';
                const narrationInvoiceValue = `Rs. ${fmt(grandTotal)}/-`;
                const narrationPaymentDate = formatLongDate(accountPayment?.payment_date || accountPayment?.neft_date || m.paidAt || registration.updatedAt || Date.now());
                const defaultNarrationText = `Being ${receiptPaymentKind} received from M/s ${clean(registration.exhibitorName, 'N/A')} against Proforma Invoice No. ${paymentAgainst} towards booking of a ${stallSizeText} stall for the ${narrationEventName || eventName}, scheduled from ${narrationEventRange} at ${narrationVenue}. Total Proforma Invoice Value: ${narrationInvoiceValue}. Payment received through ${narrationPaymentMode}${receivedBank !== '-' ? ` in ${receivedBank}` : ''} on ${narrationPaymentDate} vide Transaction No.: ${numericReference}.`;
                const savedNarration = clean(accountPayment?.customNarration || m.customNarration || registration.customNarration, '');
                // Earlier automatic receipts stored only the payment-type word in
                // customNarration. Treat those tokens as automatic, not as a full override.
                const narrationText = /^(advance|full|final|running|remaining)(?:\s+payment)?$/i.test(savedNarration)
                    ? defaultNarrationText
                    : clean(savedNarration, defaultNarrationText);
                const narrationTextH = measureText(narrationText, mw - 58, { size: 7.3, lineGap: 1.5 });
                const narrH = Math.max(58, Math.min(104, Math.ceil(23 + narrationTextH)));

                drawSectionBox(mx, y, mw, narrH, 4);
                const narrationIconY = y + Math.min(36, Math.max(31, narrH / 2));
                doc.roundedRect(mx + 14, narrationIconY - 11, 18, 22, 2).fill(CLIENT_GREEN);
                drawSvgIcon(mx + 23, narrationIconY, ic_doc, 0.42, '#fff');
                lineText('NARRATION', mx + 42, y + 7, 160, { size: 8, bold: true, color: CLIENT_GREEN });
                lineText(narrationText, mx + 42, y + 15, mw - 58, { size: 7.3, lineGap: 1.2 });
                y += narrH + sectionGap;

                // Authorization strip
                // Reserve a dedicated image zone when stamp/signature are enabled.
                // Images are fitted INSIDE the cell instead of touching the bottom border.
                const hasStamp = !!(receiptSettings.showSignatureStamp && receiptSettings.stampImage);
                const preparedSignatureSource = await resolvePdfImageSource(creatorProfile?.signatureImage);
                const reviewedSignatureSource = await resolvePdfImageSource(reviewerProfile?.signatureImage);
                const hasSignature = false;
                const authH = hasStamp ? 52 : (hasSignature ? 50 : 42);
                const authColW = mw / 3;

                drawSectionBox(mx, y, mw, authH, 4);
                const authTabH = 14;
                [0, 1].forEach((i) => {
                    doc.moveTo(mx + authColW * (i + 1), y)
                        .lineTo(mx + authColW * (i + 1), y + authH)
                        .lineWidth(0.5).stroke(BORDER_COLOR);
                });

                const authData = [
                    ['PREPARED BY', preparedByName, formattedDate, preparedSignatureSource, ACCENT],
                    ['REVIEWED BY', reviewedByName, formattedDate, reviewedSignatureSource, CLIENT_GREEN],
                    ['FOR COMPANY', clean(settings?.companyName || 'Namo Gange Wellness Pvt. Ltd.', 'Namo Gange Wellness Pvt. Ltd.'), '', null, PAYMENT_GREEN],
                ];

                authData.forEach((col, idx) => {
                    const x = mx + authColW * idx;
                    doc.rect(x, y, authColW, authTabH).fill(col[4]);
                    doc.fillColor('#ffffff').fontSize(7.2).font('Helvetica-Bold')
                        .text(col[0], x + 6, y + 4, { width: authColW - 12, align: 'center' });
                    lineText(col[1], x + 8, y + 20, authColW - 16, { size: idx === 2 ? 6.8 : 7.2, bold: idx === 2, align: 'center' });

                    if (idx < 2 && col[2]) {
                        lineText(col[2], x + 8, y + 32, authColW - 16, { size: 7.2, align: 'center' });
                    }

                    // Prepared/Reviewed signatures hidden in this compact strip.

                    if (idx === 2 && receiptSettings.showSignatureStamp) {
                        const imageTop = y + 27;
                        const imageBottomPadding = 5;
                        const availableH = Math.max(18, authH - (imageTop - y) - imageBottomPadding);
                        const stampW = receiptSettings.stampImage ? 46 : 0;
                        const sigW = 0;
                        const imageGap = stampW && sigW ? 16 : 0;
                        const groupW = stampW + imageGap + sigW;
                        const groupX = x + (authColW - groupW) / 2;

                        if (receiptSettings.stampImage) {
                            const stampPath = resolveUploadPath(receiptSettings.stampImage);
                            if (stampPath) {
                                doc.image(stampPath, groupX, imageTop, {
                                    fit: [46, Math.min(availableH, 46)],
                                    align: 'center',
                                    valign: 'center',
                                });
                            }
                        }

                        // Signature intentionally hidden; only the centered company stamp is shown.
                        // if (receiptSettings.signatureImage) {
                        //     const sigPath = resolveUploadPath(receiptSettings.signatureImage);
                        //     if (sigPath) {
                        //         doc.image(sigPath, groupX + stampW + imageGap, imageTop, {
                        //             fit: [sigW || 88, Math.min(availableH, 25)],
                        //             align: 'center',
                        //             valign: 'center',
                        //         });
                        //     }
                        // }
                    }
                });

                y += authH;

                const footerBandH = 14;
                const footerY = pageH - mx - footerBandH;
                doc.roundedRect(mx, footerY, mw, footerBandH, 4).fill(PAYMENT_GREEN);
                doc.rect(mx, footerY + footerBandH - 2, mw, 2).fill(PAYMENT_GREEN);
                const footerDisclaimer = receiptSettings.footerDisclaimerText || 'This is a computer generated document and does not require a physical signature.';
                doc.fillColor('#ffffff').fontSize(7.2).font('Helvetica').text(footerDisclaimer, mx, footerY + 4, {
                    width: mw,
                    align: 'center',
                    lineGap: 1,
                });
                doc.font('Helvetica-Bold').text('Page 1 of 1', mx + 8, footerY + 4, {
                    width: mw - 16,
                    align: 'right',
                });

                if (receiptSettings.footerThankYouText) {
                    doc.fillColor(NOTE_COLOR).fontSize(8).font('Helvetica-Bold').text(receiptSettings.footerThankYouText, mx, footerY - 16, {
                        width: mw,
                        align: 'center',
                    });
                }

                // Single-page safety: with the compact reference spacing above, content should
                // stay inside A4. This warning makes unexpected oversized data visible in logs.
                if (y > pageH - 18) {
                    console.warn(`[PaymentReceipt] Content reached ${Math.round(y)}pt on ${Math.round(pageH)}pt A4 page for ${safeReceiptBase}`);
                }

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
                    { label: 'Document Number.', w: tW * 0.16 },
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
