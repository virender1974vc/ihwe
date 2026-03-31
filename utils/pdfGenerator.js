const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const TEMP_DIR = path.join(__dirname, '..', 'temp');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

class PDFGenerator {
    async generateRegistrationForm(registration) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50, size: 'A4' });
                const fileName = `registration_${registration._id}.pdf`;
                const filePath = path.join(TEMP_DIR, fileName);
                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);
                this._header(doc, 'EXHIBITOR REGISTRATION FORM');
                doc.moveDown(0.5);
                doc.fontSize(9).fillColor('#555').text(`Date: ${new Date().toLocaleString('en-IN')}`, { align: 'right' });
                doc.moveDown(1.5);

                // ─────────── CORPORATE IDENTITY ───────────
                this._sectionHeader(doc, 'CORPORATE IDENTITY');
                this._row(doc, 'Company Name', registration.exhibitorName);
                this._row(doc, 'Fascia Name (On Stall)', registration.fasciaName);
                this._row(doc, 'Business Type', registration.typeOfBusiness);
                this._row(doc, 'Industry Sector', registration.industrySector);
                this._row(doc, 'Nature of Business', registration.natureOfBusiness);
                this._row(doc, 'Website', registration.website);
                this._row(doc, 'GST Number', registration.gstNo);
                this._row(doc, 'PAN Number', registration.panNo);
                doc.moveDown(0.5);

                // ─────────── ADDRESS ───────────
                this._sectionHeader(doc, 'ADDRESS');
                this._row(doc, 'Address', registration.address);
                this._row(doc, 'City', registration.city);
                this._row(doc, 'State', registration.state);
                this._row(doc, 'Country', registration.country);
                this._row(doc, 'Pincode', registration.pincode);
                doc.moveDown(0.5);

                // ─────────── PRIMARY CONTACT ───────────
                const c1 = registration.contact1 || {};
                this._sectionHeader(doc, 'PRIMARY CONTACT PERSON');
                this._row(doc, 'Name', `${c1.title || ''} ${c1.firstName || ''} ${c1.lastName || ''}`.trim());
                this._row(doc, 'Designation', c1.designation);
                this._row(doc, 'Email', c1.email);
                this._row(doc, 'Mobile', c1.mobile);
                doc.moveDown(0.5);

                // ─────────── PARTICIPATION ───────────
                const p = registration.participation || {};
                this._sectionHeader(doc, 'PARTICIPATION DETAILS');
                this._row(doc, 'Stall Number', p.stallFor || p.stallNo);
                this._row(doc, 'Category', p.stallCategory);
                this._row(doc, 'Type', p.stallType);
                this._row(doc, 'Area', `${p.stallSize || 0} SQM`);
                this._row(doc, 'Dimensions', p.dimension);
                doc.moveDown(0.5);

                // ─────────── FINANCIALS ───────────
                this._sectionHeader(doc, 'FINANCIAL SUMMARY');
                const currency = registration.currency === 'USD' ? 'USD $' : 'INR ₹';
                const net = p.amount || 0;
                const gstAmt = (p.total || 0) - net;
                this._row(doc, 'Space Charges (Net)', `${currency} ${net.toLocaleString()}`);
                this._row(doc, 'GST @ 18%', `${currency} ${gstAmt.toLocaleString()}`);
                doc.moveDown(0.3);
                doc.fontSize(11).font('Helvetica-Bold').fillColor('#23471d')
                    .text(`GRAND TOTAL: ${currency} ${(p.total || 0).toLocaleString()}`, { align: 'right' });
                doc.fillColor('#000').font('Helvetica');
                doc.moveDown(2);

                // ─────────── FOOTER ───────────
                doc.fontSize(8).fillColor('#aaa')
                    .text('This is a system-generated registration form. Please retain for your records.', { align: 'center' });

                doc.end();
                stream.on('finish', () => resolve(filePath));
                stream.on('error', reject);
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Generates a professional Payment Receipt PDF.
     * Returns the absolute path to the generated file.
     */
    async generatePaymentSlip(registration) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50, size: 'A4' });
                const fileName = `receipt_${registration._id}_${Date.now()}.pdf`;
                const filePath = path.join(TEMP_DIR, fileName);
                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                const receiptNo = `REC-${registration._id.toString().slice(-6).toUpperCase()}`;
                const currency = registration.currency === 'USD' ? 'USD $' : 'INR ₹';

                // ─────────── HEADER ───────────
                this._header(doc, 'OFFICIAL PAYMENT RECEIPT');
                doc.moveDown(0.5);
                doc.fontSize(9).fillColor('#555')
                    .text(`Receipt No: ${receiptNo}`, { align: 'right' })
                    .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
                doc.moveDown(1.5);

                // ─────────── RECEIVED FROM ───────────
                doc.fontSize(11).font('Helvetica').fillColor('#000')
                    .text('Received with thanks from: ', { continued: true })
                    .font('Helvetica-Bold').text(registration.exhibitorName);
                doc.font('Helvetica').moveDown(0.5);
                doc.text(`Amount: `, { continued: true })
                    .font('Helvetica-Bold').text(`${currency} ${(registration.amountPaid || 0).toLocaleString()} /-`);
                doc.font('Helvetica').moveDown(0.5);
                doc.text(`Towards: `, { continued: true })
                    .font('Helvetica-Bold')
                    .text(`Stall Booking – ${registration.participation?.stallFor || registration.participation?.stallNo} – Global Healthcare Excellence 2026`);
                doc.font('Helvetica').moveDown(1.5);

                // ─────────── PAYMENT DETAILS ───────────
                this._sectionHeader(doc, 'PAYMENT DETAILS');
                const m = registration.manualPaymentDetails || {};
                this._row(doc, 'Payment Method', m.method || registration.paymentMode || 'Online');
                this._row(doc, 'Transaction / Ref ID', m.transactionId || registration.paymentId || 'N/A');
                this._row(doc, 'Payment Status', 'VERIFIED ✓');
                if (m.notes) this._row(doc, 'Admin Notes', m.notes);
                doc.moveDown(0.5);

                // ─────────── BALANCE ───────────
                const balance = (registration.participation?.total || 0) - (registration.amountPaid || 0);
                if (balance > 0) {
                    this._sectionHeader(doc, 'OUTSTANDING BALANCE');
                    this._row(doc, 'Total Contract Value', `${currency} ${(registration.participation?.total || 0).toLocaleString()}`);
                    this._row(doc, 'Amount Paid', `${currency} ${(registration.amountPaid || 0).toLocaleString()}`);
                    doc.fontSize(11).font('Helvetica-Bold').fillColor('#d26019')
                        .text(`PENDING: ${currency} ${balance.toLocaleString()}`, { align: 'right' });
                    doc.fillColor('#000').font('Helvetica');
                    doc.moveDown(0.5);
                }

                // ─────────── FOOTER ───────────
                doc.moveDown(3);
                doc.fontSize(8).fillColor('#aaa')
                    .text('This is a computer-generated receipt and does not require a physical signature.', { align: 'center' });

                doc.end();
                stream.on('finish', () => resolve(filePath));
                stream.on('error', reject);
            } catch (err) {
                reject(err);
            }
        });
    }

    _header(doc, title) {
        doc.fillColor('#23471d').fontSize(20).font('Helvetica-Bold').text(title, { align: 'center' });
        doc.fillColor('#d26019').rect(50, doc.y + 4, doc.page.width - 100, 2).fill();
        doc.fillColor('#000').font('Helvetica').moveDown(1);
    }

    _sectionHeader(doc, title) {
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#d26019')
            .text(title.toUpperCase(), { characterSpacing: 1 });
        doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke('#e2e8f0');
        doc.moveDown(0.4).fillColor('#000').font('Helvetica');
    }

    _row(doc, label, value) {
        doc.fontSize(10);
        const yPos = doc.y;
        doc.font('Helvetica-Bold').fillColor('#555').text(label + ':', 50, yPos, { width: 180, continued: false });
        doc.font('Helvetica').fillColor('#000').text(value || 'N/A', 240, yPos, { width: 300 });
        doc.moveDown(0.2);
    }
}

module.exports = new PDFGenerator();
