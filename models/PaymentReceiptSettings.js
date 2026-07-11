const mongoose = require("mongoose");
const paymentReceiptSettingsSchema = new mongoose.Schema(
  {
    eventLogoImage: { type: String, default: "" },
    headerLogoImage: { type: String, default: "" },
    showSignatureStamp: { type: Boolean, default: false },
    stampImage: { type: String, default: "" },
    signatureImage: { type: String, default: "" },
    signatureLabel: { type: String, default: "Authorized Signatory" },

    // Colors (hex)
    organiserBandColor: { type: String, default: "#0b3974" },
    exhibitorBandColor: { type: String, default: "#1a7a3c" },
    accentColor: { type: String, default: "#0b3974" },
    noteColor: { type: String, default: "#c2410c" },
    // Background for the gray section-divider bands (PAYMENT AGAINST .../ RECEIVED
    // PAYMENT DETAILS).
    sectionBandColor: { type: String, default: "#94a3b8" },
    // Text color for those same divider bands.
    sectionBandTextColor: { type: String, default: "#ffffff" },
    // Background for the PREPARED BY/REVIEWED BY/FOR COMPANY header strip.
    authBandColor: { type: String, default: "#94a3b8" },
    // Text color for that same header strip's labels.
    authBandTextColor: { type: String, default: "#0b3974" },
    // Background + text color for the bottom disclaimer bar ("This is a computer
    // generated document..." / "Page 1 of 1").
    footerBarColor: { type: String, default: "#0b3974" },
    footerBarTextColor: { type: String, default: "#ffffff" },
    // Background for the "PAYMENT RECEIPT" title strip (top-right box in the event
    // band). Defaults to white so it's invisible until an admin opts to color it in.
    receiptTitleBandColor: { type: String, default: "#ffffff" },

    // Labels
    headOfficeLabel: { type: String, default: "Head Office:" },
    receiptTitleLabel: { type: String, default: "PAYMENT RECEIPT" },
    fromLabel: { type: String, default: "FROM (ORGANISER)" },
    toLabel: { type: String, default: "TO (EXHIBITOR)" },
    invoiceDetailsLabel: { type: String, default: "INVOICE DETAILS" },
    paymentDetailsLabel: { type: String, default: "PAYMENT DETAILS" },
    footerThankYouText: {
      type: String,
      default: "Thank you for your participation in 9th International Health & Wellness Expo 2026.",
    },
    footerDisclaimerText: {
      type: String,
      default: "This is a computer generated document and does not require a physical signature.",
    },
    receiptNumberPrefix: { type: String, default: "PAY-RCPT-" },

    headerBandHeight: { type: Number, default: 95 },
    eventBandHeight: { type: Number, default: 85 },
    infoBandHeight: { type: Number, default: 115 },
    footerBandHeight: { type: Number, default: 85 },
    pageMarginX: { type: Number, default: 30 },
    // Vertical whitespace between each major section (header, event, from/to, invoice
    // details, payment details, signature block).
    sectionGap: { type: Number, default: 8 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PaymentReceiptSettings", paymentReceiptSettingsSchema);
