require("dotenv").config();
const mongoose = require("mongoose");
const EstimateTermsConfig = require("./models/EstimateTermsConfig");
const {
  DOCUMENT_CONFIGS,
} = require("./controllers/estimateTermsConfigController");

const DEFAULT_TERMS = [
  "Payment must be made in favor of Namo Gange Wellness Pvt. Ltd. via Cheque / DD / RTGS / NEFT / UPI only.",
  "Full payment is due within the stipulated invoice period.",
  "Delay in payment shall attract interest @24% per annum.",
  "Booking / services shall be confirmed only after receipt of payment.",
  "Cancellation or amendments shall be subject to company policy and management approval.",
  "All disputes are subject to Delhi Jurisdiction only.",
];

const DEFAULT_PAYMENT_CONDITIONS = ["100% Advance Payment."];

const DEFAULT_DELIVERY_TERMS = [
  "Goods once delivered will not be taken back.",
  "Please check the goods in presence of our delivery executive.",
  "Any discrepancy should be reported within 24 hours.",
  "Goods are delivered in good condition.",
  "Subject to Delhi Jurisdiction only.",
];

const DEFAULT_DELIVERY_NOTES = [
  "Goods delivered as per Purchase Order.",
  "For any queries, please contact our office.",
];

const DEFAULT_DELIVERY_SPECIAL_REMARK = "Material dispatched as per the approved Proforma Invoice for the 9th Edition of IHWE. Goods handed over to the transporter in good condition for delivery to the event venue. Kindly verify the quantity and condition at the time of receipt.";

const seedEstimateTermsConfig = async () => {
  try {
    const mongoUri = process.env.MONGO_URI_MAIN || process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ihwe";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for seeding estimate terms config");

    for (const docConfig of DOCUMENT_CONFIGS) {
      const existing = await EstimateTermsConfig.findOne({ documentType: docConfig.documentType });
      if (existing) {
        existing.title = docConfig.title;
        existing.displayName = docConfig.displayName;
        if (docConfig.documentType === "delivery-challan") {
          existing.termsAndConditions = DEFAULT_DELIVERY_TERMS;
          existing.paymentConditions = [];
          existing.deliveryNotes = DEFAULT_DELIVERY_NOTES;
          existing.specialRemark = DEFAULT_DELIVERY_SPECIAL_REMARK;
        } else {
          existing.termsAndConditions = existing.termsAndConditions?.length ? existing.termsAndConditions : DEFAULT_TERMS;
          existing.paymentConditions = existing.paymentConditions?.length ? existing.paymentConditions : DEFAULT_PAYMENT_CONDITIONS;
        }
        existing.status = existing.status || "active";
        existing.updatedBy = existing.updatedBy || "Seed";
        await existing.save();
        console.log(`Updated ${docConfig.displayName} config`);
      } else {
        await EstimateTermsConfig.create({
          documentType: docConfig.documentType,
          displayName: docConfig.displayName,
          title: docConfig.title,
          termsAndConditions: docConfig.documentType === "delivery-challan" ? DEFAULT_DELIVERY_TERMS : DEFAULT_TERMS,
          paymentConditions: docConfig.documentType === "delivery-challan" ? [] : DEFAULT_PAYMENT_CONDITIONS,
          deliveryNotes: docConfig.documentType === "delivery-challan" ? DEFAULT_DELIVERY_NOTES : [],
          specialRemark: docConfig.documentType === "delivery-challan" ? DEFAULT_DELIVERY_SPECIAL_REMARK : "",
          status: "active",
          updatedBy: "Seed",
        });
        console.log(`Seeded ${docConfig.displayName} config`);
      }
    }
  } catch (error) {
    console.error("Error seeding estimate terms config:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedEstimateTermsConfig();
