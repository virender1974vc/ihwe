const Invoice = require("../models/Invoice");
const Estimate = require("../models/Estimate");
const DeliveryChallan = require("../models/DeliveryChallan");
const Payment = require("../models/Payment");
const CreditNote = require("../models/CreditNote");
const DebitNote = require("../models/DebitNote");
const Company = require("../models/Company");
const ExhibitorRegistration = require("../models/ExhibitorRegistration");
const { sendWhatsAppMessage, sendTaxInvoiceWhatsApp } = require('../utils/whatsapp');
const emailService = require('../utils/emailService');
const { logActivity } = require("../utils/logger");
const { getDocumentAccountName } = require("../utils/accountActivityDetails");

const normalizeItemValue = (value) => String(value ?? "").trim().toLowerCase();
const getItemKey = (item = {}) => [
  normalizeItemValue(item.description),
  normalizeItemValue(item.hsn),
  normalizeItemValue(item.unit),
  normalizeItemValue(item.size),
  normalizeItemValue(item.area),
  Number(item.rate || 0).toFixed(2),
].join("|");
const isCancelledDoc = (doc) => String(doc?.status || "").trim().toLowerCase() === "cancelled";

const buildDeliveryChallanSnapshots = async (payload) => {
  const rawIds = Array.isArray(payload.delivery_challan_ids)
    ? payload.delivery_challan_ids.map((id) => String(id || "").trim()).filter(Boolean)
    : [];
  const ids = [...new Set(rawIds)];

  if (ids.length !== rawIds.length) {
    return { error: "A delivery challan cannot be selected more than once." };
  }
  if (ids.length === 0) return { ids: [], snapshots: [] };

  const estimate = payload.source_estimate_id
    ? await Estimate.findById(payload.source_estimate_id).lean().catch(() => null)
    : await Estimate.findOne({
      est_no: payload.estimate_no,
      companyId: payload.companyId,
    }).lean();
  if (!estimate) {
    return { error: "The invoice proforma could not be found for delivery challan validation." };
  }

  const challans = await DeliveryChallan.find({ _id: { $in: ids } }).lean().catch(() => []);
  if (challans.length !== ids.length) {
    return { error: "One or more selected delivery challans were not found." };
  }

  const byId = new Map(challans.map((challan) => [String(challan._id), challan]));
  const snapshots = [];
  for (const id of ids) {
    const challan = byId.get(id);
    if (isCancelledDoc(challan)) {
      return { error: `Cancelled delivery challan ${challan.challan_no || id} cannot be linked.` };
    }
    if (String(challan.source_estimate_id) !== String(estimate._id)) {
      return { error: `Delivery challan ${challan.challan_no || id} does not belong to this proforma.` };
    }
    const belongsToCompany = String(challan.companyId) === String(payload.companyId)
      || String(challan.account_ref_id || "") === String(payload.companyId)
      || String(challan.companyId) === String(estimate.companyId);
    if (!belongsToCompany) {
      return { error: `Delivery challan ${challan.challan_no || id} does not belong to this client.` };
    }
    snapshots.push({
      delivery_challan_id: id,
      challan_no: challan.challan_no,
      challan_date: challan.challan_date || "",
      status: challan.status || "",
      delivery_address: challan.delivery_address || "",
      transporter_name: challan.transporter_name || "",
      vehicle_no: challan.vehicle_no || "",
      eway_bill: challan.eway_bill || "",
      bilty_no: challan.bilty_no || "",
      items: (challan.items || []).map((item) => ({
        description: item.description || "",
        hsn: item.hsn || "",
        qty: Number(item.qty || 0),
        unit: item.unit || "",
      })),
    });
  }
  return { ids, snapshots };
};

