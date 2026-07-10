const mongoose = require("mongoose");
const paymentReceiptSettingsSchema = new mongoose.Schema(
  {
    eventLogoImage: { type: String, default: "" },
    // Optional override for the top-left header logo. Falls back to Settings.logo (the
    // site-wide logo) in pdfGenerator.js when this isn't set.
    headerLogoImage: { type: String, default: "" },

    // Colors (hex)
    organiserBandColor: { type: String, default: "#0b3974" },
    exhibitorBandColor: { type: String, default: "#1a7a3c" },
    accentColor: { type: String, default: "#0b3974" },
    noteColor: { type: String, default: "#c2410c" },

    // Labels
    headOfficeLabel: { type: String, default: "Head Office:" },
    receiptTitleLabel: { type: String, default: "PAYMENT RECEIPT" },
    fromLabel: { type: String, default: "FROM (ORGANISER)" },
    toLabel: { type: String, default: "TO (EXHIBITOR)" },
    invoiceDetailsLabel: { type: String, default: "INVOICE DETAILS" },
    paymentDetailsLabel: { type: String, default: "PAYMENT DETAILS" },
    exhibitorDetailsLabel: { type: String, default: "EXHIBITOR DETAILS" },
    importantNoteLabel: { type: String, default: "IMPORTANT NOTE" },
    footerThankYouText: {
      type: String,
      default: "Thank you for your participation in 9th International Health & Wellness Expo 2026.",
    },
    footerDisclaimerText: {
      type: String,
      default: "This is a computer generated document and does not require a physical signature.",
    },
    receiptNumberPrefix: { type: String, default: "PAY-RCPT-" },

    importantNoteItems: {
      type: [String],
      default: [
        "This is a system generated payment receipt and does not require any physical signature.",
        "Subject to realization of cheque / DD.",
        "All disputes are subject to Ghaziabad Jurisdiction only.",
      ],
    },
    headerBandHeight: { type: Number, default: 95 },
    eventBandHeight: { type: Number, default: 85 },
    infoBandHeight: { type: Number, default: 115 },
    footerBandHeight: { type: Number, default: 85 },
    pageMarginX: { type: Number, default: 30 },
    // Vertical whitespace between each major section (header, event, from/to, invoice
    // details, payment details, exhibitor/note).
    sectionGap: { type: Number, default: 8 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PaymentReceiptSettings", paymentReceiptSettingsSchema);
