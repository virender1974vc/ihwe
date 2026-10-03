const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');

// Buyer leads hold personal contact data and create Accounts documents — admin login required.
router.use(authMiddleware);
const BuyerRegistration = require('../models/BuyerRegistration');
const InternationalBuyer = require('../models/InternationalBuyer');
const Estimate = require('../models/Estimate');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const { addEstimate, updateEstimate } = require('../controllers/estimateController');
const { createInvoice, buildInvoiceItemsFromEstimate } = require('../controllers/invoiceController');
const { addPayment } = require('../controllers/paymentController');

// Buyer leads and buyer registrations share ONE collection per buyer type:
//   domestic      -> BuyerRegistration
//   international -> InternationalBuyer
// A lead is a document with isLead: true. A buyer is "Converted" once paymentStatus is
// 'Completed' — whether it came from the website, the admin form or a lead that later paid.
const MODELS = { domestic: BuyerRegistration, international: InternationalBuyer };
const PIPELINE_FIELDS = ['leadStatus', 'followUpDate', 'assignedTo', 'remarks'];

const toRow = (doc, kind) => {
    const d = doc.toObject ? doc.toObject() : doc;
    const intl = kind === 'international';
    const converted = d.paymentStatus === 'Completed';
    return {
        _id: d._id,
        kind,
        isLead: !!d.isLead,
        registrationId: d.registrationId || '',
        eventName: d.eventName || '',
        companyName: intl ? d.brandName : d.companyName,
        contactPerson: intl ? d.primaryContact?.fullName : d.fullName,
        designation: intl ? d.primaryContact?.designation : d.designation,
        mobileNumber: intl ? d.primaryContact?.mobileNumber : d.mobileNumber,
        email: intl ? d.primaryContact?.emailId : d.emailAddress,
        country: d.country || '',
        state: d.stateProvince || '',
        city: d.city || '',
        productInterest: intl ? (d.productCategories || []).join(', ') : d.primaryProductInterest || '',
        source: d.leadSource || (d.isLead ? 'Direct' : 'Registration'),
        paymentStatus: d.paymentStatus || 'Pending',
        status: converted ? 'Converted' : d.leadStatus || 'New Lead',
        followUpDate: d.followUpDate || null,
        assignedTo: d.assignedTo || '',
        remarks: d.remarks || '',
        createdAt: d.createdAt,
        website: d.website || '',
        address: intl ? d.address : d.registeredAddress || '',
        pinCode: intl ? d.postalCode : d.pinCode || '',
        registrationCategory: intl ? '' : d.registrationCategory || '',
        activity: (d.leadActivity || []).slice().reverse(),
    };
};