const validateInvoiceItemsAgainstEstimate = async (payload, excludeInvoiceId = null) => {
  if (!payload?.estimate_no && !payload?.source_estimate_id) return null;

  const estimateQuery = payload.source_estimate_id
    ? { _id: payload.source_estimate_id }
    : { est_no: payload.estimate_no, companyId: payload.companyId };
  const estimate = await Estimate.findOne(estimateQuery).lean();
  if (!estimate) return null;

  const allowedQtyByKey = new Map();
  (estimate.items || []).forEach((item) => {
    const key = getItemKey(item);
    allowedQtyByKey.set(key, (allowedQtyByKey.get(key) || 0) + (Number(item.qty) || 0));
  });

  const invoiceQuery = {
    companyId: payload.companyId,
    $or: [
      { source_estimate_id: String(estimate._id) },
      { estimate_no: estimate.est_no },
    ],
  };
  if (excludeInvoiceId) invoiceQuery._id = { $ne: excludeInvoiceId };

  const existingInvoices = await Invoice.find(invoiceQuery).lean();
  const usedQtyByKey = new Map();
  existingInvoices
    .filter((invoice) => !isCancelledDoc(invoice))
    .forEach((invoice) => {
      (invoice.items || []).forEach((item) => {
        const key = getItemKey(item);
        usedQtyByKey.set(key, (usedQtyByKey.get(key) || 0) + (Number(item.qty) || 0));
      });
    });

  const requestedQtyByKey = new Map();
  (payload.items || []).forEach((item) => {
    const key = getItemKey(item);
    requestedQtyByKey.set(key, (requestedQtyByKey.get(key) || 0) + (Number(item.qty) || 0));
  });

  for (const [key, requestedQty] of requestedQtyByKey.entries()) {
    if (!allowedQtyByKey.has(key)) {
      return "Selected invoice item does not exist in the selected proforma invoice.";
    }
    const remainingQty = (allowedQtyByKey.get(key) || 0) - (usedQtyByKey.get(key) || 0);
    if (requestedQty > remainingQty + 0.000001) {
      const description = (payload.items || []).find((item) => getItemKey(item) === key)?.description || "item";
      return `Only ${Math.max(0, remainingQty)} quantity remaining for ${description}.`;
    }
  }

  return null;
};

// 📍 GET all invoices
const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ added: -1 });
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching invoices",
      error: error.message,
    });
  }
};

// 📍 GET single invoice by ID
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).lean();

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    if (invoice.companyId) {
      let company = await Company.findById(invoice.companyId).lean();
      if (!company) {
        company = await ExhibitorRegistration.findById(invoice.companyId).lean();
      }
      if (company) {
        invoice.exhibitor = company;
      }
    }

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching invoice",
      error: error.message,
    });
  }
};

// 📍 CREATE new invoice
const createInvoice = async (req, res) => {
  try {
    // Required fields check
    const requiredFields = [
      "companyId",
      "type_of_invoice",
      "consignee_name",
      "items",
      "finalAmount",
    ];

    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === "") {
        return res.status(400).json({
          message: `Missing required field: ${field}`,
        });
      }
    }

    const validationError = await validateInvoiceItemsAgainstEstimate(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const challanResult = await buildDeliveryChallanSnapshots(req.body);
    if (challanResult.error) {
      return res.status(400).json({ message: challanResult.error });
    }

    // Generate invoice number
    const invoice_no = await Invoice.generateNextInvoiceNumber();

    const newInvoice = new Invoice({
      ...req.body,
      delivery_challan_ids: challanResult.ids,
      delivery_challans: challanResult.snapshots,
      invoice_no,
    });

    const savedInvoice = await newInvoice.save();
    const accountName = await getDocumentAccountName(savedInvoice, "account");
    await logActivity(
      req,
      "Created",
      "Accounts",
      `Created Invoice for ${accountName}. Amount: ₹${savedInvoice.finalAmount || 0}`,
    );

    res.status(201).json({
      message: "✅ Invoice Created",
      data: savedInvoice,
    });
  } catch (error) {
    console.error("Error creating invoice:", error);

    res.status(500).json({
      message: "Error creating invoice",
      error: error.message,
    });
  }
};

// 📍 UPDATE invoice
const updateInvoice = async (req, res) => {
  try {
    const existingInvoice = await Invoice.findById(req.params.id).lean();
    if (!existingInvoice) return res.status(404).json({ message: "Invoice not found" });
    const updateKeys = Object.keys(req.body || {});
    const isCancellationOnly = updateKeys.length === 1
      && updateKeys[0] === "status"
      && String(req.body.status || "").toLowerCase() === "cancelled";
    if (!isCancellationOnly) {
      return res.status(409).json({
        message: "Issued invoices cannot be edited. Mark the incorrect invoice as cancelled and create a corrected invoice, or use a credit/debit note.",
      });
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { returnDocument: 'after' },
    );

    if (!updatedInvoice)
      return res.status(404).json({ message: "Invoice not found" });
    const accountName = await getDocumentAccountName(updatedInvoice, "account");
    await logActivity(
      req,
      "Updated",
      "Accounts",
      `Updated Invoice for ${accountName}. Amount: ₹${updatedInvoice.finalAmount || 0}`,
    );

    res.status(200).json({
      message: "✅ Invoice Updated",
      data: updatedInvoice,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating invoice",
      error: error.message,
    });
  }
};

