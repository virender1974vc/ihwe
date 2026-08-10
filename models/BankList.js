const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");

const BankListSchema = new mongoose.Schema(
  {
    // Bank Details
    accountDisplayName: { type: String, required: true },
    accountname: { type: String, required: true }, // Account Holder Name
    bankname: { type: String, required: true },
    accountno: { type: String, required: true },
    ifsccode: { type: String, required: true },
    accountType: { type: String, default: "Current Account" },
    bankbranch: { type: String, required: true }, // Branch Name
    branchAddress: { type: String },
    swiftBic: { type: String },
    micrCode: { type: String },
    openingBalance: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },

    // Digital Payment Details (UPI)
    upiEnabled: { type: Boolean, default: false },
    upiId: { type: String },
    upiRegisteredName: { type: String },
    qrCodeUrl: { type: String },
    paymentGatewayLink: { type: String },

    // Usage & Settings
    purpose: { type: [String], default: ["Exhibitor Collection"] },
    applicableEvent: { type: String },
    applicableEventName: { type: String },
    isPrimary: { type: Boolean, default: false },
    showOnProformaInvoice: { type: Boolean, default: true },
    showOnTaxInvoice: { type: Boolean, default: true },
    showOnPaymentReceipt: { type: Boolean, default: true },
    allowShareWithClient: { type: Boolean, default: true },

    status: { type: String, required: true, default: "Active" },

    added_by: { type: String },
    updated_by: { type: String },
    added: { type: Date },
  },
  { timestamps: { createdAt: "added", updatedAt: "updated" } },
);

module.exports = secondaryDB.model("BankList", BankListSchema);
