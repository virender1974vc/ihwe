const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");

const challanItemSchema = new mongoose.Schema(
  {
    sourceItemKey: { type: String, required: true },
    description: { type: String, required: true },
    hsn: { type: String, default: "" },
    qty: { type: Number, required: true, min: 0.000001 },
    sourceQty: { type: Number, default: 0 },

    unit: { type: String, default: "" },
    size: { type: String, default: "" },
    area: { type: String, default: "" },

    remarks: { type: String, default: "" },
    rate: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    discountPct: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    taxable: { type: Number, default: 0 },
    gstRate: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, default: 0 },
  },
  { _id: false }
);

const deliveryChallanSchema = new mongoose.Schema(
  {
    challan_no: { type: String, required: true, unique: true },
    challan_date: { type: String, required: true },

    companyId: { type: String, required: true, index: true },
    account_ref_id: { type: String, default: "", index: true },

    source_estimate_id: { type: String, required: true, index: true },
    estimate_no: { type: String, required: true },

    company_name: { type: String, default: "" },
    company_address: { type: String, default: "" },
    company_gst_no: { type: String, default: "" },

    company_email: { type: String, default: "" },
    company_city: { type: String, default: "" },
    company_state: { type: String, default: "" },
    company_country: { type: String, default: "" },
    company_pincode: { type: String, default: "" },

    contact_person: { type: String, default: "" },
    contact_phone: { type: String, default: "" },
    contact_email: { type: String, default: "" },

    event_name: { type: String, default: "" },
    delivery_address: { type: String, default: "" },

    delivery_city: { type: String, default: "" },
    delivery_state: { type: String, default: "" },
    delivery_country: { type: String, default: "" },
    delivery_pincode: { type: String, default: "" },

    purpose: {
      type: String,
      enum: [
        "Event/Stall Material",
        "Job Work",
        "Returnable Material",
        "Non-returnable Material",
        "Other",
      ],
      default: "Event/Stall Material",
    },

    challan_type: {
      type: String,
      enum: ["Outward", "Inward", "Return", "Gate Pass"],
      default: "Outward",
    },

    vehicle_no: { type: String, default: "" },
    transporter_name: { type: String, default: "" },
    eway_bill: { type: String, default: "" },
    type_of_sale: { type: String, default: "" },
    shipped_to: { type: String, default: "" },
    state_code: { type: String, default: "" },
    bilty_no: { type: String, default: "" },
    po_no: { type: String, default: "" },

    remarks: { type: String, default: "" },
    terms: { type: String, default: "" },

    items: { type: [challanItemSchema], required: true },

    status: {
      type: String,
      enum: ["draft", "issued", "delivered", "acknowledged", "cancelled"],
      default: "issued",
    },

    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date },

    whatsappSent: { type: Boolean, default: false },
    whatsappSentAt: { type: Date },

    added_by: { type: String, default: "" },
  },
  {
    timestamps: { createdAt: "added", updatedAt: "updated" },
  }
);

deliveryChallanSchema.statics.generateNextNumber = async function () {
  const now = new Date();
  const year = now.getFullYear();
  const startYear = now.getMonth() + 1 >= 4 ? year : year - 1;
  const fiscalYear = `${String(startYear).slice(-2)}-${String(startYear + 1).slice(-2)}`;
  const prefix = `NGW/DC/${fiscalYear}/`;

  const last = await this.findOne({
    challan_no: { $regex: `^${prefix}` },
  })
    .sort({ challan_no: -1 })
    .lean();

  const lastSequence = Number(String(last?.challan_no || "").split("/").pop()) || 0;
  return `${prefix}${String(lastSequence + 1).padStart(3, "0")}`;
};

module.exports = secondaryDB.model("DeliveryChallan", deliveryChallanSchema);