// 📍 DELETE invoice
const getSourceEstimateForInvoice = async (invoice) => {
  if (invoice.source_estimate_id) {
    const estimate = await Estimate.findById(invoice.source_estimate_id).lean().catch(() => null);
    if (estimate) return estimate;
  }
  return Estimate.findOne({ est_no: invoice.estimate_no, companyId: invoice.companyId }).lean();
};

const estimateItemToInvoiceItem = (item = {}) => {
  const amount = Number(item.amount || 0);
  const discountPct = Number(item.disc || 0);
  const taxableValue = Math.max(0, amount - ((amount * discountPct) / 100));
  const gstPct = String(item.gstRate || "0").replace(/[^\d.]/g, "") || "0";
  const gstAmount = Number(item.tax || 0) || (taxableValue * Number(gstPct) / 100);
  return {
    description: item.description || "", hsn: item.hsn || "", qty: Number(item.qty || 0),
    size: String(item.size ?? ""), area: String(item.area ?? ""), unit: item.unit || "Nos",
    rate: Number(item.rate || 0), amount, discountPct, taxableValue, gstPct, gstAmount,
    total: Number(item.finalAmount || (taxableValue + gstAmount)),
  };
};

const buildRevisedInvoiceData = (invoice, estimate) => ({
  source_estimate_id: String(estimate._id),
  estimate_no: estimate.est_no,
  type_of_invoice: estimate.est_type || invoice.type_of_invoice,
  gst_no: estimate.gst_no || "",
  supply_date: estimate.supply_date || invoice.supply_date,
  company_name: estimate.company_name || "",
  company_addr: estimate.company_addr || "",
  company_gst_no: estimate.company_gst_no || "",
  event_name: estimate.event_name || "",
  event_place_of_supply: estimate.event_place_of_supply || "",
  event_gst_no: estimate.event_gst_no || "",
  consignee_name: estimate.consignee_name || estimate.event_name || "",
  consignee_addr: estimate.consignee_addr || estimate.event_place_of_supply || "",
  billing_address: estimate.company_addr || invoice.billing_address,
  country: estimate.country || "", state: estimate.state || "", city: estimate.city || "",
  pincode: String(estimate.pincode || ""),
  items: (estimate.items || []).map(estimateItemToInvoiceItem),
  finalAmount: Number(estimate.finalAmount || 0),
  remarks: estimate.remarks || "",
  terms: estimate.terms || "",
});

const getInvoiceRevisionDependencies = async (invoice) => {
  const invoiceId = String(invoice._id);
  const [payments, creditNotes, debitNotes] = await Promise.all([
    Payment.find({ invoice_id: invoiceId }).select("_id ex_no amount_text f_amount payment_date status").lean(),
    CreditNote.find({ companyId: String(invoice.companyId), est_no: invoice.estimate_no })
      .select("_id create_note_no status").lean(),
    DebitNote.find({
      companyId: String(invoice.companyId),
      $or: [{ toInvoiceId: invoiceId }, { toInvoiceNo: invoice.invoice_no }],
    }).select("_id debit_note_no status totalAmount").lean(),
  ]);
  return { payments, creditNotes, debitNotes };
};

const summarizeInvoiceRevision = (invoice, revisedData) => {
  const fields = [
    ["type_of_invoice", "Invoice type"], ["gst_no", "GST number"],
    ["company_name", "Company name"], ["company_addr", "Company address"],
    ["consignee_name", "Consignee name"], ["consignee_addr", "Delivery address"],
    ["state", "State"], ["city", "City"], ["pincode", "PIN code"],
    ["finalAmount", "Grand total"], ["remarks", "Remarks"], ["terms", "Terms"],
  ];
  const changedFields = fields.reduce((result, [field, label]) => {
    const before = String(invoice[field] ?? "").trim();
    const after = String(revisedData[field] ?? "").trim();
    if (before !== after) result.push({ field, label, before, after });
    return result;
  }, []);
  const cleanItem = (item) => {
    const plain = item?.toObject ? item.toObject() : item;
    const { _id, ...rest } = plain || {};
    return rest;
  };
  const oldItems = (invoice.items || []).map(cleanItem);
  const newItems = revisedData.items || [];
  let modified = 0;
  for (let index = 0; index < Math.min(oldItems.length, newItems.length); index += 1) {
    if (JSON.stringify(oldItems[index]) !== JSON.stringify(newItems[index])) modified += 1;
  }
  const itemChanges = {
    added: Math.max(0, newItems.length - oldItems.length),
    removed: Math.max(0, oldItems.length - newItems.length),
    modified,
  };
  return {
    changedFields, itemChanges,
    hasChanges: changedFields.length > 0 || Object.values(itemChanges).some(Boolean),
  };
};