// Every buyer (leads + registrations, both types) as pipeline rows.
router.get('/', async (req, res) => {
    try {
        const [domestic, international] = await Promise.all([
            BuyerRegistration.find().lean(),
            InternationalBuyer.find().lean(),
        ]);
        const data = [
            ...domestic.map((d) => toRow(d, 'domestic')),
            ...international.map((d) => toRow(d, 'international')),
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json({ success: true, data });
    } catch (err) {
        console.error('Error fetching buyer leads:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Which buyer (if any) a companyId belongs to — lets the shared PI/Invoice views detect buyer documents.
router.get('/resolve/:id', async (req, res) => {
    try {
        for (const kind of Object.keys(MODELS)) {
            if (await MODELS[kind].exists({ _id: req.params.id })) return res.json({ success: true, kind });
        }
        res.status(404).json({ success: false });
    } catch (err) {
        res.status(404).json({ success: false });
    }
});

// One buyer with its pipeline history (for the Buyer Lead overview page).
router.get('/:kind/:id', async (req, res) => {
    try {
        const Model = MODELS[req.params.kind];
        if (!Model) return res.status(400).json({ success: false, message: 'Invalid buyer type' });
        const doc = await Model.findById(req.params.id);
        if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: toRow(doc, req.params.kind) });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Add a lead (a minimal buyer record with isLead: true).
router.post('/', async (req, res) => {
    try {
        const b = req.body;
        const kind = b.buyerType === 'International' ? 'international' : 'domestic';
        const common = {
            isLead: true,
            eventName: b.eventName || 'IHWE 2026',
            leadStatus: b.status && b.status !== 'Converted' ? b.status : 'New Lead',
            followUpDate: b.followUpDate || null,
            assignedTo: b.assignedTo,
            leadSource: b.source,
            remarks: b.remarks,
            country: b.country,
            stateProvince: b.state,
            city: b.city,
            createdBy: req.user?.username || req.user?.name || null,
        };
        const doc = kind === 'international'
            ? {
                ...common,
                brandName: b.companyName,
                primaryContact: { fullName: b.contactPerson, designation: b.designation, mobileNumber: b.mobileNumber, emailId: b.email },
                productCategories: b.productInterest ? [b.productInterest] : [],
            }
            : {
                ...common,
                companyName: b.companyName,
                fullName: b.contactPerson,
                designation: b.designation,
                mobileNumber: b.mobileNumber,
                emailAddress: b.email,
                primaryProductInterest: b.productInterest,
            };
        const saved = await MODELS[kind].create(doc);
        res.status(201).json({ success: true, data: toRow(saved, kind) });
    } catch (err) {
        const status = err.name === 'ValidationError' ? 400 : 500;
        res.status(status).json({ success: false, message: status === 400 ? err.message : 'Server Error' });
    }
});

// Pipeline fields only — registration data is edited from the buyer pages.
router.put('/:kind/:id', async (req, res) => {
    try {
        const Model = MODELS[req.params.kind];
        if (!Model) return res.status(400).json({ success: false, message: 'Invalid buyer type' });
        const update = {};
        PIPELINE_FIELDS.forEach((k) => {
            if (req.body[k] === undefined) return;
            update[k] = k === 'followUpDate' && req.body[k] === '' ? null : req.body[k];
        });
        const entry = {
            status: update.leadStatus,
            remark: req.body.remark || undefined,
            assignedTo: update.assignedTo,
            followUpDate: update.followUpDate || undefined,
            by: req.user?.username || req.user?.name || 'Admin',
        };
        const hasEntry = entry.status || entry.remark || entry.assignedTo || entry.followUpDate;
        const doc = await Model.findByIdAndUpdate(
            req.params.id,
            { $set: update, ...(hasEntry ? { $push: { leadActivity: entry } } : {}) },
            { new: true, runValidators: true },
        );
        if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: toRow(doc, req.params.kind) });
    } catch (err) {
        const status = err.name === 'ValidationError' ? 400 : 500;
        res.status(status).json({ success: false, message: status === 400 ? err.message : 'Server Error' });
    }
});

// Only open leads can be removed here; registered buyers are deleted from the buyer lists.
router.delete('/:kind/:id', async (req, res) => {
    try {
        const Model = MODELS[req.params.kind];
        if (!Model) return res.status(400).json({ success: false, message: 'Invalid buyer type' });
        const doc = await Model.findOneAndDelete({ _id: req.params.id, isLead: true });
        if (!doc) return res.status(404).json({ success: false, message: 'Lead not found (registered buyers cannot be deleted here)' });
        res.json({ success: true, message: 'Lead deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// ---------------------------------------------------------------------------------------------
// Accounts for a buyer — PI, Invoice and Payment Received.
// These reuse the exhibitor Accounts documents and their number series untouched (Estimate =
// "NGW/<FY>/PI/nnn", Invoice = "NGW/<FY>/nnn", Payment = "RCP/<FY>/nnnn"); the buyer's _id is
// stored as companyId. Payment received moves the buyer to Converted (utils/buyerPaymentSync).
// ---------------------------------------------------------------------------------------------
const num = (v) => Number(v) || 0;
const round2 = (v) => Math.round((num(v) + Number.EPSILON) * 100) / 100;
const isCancelled = (doc) => String(doc?.status || '').toLowerCase() === 'cancelled';

const loadBuyer = async (kind, id) => {
    const Model = MODELS[kind];
    if (!Model) return null;
    const doc = await Model.findById(id);
    return doc ? { doc, row: toRow(doc, kind) } : null;
};

// Billing details every Accounts document carries, taken from the buyer record.
const billingFields = (kind, doc, row) => {
    const intl = kind === 'international';
    const address = (intl ? doc.address : doc.registeredAddress)
        || [row.city, row.state, row.country].filter(Boolean).join(', ')
        || 'N/A';
    return {
        companyId: String(doc._id),
        company_name: row.companyName || '',
        company_addr: address,
        company_contact_person: row.contactPerson || '',
        company_contact_mobile: row.mobileNumber || '',
        company_email: row.email || '',
        consignee_name: row.companyName || 'N/A',
        consignee_addr: address,
        consignee_person: row.contactPerson || '',
        consignee_phone: row.mobileNumber || '',
        country: row.country || 'N/A',
        state: row.state || 'N/A',
        city: row.city || 'N/A',
        pincode: num(row.pinCode),
        event_name: row.eventName || '',
        added_by: 'Buyer Leads',
    };
};

// Runs an existing exhibitor controller with a synthetic body and hands back its JSON result.
const runController = (controller, req, body, params) => new Promise((resolve) => {
    const fakeReq = Object.create(req);
    fakeReq.body = body;
    if (params) fakeReq.params = params;
    fakeReq.file = undefined;
    const fakeRes = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(payload) { resolve({ status: this.statusCode, payload }); return this; },
    };
    Promise.resolve(controller(fakeReq, fakeRes)).catch((error) => resolve({ status: 500, payload: { message: error.message } }));
});

const sendResult = (res, { status, payload }) => res.status(status).json(payload);

router.get('/:kind/:id/accounts', async (req, res) => {
    try {
        const buyer = await loadBuyer(req.params.kind, req.params.id);
        if (!buyer) return res.status(404).json({ success: false, message: 'Not found' });
        const companyId = String(buyer.doc._id);
        const [estimates, invoices, payments] = await Promise.all([
            Estimate.find({ companyId }).sort({ added: -1 }).lean(),
            Invoice.find({ companyId }).sort({ added: -1 }).lean(),
            Payment.find({ companyId, status: 1 }).sort({ added: -1 }).lean(),
        ]);
        const piTotal = estimates.filter((d) => !isCancelled(d)).reduce((sum, d) => sum + num(d.finalAmount), 0);
        const invoiceTotal = invoices.filter((d) => !isCancelled(d)).reduce((sum, d) => sum + num(d.finalAmount), 0);
        const received = payments.reduce((sum, p) => sum + num(p.amount_text), 0);
        res.json({
            success: true,
            data: {
                estimates, invoices, payments,
                totals: {
                    piTotal: round2(piTotal),
                    invoiceTotal: round2(invoiceTotal),
                    received: round2(received),
                    // Billed amount = invoices once raised, otherwise the PI value.
                    outstanding: round2(Math.max(0, (invoiceTotal || piTotal) - received)),
                },
            },
        });
    } catch (err) {
        console.error('Error loading buyer accounts:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

const priceItems = (items = []) => items
    .filter((it) => String(it.description || '').trim() && num(it.qty) > 0)
    .map((it) => {
        const qty = num(it.qty);
        const rate = num(it.rate);
        const discountPct = num(it.discountPct);
        const gstPct = it.gstPct === undefined || it.gstPct === '' ? 18 : num(it.gstPct);
        const amount = round2(qty * rate);
        const taxable = round2(amount - (amount * discountPct) / 100);
        const tax = round2((taxable * gstPct) / 100);
        return {
            description: String(it.description).trim(), hsn: it.hsn || '998596', qty, unit: it.unit || 'Nos',
            // category 'Buyer' keeps the shared PI/Invoice templates from printing these as exhibition stalls
            category: 'Buyer', size: 0, rate, amount, disc: discountPct, tax, gstRate: String(gstPct),
            cgst_per: String(gstPct / 2), igst_per: String(gstPct), finalAmount: round2(taxable + tax),
            _taxable: taxable,
        };
    });

// Proforma Invoice — an Estimate document, so it takes the next number in the exhibitor PI series.
router.post('/:kind/:id/pi', async (req, res) => {
    try {
        const buyer = await loadBuyer(req.params.kind, req.params.id);
        if (!buyer) return res.status(404).json({ success: false, message: 'Not found' });
        if (!req.body.crmEventId) return res.status(400).json({ message: 'Select the event this PI is raised under.' });
        const items = priceItems(req.body.items);
        if (!items.length) return res.status(400).json({ message: 'Add at least one item with a quantity.' });

        const body = {
            ...billingFields(req.params.kind, buyer.doc, buyer.row),
            crmEventId: req.body.crmEventId,
            items: items.map(({ _taxable, ...item }) => item),
            finalAmount: round2(items.reduce((sum, it) => sum + it.finalAmount, 0)),
            remarks: req.body.remarks || '',
            terms: req.body.terms || '',
            supply_date: req.body.supplyDate || '',
        };
        sendResult(res, await runController(addEstimate, req, body));
    } catch (err) {
        console.error('Error creating buyer PI:', err);
        res.status(500).json({ message: err.message });
    }
});

// Edit a buyer's PI in place (same behaviour as the exhibitor PI edit): the PI number stays, items and
// totals are recomputed. Invoices already raised from it remain snapshots and are flagged for revision.
router.put('/:kind/:id/pi/:estimateId', async (req, res) => {
    try {
        const buyer = await loadBuyer(req.params.kind, req.params.id);
        if (!buyer) return res.status(404).json({ success: false, message: 'Not found' });
        const estimate = await Estimate.findOne({ _id: req.params.estimateId, companyId: String(buyer.doc._id) }).lean();
        if (!estimate) return res.status(404).json({ message: 'PI not found for this buyer.' });
        if (isCancelled(estimate)) return res.status(400).json({ message: 'A cancelled PI cannot be edited.' });
        const items = priceItems(req.body.items);
        if (!items.length) return res.status(400).json({ message: 'Add at least one item with a quantity.' });

        const body = {
            items: items.map(({ _taxable, ...item }) => item),
            finalAmount: round2(items.reduce((sum, it) => sum + it.finalAmount, 0)),
            remarks: req.body.remarks || '',
            supply_date: req.body.supplyDate !== undefined ? req.body.supplyDate : estimate.supply_date || '',
        };
        sendResult(res, await runController(updateEstimate, req, body, { id: String(estimate._id) }));
    } catch (err) {
        console.error('Error editing buyer PI:', err);
        res.status(500).json({ message: err.message });
    }
});

// Tax Invoice — an Invoice document (next number in the exhibitor invoice series). Raised from a
// PI (items copied, quantities validated by the same rules as exhibitors) or directly from items.
router.post('/:kind/:id/invoice', async (req, res) => {
    try {
        const buyer = await loadBuyer(req.params.kind, req.params.id);
        if (!buyer) return res.status(404).json({ success: false, message: 'Not found' });
        const companyId = String(buyer.doc._id);
        const base = billingFields(req.params.kind, buyer.doc, buyer.row);
        const poFields = {
            po_no: String(req.body.poNo || '').trim(),
            po_date: req.body.poDate || null,
        };
        const typeOfInvoice = req.body.typeOfInvoice || (req.params.kind === 'international' ? 'Foreign Sale' : 'Interstate Sale');

        let body;
        if (req.body.estimateId) {
            const estimate = await Estimate.findOne({ _id: req.body.estimateId, companyId }).lean();
            if (!estimate) return res.status(404).json({ message: 'PI not found for this buyer.' });
            const items = buildInvoiceItemsFromEstimate(estimate);
            body = {
                ...base,
                crmEventId: estimate.crmEventId || req.body.crmEventId,
                eventId: estimate.eventId || undefined,
                source_estimate_id: String(estimate._id),
                estimate_no: estimate.est_no,
                gst_no: estimate.gst_no || '',
                supply_date: req.body.supplyDate || estimate.supply_date || '',
                ...poFields,
                type_of_invoice: typeOfInvoice,
                items,
                finalAmount: round2(items.reduce((sum, it) => sum + num(it.total), 0)),
                remarks: req.body.remarks || '',
            };
        } else {
            if (!req.body.crmEventId) return res.status(400).json({ message: 'Select the event this invoice is raised under.' });
            const items = priceItems(req.body.items).map((it) => ({
                description: it.description, hsn: it.hsn, qty: it.qty, size: '', area: '', unit: it.unit, rate: it.rate,
                amount: it.amount, discountPct: it.disc, taxableValue: it._taxable, gstPct: it.gstRate,
                gstAmount: it.tax, total: it.finalAmount, category: 'Buyer', plScheme: '', stallType: '',
            }));
            if (!items.length) return res.status(400).json({ message: 'Add at least one item with a quantity.' });
            body = {
                ...base,
                crmEventId: req.body.crmEventId,
                supply_date: req.body.supplyDate || '',
                ...poFields,
                type_of_invoice: typeOfInvoice,
                items,
                finalAmount: round2(items.reduce((sum, it) => sum + it.total, 0)),
                remarks: req.body.remarks || '',
            };
        }
        sendResult(res, await runController(createInvoice, req, body));
    } catch (err) {
        console.error('Error creating buyer invoice:', err);
        res.status(500).json({ message: err.message });
    }
});

// Payment Received — same Payment document and RCP receipt series as exhibitors.
router.post('/:kind/:id/payment', async (req, res) => {
    try {
        const buyer = await loadBuyer(req.params.kind, req.params.id);
        if (!buyer) return res.status(404).json({ success: false, message: 'Not found' });
        const companyId = String(buyer.doc._id);
        const b = req.body;
        const amount = num(b.amount);
        if (!b.documentId) return res.status(400).json({ message: 'Select the invoice / PI this payment is for.' });
        if (amount <= 0) return res.status(400).json({ message: 'Enter a valid amount received.' });
        if (!b.paymentMode) return res.status(400).json({ message: 'Select a payment mode.' });
        if (!b.paymentType) return res.status(400).json({ message: 'Select a payment type.' });

        const invoice = await Invoice.findOne({ _id: b.documentId, companyId }).lean();
        const estimate = invoice ? null : await Estimate.findOne({ _id: b.documentId, companyId }).lean();
        const target = invoice || estimate;
        if (!target) return res.status(404).json({ message: 'Document not found for this buyer.' });
        if (isCancelled(target)) return res.status(400).json({ message: 'Payment cannot be recorded against a cancelled document.' });

        const cash = b.paymentMode === 'Cash';
        const body = {
            companyId,
            invoice_id: String(target._id),
            f_amount: String(num(target.finalAmount)),
            amount_text: String(amount),
            tds_text: String(num(b.tds)),
            payment_date: b.paymentDate || new Date().toISOString().split('T')[0],
            pymnt_type: b.paymentType,
            status_short: b.paymentType,
            payment_mode: b.paymentMode,
            utr_no: cash ? '' : b.referenceNo || '',
            bankId: cash ? '' : b.bankName || '',
            received_by: cash ? b.receivedBy || '' : '',
            received_date: cash ? b.receivedDate || '' : '',
            ex_no: invoice ? invoice.invoice_no : estimate.est_no,
            added_by: req.user?.username || req.user?.name || 'Admin',
            notes: b.notes || '',
        };
        sendResult(res, await runController(addPayment, req, body));
    } catch (err) {
        console.error('Error recording buyer payment:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
