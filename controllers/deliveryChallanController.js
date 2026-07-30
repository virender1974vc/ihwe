const DeliveryChallan = require("../models/DeliveryChallan");
const Estimate = require("../models/Estimate");
const Company = require("../models/Company");
const ExhibitorRegistration = require("../models/ExhibitorRegistration");
const { logActivity } = require("../utils/logger");
const { sendWhatsAppMessage } = require("../utils/whatsapp");
const emailService = require("../utils/emailService");

const normalize = (value) => String(value ?? "").trim().toLowerCase();
const itemKey = (item = {}) => item._id
  ? `item:${String(item._id)}`
  : [
    normalize(item.description),
    normalize(item.hsn),
    normalize(item.unit),
    normalize(item.size),
    normalize(item.area),
  ].join("|");
const isCancelled = (doc) => normalize(doc?.status) === "cancelled";
const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  const text = String(value).replace(/,/g, "").replace(/%/g, "").trim();
  const number = Number(text);
  if (Number.isFinite(number)) return number;
  const match = text.match(/-?\d+(?:\.\d+)?/);
  const parsed = match ? Number(match[0]) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
};

const getAreaMultiplier = (item = {}) => {
  const candidates = [item.size, item.area, item.areaSqm, item.area_sqm, item.sqm];
  for (const value of candidates) {
    const match = String(value ?? "").match(/[\d.]+/);
    const number = match ? Number(match[0]) : 0;
    if (Number.isFinite(number) && number > 0) return number;
  }
  return 1;
};

const getGstRate = (item = {}) => {
  const directRate = toNumber(item.gstRate ?? item.gst_per ?? item.gstPct);
  if (directRate) return directRate;
  const igstRate = toNumber(item.igst_per);
  if (igstRate) return igstRate;
  const cgstRate = toNumber(item.cgst_per);
  return cgstRate ? cgstRate * 2 : 18;
};

const getFinancials = (item = {}) => {
  const qty = toNumber(item.qty);
  const rate = toNumber(item.rate);
  const computedAmount = rate * getAreaMultiplier(item) * (qty || 1);
  const explicitAmount = toNumber(item.amount ?? item.itemValue ?? item.item_value ?? item.totalBeforeTax ?? item.total_before_tax);
  const amount = (explicitAmount && computedAmount && explicitAmount < computedAmount * 0.5)
    ? computedAmount
    : (explicitAmount || computedAmount);
  const discountPercent = toNumber(item.disc ?? item.discountPct);
  const discountAmount = toNumber(item.discountAmount ?? item.discount_amount) || (amount * discountPercent) / 100;
  const explicitTaxable = toNumber(item.taxable ?? item.taxableValue ?? item.taxable_value);
  const taxable = (discountPercent || discountAmount)
    ? Math.max(0, amount - discountAmount)
    : (explicitTaxable || amount);
  const gstRate = getGstRate(item);
  const gstAmount = toNumber(item.gstAmount ?? item.gst_amount ?? item.totalTax ?? item.total_tax) || (toNumber(item.igst) + toNumber(item.cgst) + toNumber(item.sgst)) || (gstRate ? (taxable * gstRate) / 100 : 0);
  const finalAmount = toNumber(item.finalAmount ?? item.total) || taxable + gstAmount;
  return { amount, discountPercent, discountAmount, taxable, gstRate, gstAmount, finalAmount };
};

const findCompany = async (id) => {
  let company = await Company.findById(id).lean();
  if (!company) company = await ExhibitorRegistration.findById(id).lean();
  return company;
};

const resolveRecipient = async (challan) => {
  const company = await findCompany(challan.companyId);
  const contact = company?.contact1 || company?.contacts?.find((item) => item.isPrimary) || company?.contacts?.[0] || {};
  return {
    phone: challan.contact_phone || contact.mobile || contact.phone || company?.mobile || company?.landline || "",
    email: challan.contact_email || challan.company_email || contact.email || company?.companyEmail || company?.email || "",
  };
};

const buildWhatsAppMessage = (challan) => {
  const items = (challan.items || []).map((item, index) =>
    `${index + 1}. ${item.description}\n   Qty: ${item.qty} ${item.unit || ""}${item.hsn ? ` | HSN: ${item.hsn}` : ""}`
  ).join("\n\n");
  return `*DELIVERY CHALLAN*\n\nDear ${challan.contact_person || challan.company_name || "Client"},\n\nPlease find your delivery challan details below.\n\n*Challan No:* ${challan.challan_no}\n*Date:* ${challan.challan_date}\n*Proforma No:* ${challan.estimate_no}\n*Purpose:* ${challan.purpose}\n\n*ITEMS*\n${items}\n\nThis document is not for payment.\n\nWarm Regards,\n*Namo Gange Wellness Pvt. Ltd.*`;
};