const previewInvoiceRevision = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).lean();
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (isCancelledDoc(invoice)) return res.status(409).json({ message: "Cancelled invoice cannot be revised." });
    const estimate = await getSourceEstimateForInvoice(invoice);
    if (!estimate) return res.status(404).json({ message: "Linked Proforma Invoice was not found." });
    const revisedData = buildRevisedInvoiceData(invoice, estimate);
    return res.status(200).json({
      ...summarizeInvoiceRevision(invoice, revisedData),
      invoice_no: invoice.invoice_no,
      current_revision: Number(invoice.revision_no || 0),
      next_revision: Number(invoice.revision_no || 0) + 1,
      dependencies: await getInvoiceRevisionDependencies(invoice),
      deliveryChallans: invoice.delivery_challans || [],
    });
  } catch (error) {
    return res.status(500).json({ message: "Error checking invoice revision", error: error.message });
  }
};

const reviseInvoiceFromEstimate = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (isCancelledDoc(invoice)) return res.status(409).json({ message: "Cancelled invoice cannot be revised." });
    const estimate = await getSourceEstimateForInvoice(invoice);
    if (!estimate) return res.status(404).json({ message: "Linked Proforma Invoice was not found." });

    const currentInvoice = invoice.toObject();
    const revisedData = buildRevisedInvoiceData(currentInvoice, estimate);
    if (!summarizeInvoiceRevision(currentInvoice, revisedData).hasChanges) {
      return res.status(409).json({ message: "Invoice already matches the latest Proforma Invoice." });
    }
    const validationError = await validateInvoiceItemsAgainstEstimate(
      { ...currentInvoice, ...revisedData }, invoice._id,
    );
    if (validationError) return res.status(400).json({ message: validationError });

    const snapshot = { ...currentInvoice };
    delete snapshot.revisions;
    delete snapshot._id;
    delete snapshot.__v;
    const nextRevision = Number(invoice.revision_no || 0) + 1;
    invoice.revisions.push({
      revision: nextRevision, revised_at: new Date(),
      revised_by: String(req.body?.revised_by || ""), reason: String(req.body?.reason || ""), snapshot,
    });
    Object.assign(invoice, revisedData, { revision_no: nextRevision, revised_at: new Date() });
    await invoice.save();

    const accountName = await getDocumentAccountName(invoice, "account");
    await logActivity(
      req, "Revised", "Accounts",
      `Revised Invoice ${invoice.invoice_no} to Rev ${nextRevision} for ${accountName}. Amount: ₹${invoice.finalAmount || 0}`,
    );
    return res.status(200).json({
      message: `Invoice revised successfully. Invoice number remains ${invoice.invoice_no}.`,
      data: invoice,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error revising invoice", error: error.message });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const existing = await Invoice.findById(req.params.id).select("_id").lean();
    if (!existing) return res.status(404).json({ message: "Invoice not found" });
    return res.status(409).json({
      message: "Invoices cannot be deleted because their number and audit history must be preserved. Mark the invoice as cancelled instead.",
    });

    const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);

    if (!deletedInvoice)
      return res.status(404).json({ message: "Invoice not found" });
    const accountName = await getDocumentAccountName(deletedInvoice, "account");
    await logActivity(
      req,
      "Deleted",
      "Accounts",
      `Deleted Invoice for ${accountName}. Amount: ₹${deletedInvoice.finalAmount || 0}`,
    );

    res.status(200).json({
      message: "🗑️ Invoice deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting invoice",
      error: error.message,
    });
  }
};

