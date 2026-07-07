const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");
const CreditNote = require("../models/CreditNote");
const DebitNote = require("../models/DebitNote"); // legacy model — behaves as a second credit note, not a debit note
const AccountDebitNote = require("../models/AccountDebitNote"); // real debit note (increases what the exhibitor owes)

const isCancelledDoc = (doc) => String(doc?.status || "").trim().toLowerCase() === "cancelled";
const parseAmount = (value) => {
  const amount = Number(String(value ?? 0).replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : 0;
};

const legacyCreditNoteAmount = (cn) =>
  (cn.items || []).reduce((sum, it) => sum + parseAmount(it.cn_amount) * (it.quantity || 1), 0);

// Single place that knows how much of a legacy CreditNote / legacy "DebitNote"
// (which is really a second credit-note mechanism, see backend audit notes) applies
// to each invoice. Used by both the client ledger and the debit-note allocation screen
// so the two never disagree about how much of an invoice has already been credited.
const getCreditedByInvoiceId = (activeInvoices, creditNotes, legacyDebitNotesAsCredit) => {
  const creditedByInvoiceId = {};

  legacyDebitNotesAsCredit
    .filter((dn) => !isCancelledDoc(dn) && dn.toInvoiceId)
    .forEach((dn) => {
      const key = String(dn.toInvoiceId);
      creditedByInvoiceId[key] = (creditedByInvoiceId[key] || 0) + parseAmount(dn.totalAmount);
    });

  creditNotes
    .filter((cn) => !isCancelledDoc(cn) && cn.est_no)
    .forEach((cn) => {
      const matchedInvoice = activeInvoices.find((inv) => inv.estimate_no === cn.est_no);
      if (!matchedInvoice) return;
      const key = String(matchedInvoice._id);
      creditedByInvoiceId[key] = (creditedByInvoiceId[key] || 0) + legacyCreditNoteAmount(cn);
    });

  return creditedByInvoiceId;
};

// Single source of truth for "what does this exhibitor/company owe us right now" —
// pulls every document type that moves the balance:
//   Invoice            -> debit  (increases what they owe)
//   Payment            -> credit (reduces what they owe)
//   CreditNote + legacy "DebitNote" (mislabeled, acts as a credit note) -> credit
//   AccountDebitNote (real debit note: additional charges/late fee/etc.) -> debit
// accountOverviewController, clientLedgerController and accountDebitNoteController all
// call this instead of each computing/netting these collections independently, which
// is how the same exhibitor could previously show a different "amount due" on every page.
const computeLedgerTotals = async (lookupIds) => {
  const [invoices, creditNotes, legacyDebitNotes, accountDebitNotes] = await Promise.all([
    Invoice.find({ companyId: { $in: lookupIds } }).lean(),
    CreditNote.find({ companyId: { $in: lookupIds } }).lean(),
    DebitNote.find({ companyId: { $in: lookupIds } }).lean(),
    AccountDebitNote.find({ companyId: { $in: lookupIds }, status: "active" }).lean(),
  ]);

  const activeInvoices = invoices.filter((inv) => !isCancelledDoc(inv));
  const invoiceIds = activeInvoices.map((inv) => inv._id.toString());

  const payments = invoiceIds.length
    ? await Payment.find({ invoice_id: { $in: invoiceIds } }).lean()
    : [];

  const paidByInvoiceId = {};
  payments.forEach((p) => {
    const key = String(p.invoice_id);
    paidByInvoiceId[key] = (paidByInvoiceId[key] || 0) + parseAmount(p.amount_text);
  });

  const creditedByInvoiceId = getCreditedByInvoiceId(activeInvoices, creditNotes, legacyDebitNotes);

  const activeCreditNotes = creditNotes.filter((cn) => !isCancelledDoc(cn));
  const activeLegacyDebitNotes = legacyDebitNotes.filter((dn) => !isCancelledDoc(dn));

  const invoiceTotal = activeInvoices.reduce((sum, inv) => sum + parseAmount(inv.finalAmount), 0);
  const paymentTotal = payments.reduce((sum, p) => sum + parseAmount(p.amount_text), 0);
  const creditNoteTotal =
    activeCreditNotes.reduce((sum, cn) => sum + legacyCreditNoteAmount(cn), 0) +
    activeLegacyDebitNotes.reduce((sum, dn) => sum + parseAmount(dn.totalAmount), 0);
  const debitNoteTotal = accountDebitNotes.reduce((sum, dn) => sum + parseAmount(dn.totalAmount), 0);

  const outstandingAmount = Math.max(0, invoiceTotal + debitNoteTotal - paymentTotal - creditNoteTotal);

  return {
    invoices,
    activeInvoices,
    payments,
    creditNotes,
    activeCreditNotes,
    legacyDebitNotes,
    activeLegacyDebitNotes,
    accountDebitNotes,
    paidByInvoiceId,
    creditedByInvoiceId,
    invoiceTotal,
    paymentTotal,
    creditNoteTotal,
    debitNoteTotal,
    outstandingAmount,
  };
};

module.exports = {
  parseAmount,
  isCancelledDoc,
  legacyCreditNoteAmount,
  getCreditedByInvoiceId,
  computeLedgerTotals,
};