const buildEmailHtml = (challan) => {
  const rows = (challan.items || []).map((item, index) => `<tr>
    <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:center">${index + 1}</td>
    <td style="padding:10px;border-bottom:1px solid #e2e8f0"><strong>${item.description}</strong><br><small>HSN/SAC: ${item.hsn || "-"}</small></td>
    <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:center">${item.qty}</td>
    <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:center">${item.unit || "-"}</td>
  </tr>`).join("");
  return `<div style="margin:0;background:#f5f7fa;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;color:#334155">
    <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;background:#ffffff;border:1px solid #dbe3ec;border-radius:12px;overflow:hidden;box-shadow:0 5px 18px rgba(15,23,42,.06)">
      <tr>
        <td style="height:5px;background:#194090;font-size:0;line-height:0">&nbsp;</td>
      </tr>
      <tr>
        <td style="padding:24px 32px 20px;border-bottom:1px solid #e8edf3">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td valign="middle">
                <p style="margin:0;color:#194090;font-size:20px;font-weight:800;letter-spacing:.3px">Namo Gange Wellness Pvt. Ltd.</p>
                <p style="margin:5px 0 0;color:#64748b;font-size:12px">International Health &amp; Wellness Expo</p>
              </td>
              <td align="right" valign="middle">
                <span style="display:inline-block;padding:7px 12px;border-radius:20px;background:#ecfdf5;border:1px solid #a7f3d0;color:#047857;font-size:11px;font-weight:800;letter-spacing:.7px">DELIVERY CHALLAN</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px 10px">
          <p style="margin:0 0 5px;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px">Delivered To</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="62%" valign="top">
                <p style="margin:0 0 5px;color:#172554;font-size:17px;font-weight:800">${challan.company_name || "Client"}</p>
                <p style="margin:0;color:#475569;font-size:13px;line-height:1.55">${challan.company_address || "-"}</p>
                ${challan.company_gst_no ? `<p style="margin:8px 0 0;color:#475569;font-size:12px"><strong>GSTIN:</strong> ${challan.company_gst_no}</p>` : ""}
              </td>
              <td width="38%" align="right" valign="top">
                <p style="margin:0;color:#172554;font-size:15px;font-weight:800">${challan.challan_no}</p>
                <p style="margin:6px 0 0;color:#64748b;font-size:12px">Date: ${challan.challan_date}</p>
                <p style="margin:5px 0 0;color:#64748b;font-size:12px">PI: ${challan.estimate_no}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 32px">
          <div style="padding:12px 14px;border-radius:7px;background:#f8fafc;border:1px solid #e2e8f0;color:#475569;font-size:12px;line-height:1.5">
            <strong style="color:#334155">Delivery Address:</strong> ${challan.delivery_address || "-"}
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:6px 32px 24px">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0;border:1px solid #dbe3ec;border-radius:7px;overflow:hidden">
            <thead><tr style="background:#f1f5f9;color:#475569">
              <th width="8%" style="padding:11px;text-align:center;font-size:11px">#</th>
              <th style="padding:11px;text-align:left;font-size:11px">DESCRIPTION</th>
              <th width="14%" style="padding:11px;text-align:center;font-size:11px">QTY</th>
              <th width="15%" style="padding:11px;text-align:center;font-size:11px">UNIT</th>
            </tr></thead><tbody>${rows}</tbody>
          </table>
          <div style="margin-top:18px;padding:10px;border-radius:6px;background:#fff7ed;border:1px solid #fed7aa;color:#c2410c;font-size:11px;font-weight:800;text-align:center;letter-spacing:.5px">DELIVERY CHALLAN &mdash; NOT FOR PAYMENT</div>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 32px;background:#f8fafc;border-top:1px solid #e8edf3;text-align:center">
          <p style="margin:0;color:#64748b;font-size:11px;line-height:1.6">For any clarification, please contact the IHWE team.</p>
          <p style="margin:5px 0 0;color:#194090;font-size:11px;font-weight:700">www.ihwe.in &nbsp;&bull;&nbsp; info@ihwe.in &nbsp;&bull;&nbsp; +91 9654900525</p>
        </td>
      </tr>
    </table>
  </div>`;
};