// Preview Invoice via WhatsApp
const previewWhatsAppInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    let phone = req.body?.phone;
    if (!phone) {
      let company = await Company.findById(invoice.companyId);
      if (!company) {
        company = await ExhibitorRegistration.findById(invoice.companyId);
      }
      phone = company?.contact1?.mobile || company?.contacts?.[0]?.mobile || company?.mobile || company?.contact2?.mobile || company?.contact1?.phone || company?.contact2?.phone;
    }
    if (!phone) return res.status(400).json({ message: "Phone number is required and not found in company data" });

    const dateStr = invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');

    const totalTaxable = invoice.items?.reduce((sum, item) => sum + (parseFloat(item.taxableValue) || parseFloat(item.amount) || 0), 0).toFixed(2);

    let itemsText = invoice.items.map((i, index) => {
      let itemStr = `🔹 *${index + 1}. ${i.description}*\n` +
        `      Qty: ${i.qty} ${i.unit} | Rate: ₹${i.rate}\n` +
        `      Amount: ₹${i.amount}\n`;

      if (i.discountPct > 0) itemStr += `      Discount: ${i.discountPct}%\n`;
      if (i.taxableValue > 0) itemStr += `      Taxable Value: ₹${i.taxableValue}\n`;

      if (i.gstPct && i.gstPct.includes('IGST')) {
        itemStr += `      IGST: ₹${i.gstAmount} (${i.gstPct})\n`;
      } else if (i.gstPct) {
        const halfTax = (parseFloat(i.gstAmount) / 2).toFixed(2);
        itemStr += `      CGST: ₹${halfTax} | SGST: ₹${halfTax}\n`;
      } else if (i.gstAmount > 0) {
        itemStr += `      Tax: ₹${i.gstAmount}\n`;
      }

      itemStr += `      *Item Total: ₹${i.total}*`;
      return itemStr;
    }).join('\n\n');

    let totalsText = ``;
    totalsText += `      *Total Taxable Value:* ₹${totalTaxable}\n`;

    // Assuming we calculate total IGST/CGST/SGST by checking place_of_supply or looking at gstPct
    // For simplicity we just show gstAmount sum since this is a quick whatsapp summary
    const totalGst = invoice.items?.reduce((sum, item) => sum + (parseFloat(item.gstAmount) || 0), 0).toFixed(2);
    totalsText += `      *Total GST:* ₹${totalGst}\n`;

    const message = `✨ *INVOICE DETAILS* ✨\n\n`
      + `Namo Gange Namaskar! 🙏\n\n`
      + `Dear *${(invoice.consignee_name && invoice.consignee_name.toLowerCase().includes('9th edition')) ? (invoice.company_name || invoice.consignee_name) : invoice.consignee_name || 'Client'}*,\n\n`
      + `Thank you for choosing *International Health & Wellness Expo*. We are pleased to share the details of your Invoice.\n\n`
      + `📄 *Invoice No:* ${invoice.invoice_no}\n`
      + `📅 *Date:* ${dateStr}\n`
      + `🏢 *Company:* ${(invoice.consignee_name && invoice.consignee_name.toLowerCase().includes('9th edition')) ? (invoice.company_name || invoice.consignee_name) : invoice.consignee_name}\n`
      + `📍 *Location:* ${invoice.city || 'N/A'}, ${invoice.state || 'N/A'}\n`
      + `📝 *GSTIN:* ${invoice.gst_no || 'N/A'}\n\n`
      + `📋 *ITEM DETAILS:*\n`
      + `-------------------------------\n`
      + `${itemsText}\n`
      + `-------------------------------\n\n`
      + `📊 *INVOICE SUMMARY:*\n`
      + `${totalsText}\n`
      + `💰 *GRAND TOTAL:* *₹${invoice.finalAmount}*\n\n`
      + `If you have any queries or require further clarification, please feel free to reach out to us. We look forward to a successful collaboration! 🤝\n\n`
      + `🌐 *Website:* https://www.ihwe.in\n`
      + `📧 *Email:* info@ihwe.in\n`
      + `📞 *Contact:* +91 9654900525\n\n`
      + `Warm Regards,\n`
      + `*Namo Gange Wellness Pvt. Ltd.* 🌿`;

    const templateParams = [
      (invoice.consignee_name && invoice.consignee_name.toLowerCase().includes('9th edition') ? invoice.company_name : invoice.consignee_name) || 'Client',
      invoice.invoice_no || 'N/A',
      dateStr,
      (invoice.consignee_name && invoice.consignee_name.toLowerCase().includes('9th edition') ? invoice.company_name : invoice.consignee_name) || 'Company',
      `${invoice.city || 'N/A'}, ${invoice.state || 'N/A'}`,
      itemsText,
      totalsText,
      String(invoice.finalAmount || 0)
    ];

    res.status(200).json({ phone, message, templateParams });
  } catch (error) {
    res.status(500).json({ message: "Error previewing WhatsApp", error: error.message });
  }
};

