const mongoose = require("mongoose");
const BuyerRegistration = require("../models/BuyerRegistration");
const InternationalBuyer = require("../models/InternationalBuyer");
const Payment = require("../models/Payment");

// Buyers use the same Accounts documents as exhibitors (Estimate/PI, Invoice, Payment) with
// companyId = the buyer's _id. A buyer is "Converted" once payment has been received, so keep
// paymentStatus in step with the recorded payments. No-op for ids that aren't buyers.
const syncBuyerPaymentStatus = async (companyId) => {
  if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) return;
  try {
    for (const Model of [BuyerRegistration, InternationalBuyer]) {
      const buyer = await Model.findById(companyId).select("paymentStatus isLead accountsPaid convertedFromLead").lean();
      if (!buyer) continue;

      const payments = await Payment.find({ companyId: String(companyId), status: 1 }).select("amount_text").lean();
      const received = payments.reduce((sum, p) => sum + (parseFloat(p.amount_text) || 0), 0);

      if (received > 0 && buyer.paymentStatus !== "Completed") {
        await Model.updateOne({ _id: companyId }, {
          $set: { paymentStatus: "Completed", accountsPaid: true, ...(buyer.isLead ? { isLead: false, convertedFromLead: true } : {}) },
        });
      } else if (received <= 0 && buyer.accountsPaid) {
        await Model.updateOne({ _id: companyId }, {
          $set: { paymentStatus: "Pending", accountsPaid: false, ...(buyer.convertedFromLead ? { isLead: true, convertedFromLead: false } : {}) },
        });
      }
      return;
    }
  } catch (err) {
    console.error("Failed to sync buyer payment status:", err.message);
  }
};

module.exports = { syncBuyerPaymentStatus };