const getSourceSummary = async (estimate, excludeId) => {
  const query = { source_estimate_id: String(estimate._id) };
  if (excludeId) query._id = { $ne: excludeId };
  const challans = await DeliveryChallan.find(query).lean();
  const used = new Map();
  challans.filter((challan) => !isCancelled(challan)).forEach((challan) => {
    challan.items.forEach((item) => {
      used.set(item.sourceItemKey, (used.get(item.sourceItemKey) || 0) + Number(item.qty || 0));
    });
  });
  return (estimate.items || []).map((item) => {
    const key = itemKey(item);
    const sourceQty = Number(item.qty || 0);
    const deliveredQty = used.get(key) || 0;
    const financials = getFinancials(item);
    return {
      sourceItemKey: key,
      description: item.description,
      hsn: item.hsn || "",
      unit: item.unit || "",
      size: item.size || "",
      area: item.area || "",
      remarks: item.remarks || "",
      rate: toNumber(item.rate),
      discount: financials.discountAmount,
      discountPct: financials.discountPercent,
      amount: financials.amount,
      taxable: financials.taxable,
      gstRate: financials.gstRate,
      gstAmount: financials.gstAmount,
      finalAmount: financials.finalAmount,
      sourceQty,
      deliveredQty,
      remainingQty: Math.max(0, sourceQty - deliveredQty),
    };
  });
};

const enrichChallan = async (challan) => {
  if (!challan?.source_estimate_id) return challan;
  const estimate = await Estimate.findById(challan.source_estimate_id).lean();
  if (!estimate) return challan;
  const sourceItems = await getSourceSummary(estimate, challan._id);
  const sourceByKey = new Map(sourceItems.map((item) => [item.sourceItemKey, item]));
  return {
    ...challan,
    event_name: challan.event_name || estimate.event_name || "",
    delivery_address: challan.delivery_address || estimate.event_place_of_supply || estimate.consignee_addr || "",
    remarks: challan.remarks || estimate.remarks || "",
    terms: challan.terms || estimate.terms || "",
    items: (challan.items || []).map((item) => {
      const source = sourceByKey.get(item.sourceItemKey);
      if (!source) return item;
      return {
        ...source,
        ...item,
        description: item.description || source.description,
        hsn: item.hsn || source.hsn,
        unit: item.unit || source.unit,
        size: item.size || source.size,
        area: item.area || source.area,
        remarks: item.remarks || source.remarks,
        rate: toNumber(item.rate) || source.rate,
        discount: toNumber(item.discount) || source.discount,
        discountPct: toNumber(item.discountPct ?? item.disc) || source.discountPct,
        amount: toNumber(item.amount) || source.amount,
        taxable: toNumber(item.taxable) || source.taxable,
        gstRate: toNumber(item.gstRate) || source.gstRate,
        gstAmount: toNumber(item.gstAmount) || source.gstAmount,
        finalAmount: toNumber(item.finalAmount) || source.finalAmount,
        sourceQty: toNumber(item.sourceQty) || source.sourceQty,
      };
    }),
  };
};

const validatePayload = async (payload, excludeId) => {
  const estimate = await Estimate.findById(payload.source_estimate_id).lean();
  if (!estimate) return { error: "Selected proforma invoice was not found." };
  if (isCancelled(estimate)) return { error: "A cancelled proforma invoice cannot be used." };
  if (String(estimate.companyId) !== String(payload.companyId)) {
    return { error: "Selected proforma invoice does not belong to this client." };
  }
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return { error: "At least one challan item is required." };
  }

  const summary = await getSourceSummary(estimate, excludeId);
  const remaining = new Map(summary.map((item) => [item.sourceItemKey, item.remainingQty]));
  const requested = new Map();
  for (const item of payload.items) {
    const qty = Number(item.qty);
    if (!item.sourceItemKey || !remaining.has(item.sourceItemKey)) {
      return { error: `Item "${item.description || "Unknown"}" is not part of the selected proforma invoice.` };
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      return { error: `Quantity must be greater than zero for ${item.description || "item"}.` };
    }
    requested.set(item.sourceItemKey, (requested.get(item.sourceItemKey) || 0) + qty);
    if (requested.get(item.sourceItemKey) > remaining.get(item.sourceItemKey) + 0.000001) {
      return { error: `Only ${remaining.get(item.sourceItemKey)} quantity remains for ${item.description}.` };
    }
  }
  return { estimate };
};