// Send Invoice via WhatsApp
const sendWhatsAppInvoice = async (req, res) => {
  try {
    const { customPhone, customMessage, customTemplateParams } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    
    let phone = customPhone;
    let message = customMessage;
    let templateParams = customTemplateParams;

    if (!phone || !message) {
        if (!phone) {
          let company = await Company.findById(invoice.companyId);
          if (!company) {
            company = await ExhibitorRegistration.findById(invoice.companyId);
          }
          phone = company?.contact1?.mobile || company?.contacts?.[0]?.mobile || company?.mobile || company?.contact2?.mobile || company?.contact1?.phone || company?.contact2?.phone;
        }
        if (!phone) return res.status(400).json({ message: "Phone number is required and not found in company data" });

        const dateStr = invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');

        const totalTaxable = invoice.items?.reduce((sum, item) => sum + (parseFloat(item.taxableValue) || parseFloat(item.amount) || 0), 0).toFixed(2);

        let itemsText = invoice.items.map((i, index) => {
          let itemStr = `🔹 *${index + 1}. ${i.description}*\n` +
            `      Qty: ${i.qty} ${i.unit} | Rate: ₹${i.rate}\n` +
            `      Amount: ₹${i.amount}\n`;

          if (i.discountPct > 0) itemStr += `      Discount: ${i.discountPct}%\n`;
          if (i.taxableValue > 0) itemStr += `      Taxable Value: ₹${i.taxableValue}\n`;

          if (i.gstPct && i.gstPct.includes('IGST')) {
            itemStr += `      IGST: ₹${i.gstAmount} (${i.gstPct})\n`;
          } else if (i.gstPct) {
            const halfTax = (parseFloat(i.gstAmount) / 2).toFixed(2);
            itemStr += `      CGST: ₹${halfTax} | SGST: ₹${halfTax}\n`;
          } else if (i.gstAmount > 0) {
            itemStr += `      Tax: ₹${i.gstAmount}\n`;
          }

          itemStr += `      *Item Total: ₹${i.total}*`;
          return itemStr;
        }).join('\n\n');

        let totalsText = ``;
        totalsText += `      *Total Taxable Value:* ₹${totalTaxable}\n`;

        // Assuming we calculate total IGST/CGST/SGST by checking place_of_supply or looking at gstPct
        // For simplicity we just show gstAmount sum since this is a quick whatsapp summary
        const totalGst = invoice.items?.reduce((sum, item) => sum + (parseFloat(item.gstAmount) || 0), 0).toFixed(2);
        totalsText += `      *Total GST:* ₹${totalGst}\n`;

        message = `✨ *INVOICE DETAILS* ✨\n\n`
          + `Namo Gange Namaskar! 🙏\n\n`
          + `Dear *${(invoice.consignee_name && invoice.consignee_name.toLowerCase().includes('9th edition')) ? (invoice.company_name || invoice.consignee_name) : invoice.consignee_name || 'Client'}*,\n\n`
          + `Thank you for choosing *International Health & Wellness Expo*. We are pleased to share the details of your Invoice.\n\n`
          + `📄 *Invoice No:* ${invoice.invoice_no}\n`
          + `📅 *Date:* ${dateStr}\n`
          + `🏢 *Company:* ${(invoice.consignee_name && invoice.consignee_name.toLowerCase().includes('9th edition')) ? (invoice.company_name || invoice.consignee_name) : invoice.consignee_name}\n`
          + `📍 *Location:* ${invoice.city || 'N/A'}, ${invoice.state || 'N/A'}\n`
          + `📝 *GSTIN:* ${invoice.gst_no || 'N/A'}\n\n`
          + `📋 *ITEM DETAILS:*\n`
          + `-------------------------------\n`
          + `${itemsText}\n`
          + `-------------------------------\n\n`
          + `📊 *INVOICE SUMMARY:*\n`
          + `${totalsText}\n`
          + `💰 *GRAND TOTAL:* *₹${invoice.finalAmount}*\n\n`
          + `If you have any queries or require further clarification, please feel free to reach out to us. We look forward to a successful collaboration! 🤝\n\n`
          + `🌐 *Website:* https://www.ihwe.in\n`
          + `📧 *Email:* info@ihwe.in\n`
          + `📞 *Contact:* +91 9654900525\n\n`
          + `Warm Regards,\n`
          + `*Namo Gange Wellness Pvt. Ltd.* 🌿`;

        templateParams = [
          (invoice.consignee_name && invoice.consignee_name.toLowerCase().includes('9th edition') ? invoice.company_name : invoice.consignee_name) || 'Client',
          invoice.invoice_no || 'N/A',
          dateStr,
          (invoice.consignee_name && invoice.consignee_name.toLowerCase().includes('9th edition') ? invoice.company_name : invoice.consignee_name) || 'Company',
          `${invoice.city || 'N/A'}, ${invoice.state || 'N/A'}`,
          itemsText,
          totalsText,
          String(invoice.finalAmount || 0)
        ];
    }

    let result;
    if (customMessage) {
        const { sendWhatsAppMessage } = require('../utils/whatsapp');
        result = await sendWhatsAppMessage(phone, message, invoice.consignee_name);
    } else {
        result = await sendTaxInvoiceWhatsApp(phone, message, invoice.consignee_name, templateParams);
    }

    if (result.success) {
      res.status(200).json({ message: "WhatsApp message sent successfully" });
    } else {
      res.status(500).json({ message: "Failed to send WhatsApp message", error: result.error });
    }
  } catch (error) {
    res.status(500).json({ message: "Error sending WhatsApp", error: error.message });
  }
};

