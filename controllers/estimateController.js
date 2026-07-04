const Estimate = require("../models/Estimate");
const Invoice = require("../models/Invoice");
const DeliveryChallan = require("../models/DeliveryChallan");
const Payment = require("../models/Payment");
const CreditNote = require("../models/CreditNote");
const DebitNote = require("../models/DebitNote");
const Company = require("../models/Company");
const ExhibitorRegistration = require("../models/ExhibitorRegistration");
const ChatMessage = require('../models/ChatMessage');
const CrmExhibatorReview2023 = require('../models/CrmExhibatorReview2023');
const { sendWhatsAppMessage, sendProformaInvoiceWhatsApp } = require('../utils/whatsapp');
const emailService = require('../utils/emailService');
const { logActivity } = require("../utils/logger");
const { getDocumentAccountName } = require("../utils/accountActivityDetails");

const getFiscalYear = () => {
  const date = new Date();
  const currentYear = date.getFullYear();
  const month = date.getMonth() + 1;
  const startYear = month >= 4 ? currentYear : currentYear - 1;
  const endYear = month >= 4 ? currentYear + 1 : currentYear;
  return `${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;
};

const getDocumentSeq = (docNo = "") => {
  const seq = parseInt(String(docNo).split("/").pop(), 10);
  return Number.isNaN(seq) ? null : seq;
};

const generateNextProformaNo = async () => {
  const fiscalYear = getFiscalYear();
  const prefix = `NGW/${fiscalYear}/PI/`;
  const invoicePrefix = `NGW/${fiscalYear}/INV/`;

  const [estimates, invoices] = await Promise.all([
    Estimate.find({ est_no: { $regex: `^${prefix}` } }).select("est_no").lean(),
    Invoice.find({ estimate_no: { $regex: `^${prefix}` } }).select("estimate_no invoice_no").lean(),
  ]);

  const maxEstimateSeq = estimates.reduce((max, estimate) => {
    const seq = getDocumentSeq(estimate.est_no);
    return seq === null ? max : Math.max(max, seq);
  }, 0);

  const maxInvoiceSeq = invoices.reduce((max, invoice) => {
    const estimateSeq = getDocumentSeq(invoice.estimate_no);
    const invoiceSeq = String(invoice.invoice_no || "").startsWith(invoicePrefix)
      ? getDocumentSeq(invoice.invoice_no)
      : null;
    return Math.max(max, estimateSeq || 0, invoiceSeq || 0);
  }, 0);

  const nextSeq = Math.max(maxEstimateSeq, maxInvoiceSeq) + 1;
  return `${prefix}${String(nextSeq).padStart(3, "0")}`;
};

// Add estimate
const addEstimate = async (req, res) => {
  try {
    const newEstimateNo = await generateNextProformaNo();

    const estimateBody = {
      ...req.body,
      est_no: newEstimateNo,
    };

    const estimate = new Estimate(estimateBody);
    await estimate.save();
    const accountName = await getDocumentAccountName(estimate, "account");
    await logActivity(
      req,
      "Created",
      "Accounts",
      `Created Proforma Invoice for ${accountName}. Amount: ₹${estimate.finalAmount || 0}`,
    );

    // Log the creation in the chat/communication
    try {
      const review = new CrmExhibatorReview2023({
        cmpny_id: estimate.companyId.toString(),
        type: 'log',
        re_msg: `[PROFORMA INVOICE CREATED] Proforma Invoice (${estimate.est_no}) has been generated. Amount: ₹${estimate.finalAmount}`,
        updated_by: req.body.added_by || 'System'
      });
      await review.save();
    } catch (chatErr) {
      console.error("Error creating chat message for estimate creation:", chatErr);
    }

    res.status(201).json({
      message: "✅ Estimate added",
      data: estimate,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Conflict: Estimate number already exists",
        error: error.message,
      });
    }

    res.status(500).json({
      message: "Error adding estimate",
      error: error.message,
    });
  }
};

// Get grouped data
const getGroupedEstimateData = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "companyId is required",
      });
    }

    const data = await Estimate.aggregate([
      { $match: { companyId } },

      {
        $lookup: {
          from: "performainvoices",
          let: { est_no: "$est_no", companyId: "$companyId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$companyId", "$$companyId"] },
                    { $eq: ["$est_no", "$$est_no"] },
                  ],
                },
              },
            },
            { $project: { _id: 1, pi_no: 1, added: 1, status: 1 } },
          ],
          as: "performaInvoice",
        },
      },

      {
        $lookup: {
          from: "invoices",
          let: { est_no: "$est_no", companyId: "$companyId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$companyId", "$$companyId"] },
                    { $eq: ["$estimate_no", "$$est_no"] },
                  ],
                },
              },
            },
            { $project: { _id: 1, invoice_no: 1, added: 1, status: 1, invoice_date: 1, supply_date: 1, updated: 1, finalAmount: 1 } },
          ],
          as: "invoice",
        },
      },

      {
        $project: {
          _id: 1,
          companyId: 1,
          est_no: 1,
          est_type: 1,
          gst_no: 1,
          company_name: 1,
          company_addr: 1,
          company_gst_no: 1,
          event_name: 1,
          event_place_of_supply: 1,
          event_gst_no: 1,
          consignee_name: 1,
          consignee_addr: 1,
          country: 1,
          state: 1,
          city: 1,
          pincode: 1,
          added_by: 1,
          status: 1,
          emailSent: 1,
          emailSentAt: 1,
          whatsappSent: 1,
          whatsappSentAt: 1,
          updated: 1,
          items: 1,
          supply_date: 1,
          finalAmount: {
            $cond: {
              if: { $isArray: "$items" },
              then: { $sum: "$items.finalAmount" },
              else: 0,
            },
          },
          added: 1,
          performaInvoice: 1,
          invoice: 1,
        },
      },

      { $sort: { added: -1 } },
    ]);

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching data",
      error: error.message,
    });
  }
};
const getAllEstimates = async (req, res) => {
  try {
    const { type } = req.query;
    let matchStage = {};
    if (type) {
      matchStage = { est_type: { $regex: new RegExp(`^${type}$`, "i") } };
    }

    const data = await Estimate.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "performainvoices",
          let: { est_no: "$est_no", companyId: "$companyId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$companyId", "$$companyId"] },
                    { $eq: ["$est_no", "$$est_no"] },
                  ],
                },
              },
            },
            { $project: { _id: 1, pi_no: 1, updated: 1, finalAmount: 1, status: 1 } },
          ],
          as: "performaInvoice",
        },
      },
      {
        $lookup: {
          from: "invoices",
          let: { est_no: "$est_no", companyId: "$companyId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$companyId", "$$companyId"] },
                    { $eq: ["$estimate_no", "$$est_no"] },
                  ],
                },
              },
            },
            { $project: { _id: 1, invoice_no: 1, added: 1, status: 1, invoice_date: 1, supply_date: 1, updated: 1, finalAmount: 1 } },
          ],
          as: "invoice",
        },
      },
      {
        $project: {
          _id: 1,
          companyId: 1,
          est_no: 1,
          est_type: 1,
          gst_no: 1,
          company_name: 1,
          company_addr: 1,
          company_gst_no: 1,
          event_name: 1,
          event_place_of_supply: 1,
          event_gst_no: 1,
          consignee_name: 1,
          consignee_addr: 1,
          country: 1,
          state: 1,
          city: 1,
          pincode: 1,
          added_by: 1,
          status: 1,
          emailSent: 1,
          emailSentAt: 1,
          whatsappSent: 1,
          whatsappSentAt: 1,
          updated: 1,
          items: 1,
          supply_date: 1,
          finalAmount: {
            $cond: {
              if: { $isArray: "$items" },
              then: { $sum: "$items.finalAmount" },
              else: 0,
            },
          },
          added: 1,
          performaInvoice: 1,
          invoice: 1,
        },
      },
      { $sort: { added: -1 } },
    ]);

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("❌ Error fetching all estimates:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching all estimates",
      error: error.message,
    });
  }
};

// Get by ID
const getEstimateById = async (req, res) => {
  try {
    const estimate = await Estimate.findById(req.params.id).lean();

    if (!estimate)
      return res.status(404).json({ message: "Estimate not found" });

    if (estimate.companyId) {
      let company = await Company.findById(estimate.companyId).lean();
      if (!company) {
        company = await ExhibitorRegistration.findById(estimate.companyId).lean();
      }
      if (company) {
        estimate.exhibitor = company;
      }
    }

    res.status(200).json(estimate);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching estimate",
      error: error.message,
    });
  }
};

// Update
const updateEstimate = async (req, res) => {
  try {
    const updated = await Estimate.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
    });

    if (!updated)
      return res.status(404).json({ message: "Estimate not found" });
    const accountName = await getDocumentAccountName(updated, "account");
    await logActivity(
      req,
      "Updated",
      "Accounts",
      `Updated Proforma Invoice for ${accountName}. Amount: ₹${updated.finalAmount || 0}`,
    );

    res.status(200).json({
      message: "✏️ Estimate updated",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating estimate",
      error: error.message,
    });
  }
};

const IMPACT_FIELDS = [
  ["est_type", "Estimate type"],
  ["gst_no", "GST number"],
  ["supply_date", "Supply date"],
  ["company_name", "Company name"],
  ["company_addr", "Company address"],
  ["company_gst_no", "Company GST number"],
  ["event_name", "Event / consignee name"],
  ["event_place_of_supply", "Event / delivery address"],
  ["event_gst_no", "Event GST number"],
  ["consignee_person", "Contact person"],
  ["consignee_phone", "Contact phone"],
  ["country", "Country"],
  ["state", "State"],
  ["city", "City"],
  ["pincode", "PIN code"],
  ["finalAmount", "Grand total"],
  ["remarks", "Remarks"],
  ["terms", "Terms"],
];

const normalizeImpactValue = (value) => {
  if (value === undefined || value === null) return "";
  return typeof value === "number" ? Number(value) : String(value).trim();
};

const summarizeItemChanges = (oldItems = [], newItems = []) => {
  const comparableFields = [
    "description", "hsn", "qty", "size", "area", "unit", "rate",
    "amount", "disc", "gstRate", "tax", "finalAmount",
  ];
  const maxLength = Math.max(oldItems.length, newItems.length);
  let added = 0;
  let removed = 0;
  let modified = 0;

  for (let index = 0; index < maxLength; index += 1) {
    if (!oldItems[index]) {
      added += 1;
      continue;
    }
    if (!newItems[index]) {
      removed += 1;
      continue;
    }
    const changed = comparableFields.some(
      (field) => normalizeImpactValue(oldItems[index][field])
        !== normalizeImpactValue(newItems[index][field]),
    );
    if (changed) modified += 1;
  }

  return { added, removed, modified };
};

// Read-only preflight used before editing a PI. Existing downstream documents
// remain historical snapshots and are never changed by this endpoint.
const getEstimateImpactPreview = async (req, res) => {
  try {
    const estimate = await Estimate.findById(req.params.id).lean();
    if (!estimate) {
      return res.status(404).json({ message: "Estimate not found" });
    }

    const changedFields = IMPACT_FIELDS.reduce((changes, [field, label]) => {
      if (!Object.prototype.hasOwnProperty.call(req.body, field)) return changes;
      const before = normalizeImpactValue(estimate[field]);
      const after = normalizeImpactValue(req.body[field]);
      if (before !== after) changes.push({ field, label, before, after });
      return changes;
    }, []);
    const itemChanges = summarizeItemChanges(estimate.items, req.body.items);

    const estimateId = String(estimate._id);
    const invoices = await Invoice.find({
      $or: [
        { source_estimate_id: estimateId },
        { companyId: String(estimate.companyId), estimate_no: estimate.est_no },
      ],
    }).select("_id invoice_no status finalAmount").lean();

    const invoiceIds = invoices.map((invoice) => String(invoice._id));
    const invoiceNumbers = invoices.map((invoice) => invoice.invoice_no).filter(Boolean);

    const [deliveryChallans, payments, creditNotes, debitNotes] = await Promise.all([
      DeliveryChallan.find({ source_estimate_id: estimateId })
        .select("_id challan_no status challan_date").lean(),
      invoiceIds.length
        ? Payment.find({ invoice_id: { $in: invoiceIds } })
          .select("_id ex_no invoice_id amount_text f_amount payment_date status").lean()
        : [],
      CreditNote.find({
        companyId: String(estimate.companyId),
        est_no: estimate.est_no,
      }).select("_id create_note_no status").lean(),
      DebitNote.find({
        companyId: String(estimate.companyId),
        $or: [
          { toInvoiceId: { $in: [estimateId, ...invoiceIds] } },
          { toInvoiceNo: { $in: [estimate.est_no, ...invoiceNumbers] } },
        ],
      }).select("_id debit_note_no status totalAmount").lean(),
    ]);

    const hasItemChanges = Object.values(itemChanges).some((count) => count > 0);
    const dependencyCount = invoices.length + deliveryChallans.length
      + payments.length + creditNotes.length + debitNotes.length;

    return res.status(200).json({
      hasChanges: changedFields.length > 0 || hasItemChanges,
      hasImpact: dependencyCount > 0,
      changedFields,
      itemChanges,
      dependencies: {
        invoices,
        deliveryChallans,
        payments,
        creditNotes,
        debitNotes,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error checking Proforma Invoice impact",
      error: error.message,
    });
  }
};

// Delete
const deleteEstimate = async (req, res) => {
  try {
    const deleted = await Estimate.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ message: "Estimate not found" });
    const accountName = await getDocumentAccountName(deleted, "account");
    await logActivity(
      req,
      "Deleted",
      "Accounts",
      `Deleted Proforma Invoice for ${accountName}. Amount: ₹${deleted.finalAmount || 0}`,
    );

    res.status(200).json({
      message: "🗑️ Estimate deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting estimate",
      error: error.message,
    });
  }
};

// Get next estimate number
const getNextEstimateNumber = async (req, res) => {
  try {
    const nextNo = await generateNextProformaNo();
    res.status(200).json({ est_no: nextNo });
  } catch (error) {
    res.status(500).json({
      message: "Error generating estimate number",
      error: error.message,
    });
  }
};

// Preview Estimate via WhatsApp
const previewWhatsAppEstimate = async (req, res) => {
  try {
    const estimate = await Estimate.findById(req.params.id);
    if (!estimate) return res.status(404).json({ message: "Estimate not found" });

    let phone = req.body?.phone;
    if (!phone) {
      let company = await Company.findById(estimate.companyId);
      if (!company) {
        company = await ExhibitorRegistration.findById(estimate.companyId);
      }
      phone = company?.contact1?.mobile || company?.contacts?.[0]?.mobile || company?.mobile || company?.contact2?.mobile || company?.contact1?.phone || company?.contact2?.phone;
    }
    if (!phone) return res.status(400).json({ message: "Phone number is required and not found in company data" });

    const dateStr = estimate.supply_date ? new Date(estimate.supply_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');

    const totalTaxable = estimate.items?.reduce((sum, item) => sum + (parseFloat(item.taxable) || parseFloat(item.amount) || 0), 0).toFixed(2);

    let itemsText = estimate.items.map((i, index) => {
      let itemStr = `🔹 *${index + 1}. ${i.description}*\n` +
        `      Qty: ${i.qty} ${i.unit} | Rate: ₹${i.rate}\n` +
        `      Amount: ₹${i.amount}\n`;

      if (i.discount > 0) itemStr += `      Discount: ₹${i.discount}\n`;
      if (i.taxable > 0) itemStr += `      Taxable Value: ₹${i.taxable}\n`;

      if (i.gstRate && i.gstRate.includes('IGST')) {
        itemStr += `      IGST: ₹${i.tax} (${i.gstRate})\n`;
      } else if (i.gstRate) {
        const halfTax = (parseFloat(i.tax) / 2).toFixed(2);
        itemStr += `      CGST: ₹${halfTax} | SGST: ₹${halfTax}\n`;
      } else if (i.tax > 0) {
        itemStr += `      Tax: ₹${i.tax}\n`;
      }

      itemStr += `      *Item Total: ₹${i.finalAmount}*`;
      return itemStr;
    }).join('\n\n');

    let totalsText = ``;
    totalsText += `      *Total Taxable Value:* ₹${totalTaxable}\n`;

    if (estimate.igst > 0) {
      totalsText += `      *IGST:* ₹${parseFloat(estimate.igst).toFixed(2)}\n`;
    } else {
      if (estimate.cgst > 0) totalsText += `      *CGST:* ₹${parseFloat(estimate.cgst).toFixed(2)}\n`;
      if (estimate.sgst > 0) totalsText += `      *SGST:* ₹${parseFloat(estimate.sgst).toFixed(2)}\n`;
    }

    if (estimate.discount > 0) {
      totalsText += `      *Discount:* ₹${parseFloat(estimate.discount).toFixed(2)}\n`;
    }

    const message = `✨ *PROFORMA INVOICE DETAILS* ✨\n\n`
      + `Namo Gange Namaskar! 🙏\n\n`
      + `Dear *${(estimate.consignee_name && estimate.consignee_name.toLowerCase().includes('9th edition')) ? (estimate.company_name || estimate.consignee_name) : estimate.consignee_name || 'Client'}*,\n\n`
      + `Thank you for choosing *International Health & Wellness Expo*. We are pleased to share the details of your Proforma Invoice.\n\n`
      + `📄 *Invoice No:* ${estimate.est_no}\n`
      + `📅 *Date:* ${dateStr}\n`
      + `🏢 *Company:* ${(estimate.consignee_name && estimate.consignee_name.toLowerCase().includes('9th edition')) ? (estimate.company_name || estimate.consignee_name) : estimate.consignee_name}\n`
      + `📍 *Location:* ${estimate.city || 'N/A'}, ${estimate.state || 'N/A'}\n`
      + `📝 *GSTIN:* ${estimate.gst_no || 'N/A'}\n\n`
      + `📋 *ITEM DETAILS:*\n`
      + `-------------------------------\n`
      + `${itemsText}\n`
      + `-------------------------------\n\n`
      + `📊 *INVOICE SUMMARY:*\n`
      + `${totalsText}\n`
      + `💰 *GRAND TOTAL:* *₹${estimate.finalAmount}*\n\n`
      + `If you have any queries or require further clarification, please feel free to reach out to us. We look forward to a successful collaboration! 🤝\n\n`
      + `🌐 *Website:* https://www.ihwe.in\n`
      + `📧 *Email:* info@ihwe.in\n`
      + `📞 *Contact:* +91 9654900525\n\n`
      + `Warm Regards,\n`
      + `*Namo Gange Wellness Pvt. Ltd.* 🌿`;

    const templateParams = [
      (estimate.consignee_name && estimate.consignee_name.toLowerCase().includes('9th edition') ? estimate.company_name : estimate.consignee_name) || 'Client',
      estimate.est_no || 'N/A',
      dateStr,
      (estimate.consignee_name && estimate.consignee_name.toLowerCase().includes('9th edition') ? estimate.company_name : estimate.consignee_name) || 'Company',
      `${estimate.city || 'N/A'}, ${estimate.state || 'N/A'}`,
      itemsText,
      totalsText,
      String(estimate.finalAmount || 0)
    ];

    res.status(200).json({ phone, message, templateParams });
  } catch (error) {
    res.status(500).json({ message: "Error previewing WhatsApp", error: error.message });
  }
};