exports.getChallans = async (req, res) => {
  try {
    const query = {};
    if (req.query.eventId) query.eventId = req.query.eventId;
    if (req.query.companyId) {
      query.$or = [{ companyId: req.query.companyId }, { account_ref_id: req.query.companyId }];
    }
    if (req.query.estimateId) query.source_estimate_id = req.query.estimateId;
    const challans = await DeliveryChallan.find(query).sort({ added: -1 }).lean();
    const data = await Promise.all(challans.map(enrichChallan));
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching delivery challans", error: error.message });
  }
};

exports.getChallan = async (req, res) => {
  try {
    const challan = await DeliveryChallan.findById(req.params.id).lean();
    if (!challan) return res.status(404).json({ message: "Delivery challan not found" });
    const enriched = await enrichChallan(challan);
    enriched.company = await findCompany(enriched.companyId);
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: "Error fetching delivery challan", error: error.message });
  }
};

exports.getProformaOptions = async (req, res) => {
  try {
    const directCompany = await Company.findById(req.params.companyId).lean();
    const directExhibitor = await ExhibitorRegistration.findById(req.params.companyId).lean();
    let linkedCompany = directCompany;
    let linkedExhibitor = directExhibitor;
    if (directCompany && !linkedExhibitor && directCompany.exhibitorRegistrationId) {
      linkedExhibitor = await ExhibitorRegistration.findById(directCompany.exhibitorRegistrationId).lean();
    }
    if (directExhibitor && !linkedCompany && directExhibitor.clientId) {
      linkedCompany = await Company.findById(directExhibitor.clientId).lean();
    }
    const lookupIds = [...new Set([
      req.params.companyId,
      linkedCompany?._id?.toString(),
      linkedExhibitor?._id?.toString(),
    ].filter(Boolean))];
    const estimates = await Estimate.find({ companyId: { $in: lookupIds } }).sort({ added: -1 }).lean();
    const active = estimates.filter((estimate) => !isCancelled(estimate));
    const data = await Promise.all(active.map(async (estimate) => {
      const client = await findCompany(estimate.companyId);
      const primaryContact = client?.contacts?.find((contact) => contact.isPrimary)
        || client?.contacts?.[0]
        || client?.contact1
        || {};
      const clientEmail = primaryContact.email || client?.companyEmail || client?.email || "";
      const contactName = [
        primaryContact.title,
        primaryContact.firstName,
        primaryContact.surname,
      ].filter(Boolean).join(" ");
      const clientAddress = [
        client?.address,
        client?.city,
        client?.state,
        client?.pincode,
      ].filter(Boolean).join(", ");
      return {
        _id: estimate._id,
        companyId: estimate.companyId,
        est_no: estimate.est_no,
        supply_date: estimate.supply_date,
        company_name: estimate.company_name || client?.companyName || client?.exhibitorName || "",
        company_addr: estimate.company_addr || clientAddress,
        company_gst_no: estimate.company_gst_no || estimate.gst_no || client?.gstNo || client?.gstNumber || "",
        contact_person: estimate.consignee_person || contactName || client?.contactPerson || "",
        contact_phone: estimate.consignee_phone || primaryContact.mobile || primaryContact.phone || client?.mobile || client?.landline || "",
        company_email: estimate.company_email || client?.companyEmail || clientEmail,
        companyEmail: estimate.company_email || client?.companyEmail || clientEmail,
        contact_email: estimate.contact_email || primaryContact.email || clientEmail,
        contactEmail: estimate.contact_email || primaryContact.email || clientEmail,
        event_name: estimate.event_name,
        delivery_address: estimate.event_place_of_supply || estimate.consignee_addr,
        remarks: estimate.remarks || "",
        terms: estimate.terms || "",
        country: estimate.country,
        state: estimate.state,
        city: estimate.city,
        pincode: estimate.pincode,
        items: await getSourceSummary(estimate),
      };
    }));
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error loading proforma invoices", error: error.message });
  }
};