// Preview Invoice via Email
const previewEmailInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    let email = req.body?.email;
    if (!email) {
      let company = await Company.findById(invoice.companyId);
      if (!company) {
        company = await ExhibitorRegistration.findById(invoice.companyId);
      }
      email = company?.contact1?.email || company?.contacts?.[0]?.email || company?.companyEmail || company?.email;
    }
    if (!email) return res.status(400).json({ message: "Email is required and not found in company data" });

    const dateStr = invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');

    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    let itemsHtml = invoice.items.map((i, index) => {
      const qty = parseFloat(i.qty) || 1;
      const rate = parseFloat(i.rate) || 0;
      const taxable = parseFloat(i.taxableValue) || 0;

      totalTaxable += taxable;

      const gstAmt = parseFloat(i.gstAmount) || 0;
      if (i.gstPct && i.gstPct.includes('IGST')) {
        totalIgst += gstAmt;
      } else {
        totalCgst += (gstAmt / 2);
        totalSgst += (gstAmt / 2);
      }

      return `
            <tr>
                <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: center; color: #475569; font-size: 13px;">${index + 1}</td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #eee;">
                    <div style="font-weight: bold; color: #1e293b; font-size: 14px;">${i.description}</div>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">HSN/SAC: ${i.hsn || 'N/A'}</div>
                </td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: center; color: #475569; font-size: 13px;">${qty} ${i.unit || 'Nos'}</td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: right; color: #475569; font-size: 13px;">₹${rate.toFixed(2)}</td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: right; color: #475569; font-size: 13px;">₹${taxable.toFixed(2)}</td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #1e293b; font-size: 13px;">₹${parseFloat(i.total || 0).toFixed(2)}</td>
            </tr>
            `;
    }).join('');

    let totalsHtml = `
            <tr>
                <td colspan="5" style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #eee; color: #555;"><strong>Total Taxable Value:</strong></td>
                <td style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #eee; color: #555;">₹${totalTaxable.toFixed(2)}</td>
            </tr>
        `;

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
                                        <h1 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 1px;">TAX INVOICE</h1>
                                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">International Health & Wellness Expo</p>
                                    </td>
                                    <td align="right" style="color: #1e293b;">
                                        <h2 style="margin: 0; font-size: 16px;">${invoice.invoice_no}</h2>
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
                                        <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: bold; color: #1e3c72; text-transform: capitalize;">${(invoice.consignee_name && invoice.consignee_name.toLowerCase().includes('9th edition')) ? (invoice.company_name || invoice.consignee_name) : invoice.consignee_name}</p>
                                        <p style="margin: 0 0 4px 0; font-size: 13px; color: #475569; line-height: 1.4; text-transform: capitalize;">${invoice.consignee_addr}<br>${invoice.city || ''}, ${invoice.state || ''} - ${invoice.billing_pincode || ''}</p>
                                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #475569; background-color: #f1f5f9; display: inline-block; padding: 3px 8px; border-radius: 4px;"><strong>GSTIN:</strong> ${invoice.gst_no || 'N/A'}</p>
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
                                        <td style="padding: 15px; text-align: right; background-color: #f8fafc; color: #1e3c72; font-size: 18px; font-weight: bold;">₹${invoice.finalAmount}</td>
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

