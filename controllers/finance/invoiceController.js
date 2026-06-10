const Invoice = require('../../models/finance/Invoice');
const Company = require('../../models/misc/Company');
const ExhibitorRegistration = require('../../models/exhibitor_seller/ExhibitorRegistration');
const { sendWhatsAppMessage } = require('../../utils/whatsapp');
const emailService = require('../../utils/emailService');

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
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

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

    // Generate invoice number
    const invoice_no = await Invoice.generateNextInvoiceNumber();

    const newInvoice = new Invoice({
      ...req.body,
      invoice_no,
    });

    const savedInvoice = await newInvoice.save();

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
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after' },
    );

    if (!updatedInvoice)
      return res.status(404).json({ message: "Invoice not found" });

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
const deleteInvoice = async (req, res) => {
  try {
    const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);

    if (!deletedInvoice)
      return res.status(404).json({ message: "Invoice not found" });

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

// Send Invoice via WhatsApp
const sendWhatsAppInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    let phone = req.body.phone;
    if (!phone) {
      let company = await Company.findById(invoice.companyId);
      if (!company) {
        company = await ExhibitorRegistration.findById(invoice.companyId);
      }
      phone = company?.contact1?.mobile || company?.mobile || company?.contact2?.mobile;
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
      + `Dear *${invoice.consignee_name || 'Client'}*,\n\n`
      + `Thank you for choosing *International Health & Wellness Expo*. We are pleased to share the details of your Invoice.\n\n`
      + `📄 *Invoice No:* ${invoice.invoice_no}\n`
      + `📅 *Date:* ${dateStr}\n`
      + `🏢 *Company:* ${invoice.consignee_name}\n`
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

    const result = await sendWhatsAppMessage(phone, message, invoice.consignee_name);

    if (result.success) {
      res.status(200).json({ message: "WhatsApp message sent successfully" });
    } else {
      res.status(500).json({ message: "Failed to send WhatsApp message", error: result.error });
    }
  } catch (error) {
    res.status(500).json({ message: "Error sending WhatsApp", error: error.message });
  }
};

// Send Invoice via Email
const sendEmailInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    let email = req.body.email;
    if (!email) {
      let company = await Company.findById(invoice.companyId);
      if (!company) {
        company = await ExhibitorRegistration.findById(invoice.companyId);
      }
      email = company?.contact1?.email || company?.email;
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
                                        <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: bold; color: #1e3c72; text-transform: capitalize;">${invoice.consignee_name}</p>
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
  updateInvoice,
  deleteInvoice,
  sendWhatsAppInvoice,
  sendEmailInvoice,
};