exports.createChallan = async (req, res) => {
  try {
    const result = await validatePayload(req.body);
    if (result.error) return res.status(400).json({ message: result.error });
    const challan = await DeliveryChallan.create({
      ...req.body,
      eventId: result.estimate.eventId || req.body.eventId || null,
      crmEventId: result.estimate.crmEventId || req.body.crmEventId || null,
      estimate_no: result.estimate.est_no,
      challan_no: await DeliveryChallan.generateNextNumber(),
    });
    await logActivity(req, "Created", "Accounts", `Created Delivery Challan ${challan.challan_no} for ${challan.company_name || challan.companyId}.`);
    res.status(201).json({ message: "Delivery challan created", data: challan });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Conflict: Delivery Challan number already exists", error: error.message });
    }
    res.status(500).json({ message: "Error creating delivery challan", error: error.message });
  }
};

exports.updateChallan = async (req, res) => {
  try {
    const existing = await DeliveryChallan.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Delivery challan not found" });
    const payload = { ...existing.toObject(), ...req.body };
    const result = await validatePayload(payload, req.params.id);
    if (result.error) return res.status(400).json({ message: result.error });
    delete req.body.challan_no;
    const updated = await DeliveryChallan.findByIdAndUpdate(req.params.id, req.body, { returnDocument: "after", runValidators: true });
    await logActivity(req, "Updated", "Accounts", `Updated Delivery Challan ${updated.challan_no} for ${updated.company_name || updated.companyId}.`);
    res.json({ message: "Delivery challan updated", data: updated });
  } catch (error) {
    res.status(500).json({ message: "Error updating delivery challan", error: error.message });
  }
};

exports.deleteChallan = async (req, res) => {
  try {
    const deleted = await DeliveryChallan.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Delivery challan not found" });
    res.json({ message: "Delivery challan deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting delivery challan", error: error.message });
  }
};

exports.previewWhatsApp = async (req, res) => {
  try {
    const challan = await DeliveryChallan.findById(req.params.id);
    if (!challan) return res.status(404).json({ message: "Delivery challan not found" });
    const recipient = await resolveRecipient(challan);
    res.json({ phone: recipient.phone, message: buildWhatsAppMessage(challan), templateParams: [] });
  } catch (error) {
    res.status(500).json({ message: "Error preparing WhatsApp", error: error.message });
  }
};

exports.sendWhatsApp = async (req, res) => {
  try {
    const challan = await DeliveryChallan.findById(req.params.id);
    if (!challan) return res.status(404).json({ message: "Delivery challan not found" });
    if (isCancelled(challan)) return res.status(400).json({ message: "Cancelled challan cannot be sent." });
    const recipient = await resolveRecipient(challan);
    const phone = req.body.customPhone || recipient.phone;
    if (!phone) return res.status(400).json({ message: "Phone number is required." });
    const result = await sendWhatsAppMessage(phone, req.body.customMessage || buildWhatsAppMessage(challan), challan.company_name, { companyId: challan.companyId, eventId: challan.crmEventId });
    if (!result?.success) return res.status(500).json({ message: "Failed to send WhatsApp", error: result?.error });
    challan.whatsappSent = true;
    challan.whatsappSentAt = new Date();
    await challan.save();
    res.json({ message: "Delivery challan sent on WhatsApp" });
  } catch (error) {
    res.status(500).json({ message: "Error sending WhatsApp", error: error.message });
  }
};

exports.previewEmail = async (req, res) => {
  try {
    const challan = await DeliveryChallan.findById(req.params.id);
    if (!challan) return res.status(404).json({ message: "Delivery challan not found" });
    const recipient = await resolveRecipient(challan);
    res.json({ email: recipient.email, htmlContent: buildEmailHtml(challan) });
  } catch (error) {
    res.status(500).json({ message: "Error preparing email", error: error.message });
  }
};

exports.sendEmail = async (req, res) => {
  try {
    const challan = await DeliveryChallan.findById(req.params.id);
    if (!challan) return res.status(404).json({ message: "Delivery challan not found" });
    if (isCancelled(challan)) return res.status(400).json({ message: "Cancelled challan cannot be sent." });
    const recipient = await resolveRecipient(challan);
    const email = req.body.customEmail || recipient.email;
    if (!email) return res.status(400).json({ message: "Email address is required." });
    await emailService.sendEmail({
      to: email,
      subject: `Delivery Challan ${challan.challan_no} | IHWE`,
      html: req.body.customHtmlContent || buildEmailHtml(challan),
      logData: { companyId: challan.companyId, eventId: challan.crmEventId },
    });
    challan.emailSent = true;
    challan.emailSentAt = new Date();
    await challan.save();
    res.json({ message: "Delivery challan sent by email" });
  } catch (error) {
    res.status(500).json({ message: "Error sending email", error: error.message });
  }
};