// Send Invoice via Email
const sendEmailInvoice = async (req, res) => {
  try {
    const { customEmail, customHtmlContent } = req.body;
    let email = customEmail;
    let htmlContent = customHtmlContent;
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    if (!email || !htmlContent) {
        if (!email) {
          let company = await Company.findById(invoice.companyId);
          if (!company) {
            company = await ExhibitorRegistration.findById(invoice.companyId);
          }
          email = company?.contact1?.email || company?.contacts?.[0]?.email || company?.companyEmail || company?.email;
        }
        if (!email) return res.status(400).json({ message: "Email is required and not found in company data" });

        const dateStr = invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');

        let totalTaxable = 0;
        let totalCgst = 0;
        let totalSgst = 0;
        let totalIgst = 0;

        let itemsHtml = invoice.items.map((i, index) => {
          const qty = parseFloat(i.qty) || 1;
          const rate = parseFloat(i.rate) || 0;
          const taxable = parseFloat(i.taxableValue) || 0;

          totalTaxable += taxable;

          const gstAmt = parseFloat(i.gstAmount) || 0;
          if (i.gstPct && i.gstPct.includes('IGST')) {
            totalIgst += gstAmt;
          } else {
            totalCgst += (gstAmt / 2);
            totalSgst += (gstAmt / 2);
          }

          return `
                <tr>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: center; color: #475569; font-size: 13px;">${index + 1}</td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #eee;">
                        <div style="font-weight: bold; color: #1e293b; font-size: 14px;">${i.description}</div>
                        <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">HSN/SAC: ${i.hsn || 'N/A'}</div>
                    </td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: center; color: #475569; font-size: 13px;">${qty} ${i.unit || 'Nos'}</td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: right; color: #475569; font-size: 13px;">₹${rate.toFixed(2)}</td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: right; color: #475569; font-size: 13px;">₹${taxable.toFixed(2)}</td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #1e293b; font-size: 13px;">₹${parseFloat(i.total || 0).toFixed(2)}</td>
                </tr>
                `;
        }).join('');

        let totalsHtml = `
                <tr>
                    <td colspan="5" style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #eee; color: #555;"><strong>Total Taxable Value:</strong></td>
                    <td style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #eee; color: #555;">₹${totalTaxable.toFixed(2)}</td>
                </tr>
            `;

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
                                            <h1 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 1px;">TAX INVOICE</h1>
                                            <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">International Health & Wellness Expo</p>
                                        </td>
                                        <td align="right" style="color: #1e293b;">
                                            <h2 style="margin: 0; font-size: 16px;">${invoice.invoice_no}</h2>
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
                                            <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: bold; color: #1e3c72; text-transform: capitalize;">${(invoice.consignee_name && invoice.consignee_name.toLowerCase().includes('9th edition')) ? (invoice.company_name || invoice.consignee_name) : invoice.consignee_name}</p>
                                            <p style="margin: 0 0 4px 0; font-size: 13px; color: #475569; line-height: 1.4; text-transform: capitalize;">${invoice.consignee_addr}<br>${invoice.city || ''}, ${invoice.state || ''} - ${invoice.billing_pincode || ''}</p>
                                            <p style="margin: 5px 0 0 0; font-size: 12px; color: #475569; background-color: #f1f5f9; display: inline-block; padding: 3px 8px; border-radius: 4px;"><strong>GSTIN:</strong> ${invoice.gst_no || 'N/A'}</p>
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
                                            <td style="padding: 15px; text-align: right; background-color: #f8fafc; color: #1e3c72; font-size: 18px; font-weight: bold;">₹${invoice.finalAmount}</td>
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

    const subject = `Invoice Details - ${invoice.invoice_no}`;

    await emailService.sendEmail({
      to: email,
      subject: subject,
      html: htmlContent,
      profile: 'DEFAULT'
    });

    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error sending Email", error: error.message });
  }
};

// ✅ EXPORT
module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  previewInvoiceRevision,
  reviseInvoiceFromEstimate,
  updateInvoice,
  deleteInvoice,
  sendWhatsAppInvoice,
  previewWhatsAppInvoice,
  sendEmailInvoice,
  previewEmailInvoice,
};
