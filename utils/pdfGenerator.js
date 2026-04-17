const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const TEMP_DIR = path.join(__dirname, '..', 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// Get public URL for a temp PDF - served via /temp static route in server.js
function getTempPdfUrl(filePath) {
    const fileName = path.basename(filePath);
    const backendUrl = (process.env.BACKEND_URL || process.env.SITE_URL || 'http://localhost:5000').replace(/\/$/, '');
    return `${backendUrl}/temp/${fileName}`;
}

const HEADER_IMG = path.join(__dirname, '..', 'uploads', 'email-templates', '1776243243412-WhatsApp-Image-2026-04-15-at-12.00.08-PM.jpeg');
const FOOTER_IMG = path.join(__dirname, '..', 'uploads', 'email-templates', '1776243243418-WhatsApp-Image-2026-04-15-at-12.00.27-PM.jpeg');

const GREEN  = '#23471d';
const ORANGE = '#d26019';
const GRAY   = '#6b7280';
const LGRAY  = '#f3f4f6';
const DARK   = '#111827';
const WHITE  = '#ffffff';

class PDFGenerator {

    // ─── shared helpers ───────────────────────────────────────────────────────

    _headerImg(doc) {
        if (fs.existsSync(HEADER_IMG)) {
            doc.image(HEADER_IMG, 0, 0, { width: doc.page.width });
            doc.y = doc.page.width * (9 / 16) * 0.38; // approx header height
        } else {
            // fallback green bar
            doc.rect(0, 0, doc.page.width, 80).fill(GREEN);
            doc.fillColor(WHITE).fontSize(18).font('Helvetica-Bold')
               .text('9th International Health & Wellness Expo 2026', 30, 28, { width: doc.page.width - 60, align: 'center' });
            doc.y = 90;
        }
    }

    _footerImg(doc) {
        const pageH = doc.page.height;
        const pageW = doc.page.width;
        if (fs.existsSync(FOOTER_IMG)) {
            // footer image at bottom
            const fH = 70;
            doc.image(FOOTER_IMG, 0, pageH - fH, { width: pageW });
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

    // ─── Registration Form ────────────────────────────────────────────────────

    async generateRegistrationForm(registration) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 0, size: 'A4' });
                const filePath = path.join(TEMP_DIR, `registration_${registration._id}.pdf`);
                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                const pageW = doc.page.width;
                const p   = registration.participation || {};
                const c1  = registration.contact1 || {};
                const cur = p.currency === 'USD' ? 'USD ' : 'INR ';
                const fmt = (n) => `${cur}${Number(n || 0).toLocaleString('en-IN')}`;

                // ── Header image ──
                this._headerImg(doc);
                let y = doc.y + 10;

                // ── Document title strip ──
                doc.rect(40, y, pageW - 80, 22).fill(GREEN);
                doc.fillColor(WHITE).fontSize(11).font('Helvetica-Bold')
                   .text('EXHIBITOR REGISTRATION FORM', 40, y + 6, { width: pageW - 80, align: 'center' });
                y += 30;

                // ── Meta row ──
                doc.fillColor(GRAY).fontSize(8).font('Helvetica')
                   .text(`Reg ID: ${registration.registrationId || 'N/A'}`, 40, y)
                   .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 0, y, { width: pageW - 40, align: 'right' });
                y += 16;
                this._line(doc, 40, y, pageW - 40);
                y += 8;

                // ── Two-column: IHWE details | Client details ──
                const colW = (pageW - 100) / 2;
                const lx = 40, rx = 60 + colW;

                // Left box - IHWE / FROM
                doc.rect(lx, y, colW, 100).lineWidth(0.5).stroke('#e5e7eb');
                this._label(doc, 'From', lx + 8, y + 8, colW - 16);
                doc.fillColor(GREEN).fontSize(10).font('Helvetica-Bold')
                   .text('IHWE 2026 – Organizer', lx + 8, y + 20, { width: colW - 16 });
                doc.fillColor(GRAY).fontSize(8).font('Helvetica')
                   .text('Namo Gange Wellness Pvt. Ltd.', lx + 8, y + 34, { width: colW - 16 })
                   .text('Pragati Maidan, New Delhi – 110001', lx + 8, y + 46, { width: colW - 16 })
                   .text('India', lx + 8, y + 58, { width: colW - 16 })
                   .text('info@ihwe.in  |  +91-9654900525', lx + 8, y + 70, { width: colW - 16 })
                   .text('www.ihwe.in', lx + 8, y + 82, { width: colW - 16 });

                // Right box - Client / TO
                doc.rect(rx, y, colW, 100).lineWidth(0.5).stroke('#e5e7eb');
                this._label(doc, 'To (Exhibitor)', rx + 8, y + 8, colW - 16);
                doc.fillColor(ORANGE).fontSize(10).font('Helvetica-Bold')
                   .text(registration.exhibitorName || 'N/A', rx + 8, y + 20, { width: colW - 16 });
                doc.fillColor(GRAY).fontSize(8).font('Helvetica')
                   .text(registration.typeOfBusiness || '', rx + 8, y + 34, { width: colW - 16 })
                   .text([registration.address, registration.city, registration.state].filter(Boolean).join(', '), rx + 8, y + 46, { width: colW - 16 })
                   .text(`${registration.country || ''} ${registration.pincode ? '– ' + registration.pincode : ''}`, rx + 8, y + 58, { width: colW - 16 })
                   .text(c1.mobile || '', rx + 8, y + 70, { width: colW - 16 })
                   .text(c1.email || '', rx + 8, y + 82, { width: colW - 16 });

                y += 108;

                // ── Stall & Event info row ──
                const infoW = (pageW - 80) / 4;
                const infos = [
                    { label: 'Stall No.', value: p.stallFor || 'N/A' },
                    { label: 'Stall Type', value: p.stallType || 'N/A' },
                    { label: 'Stall Size', value: p.stallSize ? `${p.stallSize} SQM` : 'N/A' },
                    { label: 'Event', value: registration.eventId?.name || 'IHWE 2026' },
                ];
                infos.forEach((info, i) => {
                    const ix = 40 + i * infoW;
                    doc.rect(ix, y, infoW - 4, 36).fill(LGRAY);
                    this._label(doc, info.label, ix + 6, y + 6, infoW - 12);
                    doc.fillColor(GREEN).fontSize(9).font('Helvetica-Bold')
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

                // Table row
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

                const summaryRows = [
                    { label: 'Base Amount', value: fmt(p.amount) },
                    { label: `GST @ ${p.gstPercent || 18}%`, value: fmt((p.total || 0) - (p.amount || 0)) },
                ];
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
                   .text(fmt(p.total), sumX + sumW * 0.5, y + 7, { width: sumW * 0.5 - 8, align: 'right' });
                y += 32;

                // ── Contact & CRM ──
                this._line(doc, 40, y, pageW - 40);
                y += 8;
                const cW = (pageW - 80) / 3;
                [
                    { label: 'Contact Person', value: `${c1.title || ''} ${c1.firstName || ''} ${c1.lastName || ''}`.trim() },
                    { label: 'Mobile', value: c1.mobile },
                    { label: 'Referred By', value: registration.referredBy || 'Direct' },
                ].forEach((item, i) => {
                    this._label(doc, item.label, 40 + i * cW, y, cW - 8);
                    this._value(doc, item.value, 40 + i * cW, y + 12, cW - 8);
                });
                y += 30;

                // ── Status badge ──
                const statusColors = { pending: '#f59e0b', approved: '#22c55e', paid: GREEN, 'advance-paid': '#0891b2', confirmed: '#3b82f6', rejected: '#ef4444', 'payment-failed': '#dc2626' };
                doc.rect(40, y, 130, 22).fill(statusColors[registration.status] || GRAY);
                doc.fillColor(WHITE).fontSize(9).font('Helvetica-Bold')
                   .text(`STATUS: ${(registration.status || 'PENDING').toUpperCase()}`, 40, y + 7, { width: 130, align: 'center' });

                // ── Footer image ──
                this._footerImg(doc);

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

    async generatePaymentSlip(registration) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 0, size: 'A4' });
                const filePath = path.join(TEMP_DIR, `receipt_${registration._id}_${Date.now()}.pdf`);
                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                const pageW = doc.page.width;
                const p   = registration.participation || {};
                const m   = registration.manualPaymentDetails || {};
                const cur = p.currency === 'USD' ? 'USD ' : 'INR ';
                const fmt = (n) => `${cur}${Number(n || 0).toLocaleString('en-IN')}`;
                const receiptNo = `REC-${registration._id.toString().slice(-8).toUpperCase()}`;

                // ── Header image ──
                this._headerImg(doc);
                let y = doc.y + 10;

                // ── Title strip ──
                doc.rect(40, y, pageW - 80, 22).fill(GREEN);
                doc.fillColor(WHITE).fontSize(11).font('Helvetica-Bold')
                   .text('OFFICIAL PAYMENT RECEIPT', 40, y + 6, { width: pageW - 80, align: 'center' });
                y += 30;

                // ── Meta ──
                doc.fillColor(GRAY).fontSize(8).font('Helvetica')
                   .text(`Receipt No: ${receiptNo}`, 40, y)
                   .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 0, y, { width: pageW - 40, align: 'right' });
                y += 16;
                this._line(doc, 40, y, pageW - 40);
                y += 8;

                // ── Two-column: FROM | TO ──
                const colW = (pageW - 100) / 2;
                const lx = 40, rx = 60 + colW;

                doc.rect(lx, y, colW, 90).lineWidth(0.5).stroke('#e5e7eb');
                this._label(doc, 'From', lx + 8, y + 8, colW - 16);
                doc.fillColor(GREEN).fontSize(10).font('Helvetica-Bold')
                   .text('IHWE 2026 – Organizer', lx + 8, y + 20, { width: colW - 16 });
                doc.fillColor(GRAY).fontSize(8).font('Helvetica')
                   .text('Namo Gange Wellness Pvt. Ltd.', lx + 8, y + 34, { width: colW - 16 })
                   .text('Pragati Maidan, New Delhi – 110001', lx + 8, y + 46, { width: colW - 16 })
                   .text('info@ihwe.in  |  +91-9654900525', lx + 8, y + 58, { width: colW - 16 })
                   .text('www.ihwe.in', lx + 8, y + 70, { width: colW - 16 });

                doc.rect(rx, y, colW, 90).lineWidth(0.5).stroke('#e5e7eb');
                this._label(doc, 'To (Exhibitor)', rx + 8, y + 8, colW - 16);
                doc.fillColor(ORANGE).fontSize(10).font('Helvetica-Bold')
                   .text(registration.exhibitorName || 'N/A', rx + 8, y + 20, { width: colW - 16 });
                const c1 = registration.contact1 || {};
                doc.fillColor(GRAY).fontSize(8).font('Helvetica')
                   .text([registration.address, registration.city, registration.state].filter(Boolean).join(', '), rx + 8, y + 34, { width: colW - 16 })
                   .text(`${registration.country || ''} ${registration.pincode ? '– ' + registration.pincode : ''}`, rx + 8, y + 46, { width: colW - 16 })
                   .text(c1.mobile || '', rx + 8, y + 58, { width: colW - 16 })
                   .text(c1.email || '', rx + 8, y + 70, { width: colW - 16 });
                y += 98;

                // ── Receipt meta row ──
                const metaW = (pageW - 80) / 3;
                [
                    { label: 'Receipt No.', value: receiptNo },
                    { label: 'Registration ID', value: registration.registrationId || 'N/A' },
                    { label: 'Receipt Date', value: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
                ].forEach((item, i) => {
                    this._label(doc, item.label, 40 + i * metaW, y, metaW - 8);
                    doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold')
                       .text(item.value, 40 + i * metaW, y + 12, { width: metaW - 8 });
                });
                y += 32;
                this._line(doc, 40, y, pageW - 40);
                y += 8;

                // ── Items table ──
                const tW = pageW - 80;
                const cols = [
                    { label: 'Item / Description', w: tW * 0.42 },
                    { label: 'Stall No.', w: tW * 0.13 },
                    { label: 'Size', w: tW * 0.10 },
                    { label: 'Rate/SQM', w: tW * 0.15, align: 'right' },
                    { label: 'Amount', w: tW * 0.20, align: 'right' },
                ];
                doc.rect(40, y, tW, 18).fill(DARK);
                let tx = 40;
                cols.forEach(col => {
                    doc.fillColor(WHITE).fontSize(8).font('Helvetica-Bold')
                       .text(col.label, tx + 4, y + 5, { width: col.w - 8, align: col.align || 'left' });
                    tx += col.w;
                });
                y += 18;

                y = this._tableRow(doc, [
                    { text: `${p.stallType || 'Shell Space'} – ${registration.eventId?.name || 'IHWE 2026'}`, w: tW * 0.42 },
                    { text: p.stallFor || 'N/A', w: tW * 0.13 },
                    { text: p.stallSize ? `${p.stallSize} sqm` : 'N/A', w: tW * 0.10 },
                    { text: fmt(p.rate), w: tW * 0.15, align: 'right' },
                    { text: fmt(p.amount), w: tW * 0.20, align: 'right' },
                ], y, '#f9fafb');
                this._line(doc, 40, y, 40 + tW, '#e5e7eb');
                y += 8;

                // ── Payment details (left) + Summary (right) - same starting y ──
                const sectionStartY = y;
                const pdW = tW * 0.50;
                const sumX = 40 + pdW + 10;
                const sumW = tW * 0.50 - 10;

                // LEFT: Payment Details
                this._label(doc, 'Payment Details', 40, sectionStartY, pdW);
                const txId = m.transactionId || registration.paymentId || 'N/A';
                const orderId = registration.razorpayOrderId || 'N/A';
                const payDetails = [
                    { label: 'Payment Mode',         value: (registration.paymentMode || 'N/A').toUpperCase() },
                    { label: 'Payment Type',         value: (registration.paymentType || 'full').toUpperCase() },
                    { label: 'Transaction / Ref ID', value: txId },
                    { label: 'Method',               value: m.method || (registration.paymentMode === 'online' ? 'Razorpay (Online)' : 'Manual') },
                ];
                let pdy = sectionStartY + 14;
                payDetails.forEach(pd => {
                    doc.rect(40, pdy, pdW, 16).fill(pdy % 32 === 0 ? LGRAY : WHITE);
                    doc.fillColor(GRAY).fontSize(7).font('Helvetica-Bold')
                       .text(pd.label, 44, pdy + 4, { width: pdW * 0.44 });
                    doc.fillColor(DARK).fontSize(8).font('Helvetica')
                       .text(pd.value, 44 + pdW * 0.44, pdy + 4, { width: pdW * 0.54 - 8 });
                    pdy += 17;
                });

                // RIGHT: Financial Summary
                let sy = sectionStartY;
                this._label(doc, 'Financial Summary', sumX, sy, sumW);
                sy += 14;

                const summaryRows = [
                    { label: 'Base Amount',              value: fmt(p.amount),                  bg: WHITE },
                    { label: `GST @ ${p.gstPercent || 18}%`, value: fmt((p.total || 0) - (p.amount || 0)), bg: LGRAY },
                    { label: 'Contract Total',           value: fmt(p.total),                   bg: WHITE },
                ];
                summaryRows.forEach(row => {
                    doc.rect(sumX, sy, sumW, 16).fill(row.bg);
                    doc.fillColor(GRAY).fontSize(8).font('Helvetica')
                       .text(row.label, sumX + 6, sy + 4, { width: sumW * 0.55 });
                    doc.fillColor(DARK).fontSize(8).font('Helvetica-Bold')
                       .text(row.value, sumX + sumW * 0.55, sy + 4, { width: sumW * 0.45 - 6, align: 'right' });
                    sy += 17;
                });

                // Amount Paid box
                doc.rect(sumX, sy, sumW, 20).fill('#f0fdf4');
                doc.fillColor(GREEN).fontSize(9).font('Helvetica-Bold')
                   .text('AMOUNT PAID', sumX + 6, sy + 6, { width: sumW * 0.55 })
                   .text(fmt(registration.amountPaid), sumX + sumW * 0.55, sy + 6, { width: sumW * 0.45 - 6, align: 'right' });
                sy += 21;

                // Balance box
                const hasBalance = (registration.balanceAmount || 0) > 0;
                doc.rect(sumX, sy, sumW, 20).fill(hasBalance ? '#fef2f2' : '#f0fdf4');
                doc.fillColor(hasBalance ? '#dc2626' : GREEN).fontSize(9).font('Helvetica-Bold')
                   .text('BALANCE DUE', sumX + 6, sy + 6, { width: sumW * 0.55 })
                   .text(fmt(registration.balanceAmount), sumX + sumW * 0.55, sy + 6, { width: sumW * 0.45 - 6, align: 'right' });
                sy += 21;

                y = Math.max(pdy, sy) + 10;
                y += 8;
                this._line(doc, 40, y, pageW - 40);
                y += 10;

                const statusColor = hasBalance ? '#f59e0b' : GREEN;
                doc.rect(40, y, 160, 26).fill(statusColor);
                doc.fillColor(WHITE).fontSize(10).font('Helvetica-Bold')
                   .text(hasBalance ? 'ADVANCE PAID' : 'PAYMENT VERIFIED', 40, y + 8, { width: 160, align: 'center' });

                if (hasBalance) {
                    doc.fillColor('#dc2626').fontSize(8).font('Helvetica-Bold')
                       .text(`Balance of ${fmt(registration.balanceAmount)} is pending.`, 210, y + 10, { width: pageW - 260 });
                }

                // ── Footer image ──
                this._footerImg(doc);

                stream.on('finish', () => {
                    const publicUrl = getTempPdfUrl(filePath);
                    resolve({ filePath, cloudUrl: publicUrl });
                });
                stream.on('error', reject);
                doc.end();
            } catch (err) { reject(err); }
        });
    }

    // ─── Accessory Order Receipt ──────────────────────────────────────────────

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
                doc.fillColor(GREEN).fontSize(10).font('Helvetica-Bold').text('IHWE 2026 – Organizer', lx + 8, y + 20, { width: colW - 16 });
                doc.fillColor(GRAY).fontSize(8).font('Helvetica')
                   .text('Namo Gange Wellness Pvt. Ltd.', lx + 8, y + 34, { width: colW - 16 })
                   .text('Pragati Maidan, New Delhi – 110001', lx + 8, y + 46, { width: colW - 16 })
                   .text('info@ihwe.in  |  +91-9654900525', lx + 8, y + 58, { width: colW - 16 });

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

                this._footerImg(doc);
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