// Send Estimate via WhatsApp
const sendWhatsAppEstimate = async (req, res) => {
  try {
    const { customPhone, customMessage, customTemplateParams } = req.body;
    const estimate = await Estimate.findById(req.params.id);
    if (!estimate) return res.status(404).json({ message: "Estimate not found" });

    let phone = customPhone;
    let message = customMessage;
    let templateParams = customTemplateParams;

    if (!phone || !message) {
      if (!phone) {
        let company = await Company.findById(estimate.companyId);
        if (!company) {
          company = await ExhibitorRegistration.findById(estimate.companyId);
        }
        phone = company?.contact1?.mobile || company?.contacts?.[0]?.mobile || company?.mobile || company?.contact2?.mobile || company?.contact1?.phone || company?.contact2?.phone;
      }
      if (!phone) return res.status(400).json({ message: "Phone number is required and not found in company data" });

      const dateStr = estimate.supply_date ? new Date(estimate.supply_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');

      const totalTaxable = estimate.items?.reduce((sum, item) => sum + (parseFloat(item.taxable) || parseFloat(item.amount) || 0), 0).toFixed(2);

      let itemsText = estimate.items.map((i, index) => {
        let itemStr = `🔹 *${index + 1}. ${i.description}*\n` +
          `      Qty: ${i.qty} ${i.unit} | Rate: ₹${i.rate}\n` +
          `      Amount: ₹${i.amount}\n`;

        if (i.discount > 0) itemStr += `      Discount: ₹${i.discount}\n`;
        if (i.taxable > 0) itemStr += `      Taxable Value: ₹${i.taxable}\n`;

        if (i.gstRate && i.gstRate.includes('IGST')) {
          itemStr += `      IGST: ₹${i.tax} (${i.gstRate})\n`;
        } else if (i.gstRate) {
          const halfTax = (parseFloat(i.tax) / 2).toFixed(2);
          itemStr += `      CGST: ₹${halfTax} | SGST: ₹${halfTax}\n`;
        } else if (i.tax > 0) {
          itemStr += `      Tax: ₹${i.tax}\n`;
        }

        itemStr += `      *Item Total: ₹${i.finalAmount}*`;
        return itemStr;
      }).join('\n\n');

      let totalsText = ``;
      totalsText += `      *Total Taxable Value:* ₹${totalTaxable}\n`;

      if (estimate.igst > 0) {
        totalsText += `      *IGST:* ₹${parseFloat(estimate.igst).toFixed(2)}\n`;
      } else {
        if (estimate.cgst > 0) totalsText += `      *CGST:* ₹${parseFloat(estimate.cgst).toFixed(2)}\n`;
        if (estimate.sgst > 0) totalsText += `      *SGST:* ₹${parseFloat(estimate.sgst).toFixed(2)}\n`;
      }

      if (estimate.discount > 0) {
        totalsText += `      *Discount:* ₹${parseFloat(estimate.discount).toFixed(2)}\n`;
      }

      message = `✨ *PROFORMA INVOICE DETAILS* ✨\n\n`
        + `Namo Gange Namaskar! 🙏\n\n`
        + `Dear *${(estimate.consignee_name && estimate.consignee_name.toLowerCase().includes('9th edition')) ? (estimate.company_name || estimate.consignee_name) : estimate.consignee_name || 'Client'}*,\n\n`
        + `Thank you for choosing *International Health & Wellness Expo*. We are pleased to share the details of your Proforma Invoice.\n\n`
        + `📄 *Invoice No:* ${estimate.est_no}\n`
        + `📅 *Date:* ${dateStr}\n`
        + `🏢 *Company:* ${(estimate.consignee_name && estimate.consignee_name.toLowerCase().includes('9th edition')) ? (estimate.company_name || estimate.consignee_name) : estimate.consignee_name}\n`
        + `📍 *Location:* ${estimate.city || 'N/A'}, ${estimate.state || 'N/A'}\n`
        + `📝 *GSTIN:* ${estimate.gst_no || 'N/A'}\n\n`
        + `📋 *ITEM DETAILS:*\n`
        + `-------------------------------\n`
        + `${itemsText}\n`
        + `-------------------------------\n\n`
        + `📊 *INVOICE SUMMARY:*\n`
        + `${totalsText}\n`
        + `💰 *GRAND TOTAL:* *₹${estimate.finalAmount}*\n\n`
        + `If you have any queries or require further clarification, please feel free to reach out to us. We look forward to a successful collaboration! 🤝\n\n`
        + `🌐 *Website:* https://www.ihwe.in\n`
        + `📧 *Email:* info@ihwe.in\n`
        + `📞 *Contact:* +91 9654900525\n\n`
        + `Warm Regards,\n`
        + `*Namo Gange Wellness Pvt. Ltd.* 🌿`;

      templateParams = [
        (estimate.consignee_name && estimate.consignee_name.toLowerCase().includes('9th edition') ? estimate.company_name : estimate.consignee_name) || 'Client',
        estimate.est_no || 'N/A',
        dateStr,
        (estimate.consignee_name && estimate.consignee_name.toLowerCase().includes('9th edition') ? estimate.company_name : estimate.consignee_name) || 'Company',
        `${estimate.city || 'N/A'}, ${estimate.state || 'N/A'}`,
        itemsText,
        totalsText,
        String(estimate.finalAmount || 0)
      ];
    }

    let result;
    if (customMessage) {
      const { sendWhatsAppMessage } = require('../utils/whatsapp');
      result = await sendWhatsAppMessage(phone, message, estimate.consignee_name);
    } else {
      result = await sendProformaInvoiceWhatsApp(phone, message, estimate.consignee_name, templateParams);
    }

    if (result.success) {
      estimate.whatsappSent = true;
      estimate.whatsappSentAt = new Date();
      await estimate.save();
      res.status(200).json({ message: "WhatsApp message sent successfully" });
    } else {
      res.status(500).json({ message: "Failed to send WhatsApp message", error: result.error });
    }
  } catch (error) {
    res.status(500).json({ message: "Error sending WhatsApp", error: error.message });
  }
};

// Preview Estimate via Email
const previewEmailEstimate = async (req, res) => {
  try {
    const estimate = await Estimate.findById(req.params.id);
    if (!estimate) return res.status(404).json({ message: "Estimate not found" });

    let email = req.body?.email;
    if (!email) {
      let company = await Company.findById(estimate.companyId);
      if (!company) {
        company = await ExhibitorRegistration.findById(estimate.companyId);
      }
      email = company?.contact1?.email || company?.contacts?.[0]?.email || company?.companyEmail || company?.email;
    }
    if (!email) return res.status(400).json({ message: "Email is required and not found in company data" });

    const dateStr = estimate.supply_date ? new Date(estimate.supply_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');

    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalDiscountAmt = 0;

    let itemsHtml = estimate.items.map((i, index) => {
      const qty = parseFloat(i.qty) || 1;
      const rate = parseFloat(i.rate) || 0;
      const amount = qty * rate;
      const discPct = parseFloat(i.disc) || 0;
      const discAmt = (amount * discPct) / 100;
      const taxable = amount - discAmt;

      totalTaxable += taxable;
      totalDiscountAmt += discAmt;

      const igstPer = parseFloat(i.igst_per) || 0;
      const cgstPer = parseFloat(i.cgst_per) || 0;

      if (igstPer > 0) {
        totalIgst += (taxable * igstPer) / 100;
      } else if (cgstPer > 0) {
        totalCgst += (taxable * cgstPer) / 100;
        totalSgst += (taxable * cgstPer) / 100;
      }

      return `
            <tr>
                <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: center; color: #475569; font-size: 13px;">${index + 1}</td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #eee;">
                    <div style="font-weight: bold; color: #1e293b; font-size: 14px;">${i.description}</div>
                    ${i.subDesc ? `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">${i.subDesc.replace(/\n/g, '<br>')}</div>` : ''}
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">HSN/SAC: ${i.hsn || 'N/A'}</div>
                </td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: center; color: #475569; font-size: 13px;">${qty} ${i.unit || 'Nos'}</td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: right; color: #475569; font-size: 13px;">₹${rate.toFixed(2)}</td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: right; color: #475569; font-size: 13px;">₹${taxable.toFixed(2)}</td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #1e293b; font-size: 13px;">₹${parseFloat(i.finalAmount).toFixed(2)}</td>
            </tr>
            `;
    }).join('');

    let totalsHtml = `
            <tr>
                <td colspan="5" style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #eee; color: #555;"><strong>Total Taxable Value:</strong></td>
                <td style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #eee; color: #555;">₹${totalTaxable.toFixed(2)}</td>
            </tr>
        `;

    if (totalDiscountAmt > 0) {
      totalsHtml += `
            <tr>
                <td colspan="5" style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #eee; color: #e53e3e;"><strong>Total Discount:</strong></td>
                <td style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #eee; color: #e53e3e;">-₹${totalDiscountAmt.toFixed(2)}</td>
            </tr>`;
    }

    if (totalIgst > 0) {
      totalsHtml += `
            <tr>
                <td colspan="5" style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #eee; color: #555;"><strong>IGST:</strong></td>
                <td style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #eee; color: #555;">₹${totalIgst.toFixed(2)}</td>
            </tr>`;
    } else {
      if (totalCgst > 0) {
        totalsHtml += `
                <tr>
                    <td colspan="5" style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #eee; color: #555;"><strong>CGST:</strong></td>
                    <td style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #eee; color: #555;">₹${totalCgst.toFixed(2)}</td>
                </tr>`;
      }
      if (totalSgst > 0) {
        totalsHtml += `
                <tr>
                    <td colspan="5" style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #eee; color: #555;"><strong>SGST:</strong></td>
                    <td style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #eee; color: #555;">₹${totalSgst.toFixed(2)}</td>
                </tr>`;
      }
    }

    const htmlContent = `
            <div style="font-family: Arial, sans-serif; background-color: #f4f7f6; padding: 20px 10px;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 700px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #ffffff; padding: 15px 20px; border-bottom: 2px solid #3598dc;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="color: #1e293b;">
                                        <h1 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 1px;">PROFORMA INVOICE</h1>
                                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">International Health & Wellness Expo</p>
                                    </td>
                                    <td align="right" style="color: #1e293b;">
                                        <h2 style="margin: 0; font-size: 16px;">${estimate.est_no}</h2>
                                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">Date: ${dateStr}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Details -->
                    <tr>
                        <td style="padding: 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td width="48%" valign="top">
                                        <h3 style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #94a3b8; border-bottom: 1px solid #eee; padding-bottom: 5px;">From</h3>
                                        <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: bold; color: #1e293b;">Namo Gange Wellness Pvt. Ltd.</p>
                                        <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.4;">12/52 Site-2, Sunrise Industrial Area,<br>Mohan Nagar, Ghaziabad, UP - 201007, Bharat</p>
                                    </td>
                                    <td width="4%"></td>
                                    <td width="48%" valign="top">
                                        <h3 style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #94a3b8; border-bottom: 1px solid #eee; padding-bottom: 5px;">Billed To</h3>
                                        <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: bold; color: #1e3c72; text-transform: capitalize;">${(estimate.consignee_name && estimate.consignee_name.toLowerCase().includes('9th edition')) ? (estimate.company_name || estimate.consignee_name) : estimate.consignee_name}</p>
                                        <p style="margin: 0 0 4px 0; font-size: 13px; color: #475569; line-height: 1.4; text-transform: capitalize;">${estimate.consignee_addr}<br>${estimate.city || ''}, ${estimate.state || ''} - ${estimate.pincode || ''}</p>
                                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #475569; background-color: #f1f5f9; display: inline-block; padding: 3px 8px; border-radius: 4px;"><strong>GSTIN:</strong> ${estimate.gst_no || 'N/A'}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Items Table -->
                    <tr>
                        <td style="padding: 0 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                                <thead>
                                    <tr>
                                        <th style="padding: 10px; background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 12px; text-align: center;">#</th>
                                        <th style="padding: 10px; background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 12px; text-align: left;">DESCRIPTION</th>
                                        <th style="padding: 10px; background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 12px; text-align: center;">QTY</th>
                                        <th style="padding: 10px; background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 12px; text-align: right;">RATE</th>
                                        <th style="padding: 10px; background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 12px; text-align: right;">TAXABLE</th>
                                        <th style="padding: 10px; background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 12px; text-align: right;">TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHtml}
                                    <!-- Totals Rows -->
                                    ${totalsHtml}
                                    <tr>
                                        <td colspan="5" style="padding: 15px; text-align: right; background-color: #f8fafc; color: #1e3c72; font-size: 16px;"><strong>GRAND TOTAL:</strong></td>
                                        <td style="padding: 15px; text-align: right; background-color: #f8fafc; color: #1e3c72; font-size: 18px; font-weight: bold;">₹${estimate.finalAmount}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 15px 20px; text-align: center; margin-top: 20px; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b; line-height: 1.5;">If you have any queries or require further clarification, please feel free to reach out to us. We look forward to a successful collaboration!</p>
                            <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 10px;">
                                <tr>
                                    <td style="padding: 0 10px; border-right: 1px solid #cbd5e1;"><a href="https://www.ihwe.in" style="color: #3598dc; text-decoration: none; font-size: 11px;">www.ihwe.in</a></td>
                                    <td style="padding: 0 10px; border-right: 1px solid #cbd5e1;"><a href="mailto:info@ihwe.in" style="color: #3598dc; text-decoration: none; font-size: 11px;">info@ihwe.in</a></td>
                                    <td style="padding: 0 10px;"><span style="color: #475569; font-size: 11px;">+91 9654900525</span></td>
                                </tr>
                            </table>
                            <p style="margin: 0; font-size: 11px; font-weight: bold; color: #94a3b8; letter-spacing: 1px;">NAMO GANGE WELLNESS PVT. LTD.</p>
                        </td>
                    </tr>

                </table>
            </div>
        `;

    res.status(200).json({ email, htmlContent });
  } catch (error) {
    res.status(500).json({ message: "Error previewing Email", error: error.message });
  }
};

// Send Estimate via Email
const sendEmailEstimate = async (req, res) => {
  try {
    const { customEmail, customHtmlContent } = req.body;
    let email = customEmail;
    let htmlContent = customHtmlContent;
    let estimate = await Estimate.findById(req.params.id);
    if (!estimate) return res.status(404).json({ message: "Estimate not found" });

    if (!email || !htmlContent) {
      if (!email) {
        let company = await Company.findById(estimate.companyId);
        if (!company) {
          company = await ExhibitorRegistration.findById(estimate.companyId);
        }
        email = company?.contact1?.email || company?.contacts?.[0]?.email || company?.companyEmail || company?.email;
      }
      if (!email) return res.status(400).json({ message: "Email is required and not found in company data" });

      const dateStr = estimate.supply_date ? new Date(estimate.supply_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');

      let totalTaxable = 0;
      let totalCgst = 0;
      let totalSgst = 0;
      let totalIgst = 0;
      let totalDiscountAmt = 0;

      let itemsHtml = estimate.items.map((i, index) => {
        const qty = parseFloat(i.qty) || 1;
        const rate = parseFloat(i.rate) || 0;
        const amount = qty * rate;
        const discPct = parseFloat(i.disc) || 0;
        const discAmt = (amount * discPct) / 100;
        const taxable = amount - discAmt;

        totalTaxable += taxable;
        totalDiscountAmt += discAmt;

        const igstPer = parseFloat(i.igst_per) || 0;
        const cgstPer = parseFloat(i.cgst_per) || 0;

        if (igstPer > 0) {
          totalIgst += (taxable * igstPer) / 100;
        } else if (cgstPer > 0) {
          totalCgst += (taxable * cgstPer) / 100;
          totalSgst += (taxable * cgstPer) / 100;
        }

        return `
                <tr>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: center; color: #475569; font-size: 13px;">${index + 1}</td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #eee;">
                        <div style="font-weight: bold; color: #1e293b; font-size: 14px;">${i.description}</div>
                        ${i.subDesc ? `\\<div style="font-size: 12px; color: #64748b; margin-top: 4px;">${i.subDesc.replace(/\n/g, '<br>')}\\</div>` : ''}
                        <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">HSN/SAC: ${i.hsn || 'N/A'}</div>
                    </td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: center; color: #475569; font-size: 13px;">${qty} ${i.unit || 'Nos'}</td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: right; color: #475569; font-size: 13px;">₹${rate.toFixed(2)}</td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: right; color: #475569; font-size: 13px;">₹${taxable.toFixed(2)}</td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #1e293b; font-size: 13px;">₹${parseFloat(i.finalAmount).toFixed(2)}</td>
                </tr>
                `;
      }).join('');

      let totalsHtml = `
                <tr>
                    <td colspan="5" style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #eee; color: #555;"><strong>Total Taxable Value:</strong></td>
                    <td style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #eee; color: #555;">₹${totalTaxable.toFixed(2)}</td>
                </tr>
            `;

      if (totalDiscountAmt > 0) {
        totalsHtml += `
                <tr>
                    <td colspan="5" style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #eee; color: #e53e3e;"><strong>Total Discount:</strong></td>
                    <td style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #eee; color: #e53e3e;">-₹${totalDiscountAmt.toFixed(2)}</td>
                </tr>`;
      }

      if (totalIgst > 0) {
        totalsHtml += `
                <tr>
                    <td colspan="5" style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #eee; color: #555;"><strong>IGST:</strong></td>
                    <td style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #eee; color: #555;">₹${totalIgst.toFixed(2)}</td>
                </tr>`;
      } else {
        if (totalCgst > 0) {
          totalsHtml += `
                    <tr>
                        <td colspan="5" style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #eee; color: #555;"><strong>CGST:</strong></td>
                        <td style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #eee; color: #555;">₹${totalCgst.toFixed(2)}</td>
                    </tr>`;
        }
        if (totalSgst > 0) {
          totalsHtml += `
                    <tr>
                        <td colspan="5" style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #eee; color: #555;"><strong>SGST:</strong></td>
                        <td style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #eee; color: #555;">₹${totalSgst.toFixed(2)}</td>
                    </tr>`;
        }
      }

      htmlContent = `
                <div style="font-family: Arial, sans-serif; background-color: #f4f7f6; padding: 20px 10px;">
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 700px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                        
                        <!-- Header -->
                        <tr>
                            <td style="background-color: #ffffff; padding: 15px 20px; border-bottom: 2px solid #3598dc;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td style="color: #1e293b;">
                                            <h1 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 1px;">PROFORMA INVOICE</h1>
                                            <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">International Health & Wellness Expo</p>
                                        </td>
                                        <td align="right" style="color: #1e293b;">
                                            <h2 style="margin: 0; font-size: 16px;">${estimate.est_no}</h2>
                                            <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">Date: ${dateStr}</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Details -->
                        <tr>
                            <td style="padding: 30px;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td width="48%" valign="top">
                                            <h3 style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #94a3b8; border-bottom: 1px solid #eee; padding-bottom: 5px;">From</h3>
                                            <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: bold; color: #1e293b;">Namo Gange Wellness Pvt. Ltd.</p>
                                            <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.4;">12/52 Site-2, Sunrise Industrial Area,<br>Mohan Nagar, Ghaziabad, UP - 201007, Bharat</p>
                                        </td>
                                        <td width="4%"></td>
                                        <td width="48%" valign="top">
                                            <h3 style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #94a3b8; border-bottom: 1px solid #eee; padding-bottom: 5px;">Billed To</h3>
                                            <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: bold; color: #1e3c72; text-transform: capitalize;">${(estimate.consignee_name && estimate.consignee_name.toLowerCase().includes('9th edition')) ? (estimate.company_name || estimate.consignee_name) : estimate.consignee_name}</p>
                                            <p style="margin: 0 0 4px 0; font-size: 13px; color: #475569; line-height: 1.4; text-transform: capitalize;">${estimate.consignee_addr}<br>${estimate.city || ''}, ${estimate.state || ''} - ${estimate.pincode || ''}</p>
                                            <p style="margin: 5px 0 0 0; font-size: 12px; color: #475569; background-color: #f1f5f9; display: inline-block; padding: 3px 8px; border-radius: 4px;"><strong>GSTIN:</strong> ${estimate.gst_no || 'N/A'}</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Items Table -->
                        <tr>
                            <td style="padding: 0 30px;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                                    <thead>
                                        <tr>
                                            <th style="padding: 10px; background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 12px; text-align: center;">#</th>
                                            <th style="padding: 10px; background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 12px; text-align: left;">DESCRIPTION</th>
                                            <th style="padding: 10px; background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 12px; text-align: center;">QTY</th>
                                            <th style="padding: 10px; background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 12px; text-align: right;">RATE</th>
                                            <th style="padding: 10px; background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 12px; text-align: right;">TAXABLE</th>
                                            <th style="padding: 10px; background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 12px; text-align: right;">TOTAL</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${itemsHtml}
                                        <!-- Totals Rows -->
                                        ${totalsHtml}
                                        <tr>
                                            <td colspan="5" style="padding: 15px; text-align: right; background-color: #f8fafc; color: #1e3c72; font-size: 16px;"><strong>GRAND TOTAL:</strong></td>
                                            <td style="padding: 15px; text-align: right; background-color: #f8fafc; color: #1e3c72; font-size: 18px; font-weight: bold;">₹${estimate.finalAmount}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8fafc; padding: 15px 20px; text-align: center; margin-top: 20px; border-top: 1px solid #e2e8f0;">
                                <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b; line-height: 1.5;">If you have any queries or require further clarification, please feel free to reach out to us. We look forward to a successful collaboration!</p>
                                <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 10px;">
                                    <tr>
                                        <td style="padding: 0 10px; border-right: 1px solid #cbd5e1;"><a href="https://www.ihwe.in" style="color: #3598dc; text-decoration: none; font-size: 11px;">www.ihwe.in</a></td>
                                        <td style="padding: 0 10px; border-right: 1px solid #cbd5e1;"><a href="mailto:info@ihwe.in" style="color: #3598dc; text-decoration: none; font-size: 11px;">info@ihwe.in</a></td>
                                        <td style="padding: 0 10px;"><span style="color: #475569; font-size: 11px;">+91 9654900525</span></td>
                                    </tr>
                                </table>
                                <p style="margin: 0; font-size: 11px; font-weight: bold; color: #94a3b8; letter-spacing: 1px;">NAMO GANGE WELLNESS PVT. LTD.</p>
                            </td>
                        </tr>

                    </table>
                </div>
            `;
    }

    const subject = `Proforma Invoice Details - ${estimate.est_no}`;

    await emailService.sendEmail({
      to: email,
      subject: subject,
      html: htmlContent,
      profile: 'DEFAULT'
    });

    estimate.emailSent = true;
    estimate.emailSentAt = new Date();
    await estimate.save();

    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error sending Email", error: error.message });
  }
};

// ✅ EXPORT
module.exports = {
  addEstimate,
  getGroupedEstimateData,
  getAllEstimates,
  getEstimateById,
  getEstimateImpactPreview,
  updateEstimate,
  deleteEstimate,
  getNextEstimateNumber,
  sendWhatsAppEstimate,
  previewWhatsAppEstimate,
  sendEmailEstimate,
  previewEmailEstimate,
};
