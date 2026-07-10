const PaymentReceiptSettings = require("../models/PaymentReceiptSettings");
const pdfGenerator = require("../utils/pdfGenerator");
const fs = require("fs");
const buildSampleRegistration = () => ({
  _id: "000000000000000000000001",
  registrationId: "9IHWE-EX-2026-0001",
  exhibitorName: "The Vastra House Pvt. Ltd.",
  address: "Vill. Begumpur Roopchand Urf Sisouna Jatt",
  city: "Bijnor",
  state: "Uttar Pradesh",
  pincode: "246731",
  gstNo: "09AAECN1234F1Z5",
  balanceAmount: 0,
  amountPaid: 227174,
  paymentMode: "online",
  paymentId: "pay_T3Oh4uAdgV7oflc",
  filledByFullName: "Direct",
  contact1: { title: "Ms.", firstName: "Sradha", lastName: "", mobile: "9368071787", email: "vanshnamegange@gmail.com" },
  participation: { currency: "INR", gstPercent: 18, amount: 192520.34, total: 227174 },
  financeBreakdown: {
    grossAmount: 192520.34,
    subtotal: 192520.34,
    gstAmount: 34653.66,
    tdsPercent: 0,
    tdsAmount: 2505.38,
    netPayable: 224678.62,
  },
  chosenTdsPercent: 0,
  paymentHistory: [{
    amount: 227174,
    method: "Razorpay",
    paymentMode: "online",
    transactionId: "pay_T3Oh4uAdgV7oflc",
    paidAt: new Date(),
  }],
  eventId: { name: "9th International Health & Wellness Expo 2026", startDate: new Date("2026-08-21"), endDate: new Date("2026-08-23"), location: "Pragati Maidan, New Delhi, India" },
});

const previewReceipt = async (req, res) => {
  try {
    const sample = buildSampleRegistration();
    const { filePath } = await pdfGenerator.generatePaymentSlip(sample, { paymentIndex: 0 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="Payment_Receipt_Preview.pdf"');
    return res.sendFile(filePath, (err) => {
      if (!err) fs.unlink(filePath, () => { });
    });
  } catch (error) {
    console.error("Preview payment receipt error:", error);
    res.status(500).json({ success: false, message: "Failed to generate preview", error: error.message });
  }
};

const getSettings = async (req, res) => {
  try {
    let settings = await PaymentReceiptSettings.findOne();
    if (!settings) settings = await new PaymentReceiptSettings({}).save();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error("Fetch payment receipt settings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateSettings = async (req, res) => {
  try {
    let settings = await PaymentReceiptSettings.findOne();
    if (!settings) settings = new PaymentReceiptSettings({});

    const {
      organiserBandColor,
      exhibitorBandColor,
      accentColor,
      noteColor,
      headOfficeLabel,
      receiptTitleLabel,
      fromLabel,
      toLabel,
      invoiceDetailsLabel,
      paymentDetailsLabel,
      exhibitorDetailsLabel,
      importantNoteLabel,
      footerThankYouText,
      footerDisclaimerText,
      receiptNumberPrefix,
      importantNoteItems,
      headerBandHeight,
      eventBandHeight,
      infoBandHeight,
      footerBandHeight,
      pageMarginX,
      sectionGap,
      showSignatureStamp,
      signatureLabel,
    } = req.body;

    if (organiserBandColor) settings.organiserBandColor = organiserBandColor;
    if (exhibitorBandColor) settings.exhibitorBandColor = exhibitorBandColor;
    if (accentColor) settings.accentColor = accentColor;
    if (noteColor) settings.noteColor = noteColor;
    if (headOfficeLabel !== undefined) settings.headOfficeLabel = headOfficeLabel;
    if (receiptTitleLabel !== undefined) settings.receiptTitleLabel = receiptTitleLabel;
    if (fromLabel !== undefined) settings.fromLabel = fromLabel;
    if (toLabel !== undefined) settings.toLabel = toLabel;
    if (invoiceDetailsLabel !== undefined) settings.invoiceDetailsLabel = invoiceDetailsLabel;
    if (paymentDetailsLabel !== undefined) settings.paymentDetailsLabel = paymentDetailsLabel;
    if (exhibitorDetailsLabel !== undefined) settings.exhibitorDetailsLabel = exhibitorDetailsLabel;
    if (importantNoteLabel !== undefined) settings.importantNoteLabel = importantNoteLabel;
    if (footerThankYouText !== undefined) settings.footerThankYouText = footerThankYouText;
    if (footerDisclaimerText !== undefined) settings.footerDisclaimerText = footerDisclaimerText;
    if (receiptNumberPrefix !== undefined) settings.receiptNumberPrefix = receiptNumberPrefix;
    if (showSignatureStamp !== undefined) settings.showSignatureStamp = showSignatureStamp === 'true' || showSignatureStamp === true;
    if (signatureLabel !== undefined) settings.signatureLabel = signatureLabel;

    if (importantNoteItems) {
      try {
        const parsed = typeof importantNoteItems === "string" ? JSON.parse(importantNoteItems) : importantNoteItems;
        if (Array.isArray(parsed)) settings.importantNoteItems = parsed.filter((item) => String(item || "").trim());
      } catch (e) {
        console.error("Failed to parse importantNoteItems:", e.message);
      }
    }

    if (headerBandHeight) settings.headerBandHeight = Number(headerBandHeight);
    if (eventBandHeight) settings.eventBandHeight = Number(eventBandHeight);
    if (infoBandHeight) settings.infoBandHeight = Number(infoBandHeight);
    if (footerBandHeight) settings.footerBandHeight = Number(footerBandHeight);
    if (pageMarginX) settings.pageMarginX = Number(pageMarginX);
    if (sectionGap !== undefined && sectionGap !== '') settings.sectionGap = Number(sectionGap);

    if (req.files?.eventLogoImage?.[0]) {
      settings.eventLogoImage = `/uploads/payment-receipt-settings/${req.files.eventLogoImage[0].filename}`;
    } else if (req.body.removeEventLogo === 'true') {
      settings.eventLogoImage = "";
    }
    
    if (req.files?.headerLogoImage?.[0]) {
      settings.headerLogoImage = `/uploads/payment-receipt-settings/${req.files.headerLogoImage[0].filename}`;
    } else if (req.body.removeHeaderLogo === 'true') {
      settings.headerLogoImage = "";
    }
    
    if (req.files?.stampImage?.[0]) {
      settings.stampImage = `/uploads/payment-receipt-settings/${req.files.stampImage[0].filename}`;
    } else if (req.body.removeStamp === 'true') {
      settings.stampImage = "";
    }
    
    if (req.files?.signatureImage?.[0]) {
      settings.signatureImage = `/uploads/payment-receipt-settings/${req.files.signatureImage[0].filename}`;
    } else if (req.body.removeSignature === 'true') {
      settings.signatureImage = "";
    }

    await settings.save();
    res.json({ success: true, data: settings, message: "Payment receipt settings updated successfully" });
  } catch (error) {
    console.error("Update payment receipt settings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getSettings, updateSettings, previewReceipt };
