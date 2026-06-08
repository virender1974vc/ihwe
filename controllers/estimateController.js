const Estimate = require("../models/Estimate");
const Company = require("../models/Company");
const ExhibitorRegistration = require("../models/ExhibitorRegistration");
const ChatMessage = require('../models/ChatMessage');
const CrmExhibatorReview2023 = require('../models/CrmExhibatorReview2023');
const { sendWhatsAppMessage } = require('../utils/whatsapp');
const emailService = require('../utils/emailService');

// Add estimate
const addEstimate = async (req, res) => {
  try {
    const newEstimateNo = await Estimate.generateNextEstimateNo();

    const estimateBody = {
      ...req.body,
      est_no: newEstimateNo,
    };

    const estimate = new Estimate(estimateBody);
    await estimate.save();

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
            { $project: { _id: 1, pi_no: 1, added: 1 } },
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
            { $project: { _id: 1, invoice_no: 1, added: 1 } },
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
            { $project: { _id: 1, pi_no: 1, updated: 1, finalAmount: 1 } },
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
            { $project: { _id: 1, invoice_no: 1, added: 1 } },
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
    const estimate = await Estimate.findById(req.params.id);

    if (!estimate)
      return res.status(404).json({ message: "Estimate not found" });

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

// Delete
const deleteEstimate = async (req, res) => {
  try {
    const deleted = await Estimate.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ message: "Estimate not found" });

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
    const nextNo = await Estimate.generateNextEstimateNo();
    res.status(200).json({ est_no: nextNo });
  } catch (error) {
    res.status(500).json({
      message: "Error generating estimate number",
      error: error.message,
    });
  }
};

// Send Estimate via WhatsApp
const sendWhatsAppEstimate = async (req, res) => {
  try {
    const estimate = await Estimate.findById(req.params.id);
    if (!estimate) return res.status(404).json({ message: "Estimate not found" });

    let phone = req.body.phone;
    if (!phone) {
      let company = await Company.findById(estimate.companyId);
      if (!company) {
        company = await ExhibitorRegistration.findById(estimate.companyId);
      }
      phone = company?.contact1?.mobile || company?.mobile || company?.contact2?.mobile;
    }
    if (!phone) return res.status(400).json({ message: "Phone number is required and not found in company data" });

    const dateStr = estimate.supply_date ? new Date(estimate.supply_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');

    const totalTaxable = estimate.items?.reduce((sum, item) => sum + (parseFloat(item.taxable) || parseFloat(item.amount) || 0), 0).toFixed(2);

    let itemsText = estimate.items.map((i, index) => {
      let itemStr = `🔹 *${index + 1}. ${i.description}*n` +
        `      Qty: ${i.qty} ${i.unit} | Rate: ₹${i.rate}n` +
        `      Amount: ₹${i.amount}n`;

      if (i.discount > 0) itemStr += `      Discount: ₹${i.discount}n`;
      if (i.taxable > 0) itemStr += `      Taxable Value: ₹${i.taxable}n`;

      if (i.gstRate && i.gstRate.includes('IGST')) {
        itemStr += `      IGST: ₹${i.tax} (${i.gstRate})n`;
      } else if (i.gstRate) {
        const halfTax = (parseFloat(i.tax) / 2).toFixed(2);
        itemStr += `      CGST: ₹${halfTax} | SGST: ₹${halfTax}n`;
      } else if (i.tax > 0) {
        itemStr += `      Tax: ₹${i.tax}n`;
      }

      itemStr += `      *Item Total: ₹${i.finalAmount}*`;
      return itemStr;
    }).join('nn');

    let totalsText = ``;
    totalsText += `      *Total Taxable Value:* ₹${totalTaxable}n`;

    if (estimate.igst > 0) {
      totalsText += `      *IGST:* ₹${parseFloat(estimate.igst).toFixed(2)}n`;
    } else {
      if (estimate.cgst > 0) totalsText += `      *CGST:* ₹${parseFloat(estimate.cgst).toFixed(2)}n`;
      if (estimate.sgst > 0) totalsText += `      *SGST:* ₹${parseFloat(estimate.sgst).toFixed(2)}n`;
    }

    if (estimate.discount > 0) {
      totalsText += `      *Discount:* ₹${parseFloat(estimate.discount).toFixed(2)}n`;
    }

    const message = `✨ *PROFORMA INVOICE DETAILS* ✨nn`
      + `Namo Gange Namaskar! 🙏nn`
      + `Dear *${estimate.consignee_name || 'Client'}*,nn`
      + `Thank you for choosing *International Health & Wellness Expo*. We are pleased to share the details of your Proforma Invoice.nn`
      + `📄 *Invoice No:* ${estimate.est_no}n`
      + `📅 *Date:* ${dateStr}n`
      + `🏢 *Company:* ${estimate.consignee_name}n`
      + `📍 *Location:* ${estimate.city || 'N/A'}, ${estimate.state || 'N/A'}n`
      + `📝 *GSTIN:* ${estimate.gst_no || 'N/A'}nn`
      + `📋 *ITEM DETAILS:*n`
      + `-------------------------------n`
      + `${itemsText}n`
      + `-------------------------------nn`
      + `📊 *INVOICE SUMMARY:*n`
      + `${totalsText}n`
      + `💰 *GRAND TOTAL:* *₹${estimate.finalAmount}*nn`
      + `If you have any queries or require further clarification, please feel free to reach out to us. We look forward to a successful collaboration! 🤝nn`
      + `🌐 *Website:* https://www.ihwe.inn`
      + `📧 *Email:* info@ihwe.inn`
      + `📞 *Contact:* +91 9654900525nn`
      + `Warm Regards,n`
      + `*Namo Gange Wellness Pvt. Ltd.* 🌿`;

    const result = await sendWhatsAppMessage(phone, message, estimate.consignee_name);

    if (result.success) {
      res.status(200).json({ message: "WhatsApp message sent successfully" });
    } else {
      res.status(500).json({ message: "Failed to send WhatsApp message", error: result.error });
    }
  } catch (error) {
    res.status(500).json({ message: "Error sending WhatsApp", error: error.message });
  }
};

// Send Estimate via Email
const sendEmailEstimate = async (req, res) => {
  try {
    const estimate = await Estimate.findById(req.params.id);
    if (!estimate) return res.status(404).json({ message: "Estimate not found" });

    let email = req.body.email;
    if (!email) {
      let company = await Company.findById(estimate.companyId);
      if (!company) {
        company = await ExhibitorRegistration.findById(estimate.companyId);
      }
      email = company?.contact1?.email || company?.email;
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
                    ${i.subDesc ? `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">${i.subDesc.replace(/n/g, '<br>')}</div>` : ''}
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
                                        <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: bold; color: #1e3c72; text-transform: capitalize;">${estimate.consignee_name}</p>
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

    const subject = `Proforma Invoice Details - ${estimate.est_no}`;

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
  addEstimate,
  getGroupedEstimateData,
  getAllEstimates,
  getEstimateById,
  updateEstimate,
  deleteEstimate,
  getNextEstimateNumber,
  sendWhatsAppEstimate,
  sendEmailEstimate,
};
