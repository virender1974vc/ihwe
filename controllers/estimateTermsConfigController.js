const EstimateTermsConfig = require("../models/EstimateTermsConfig");

const DOCUMENT_CONFIGS = [
  { documentType: "performa", displayName: "Performa", title: "performa" },
  { documentType: "tax-invoice", displayName: "Tax Invoice", title: "tax invoice" },
  { documentType: "delivery-challan", displayName: "Delivery Challan", title: "DELIVERY CHALLAN" },
];

const cleanList = (items) => (
  Array.isArray(items)
    ? items.map((item) => String(item || "").trim()).filter(Boolean)
    : []
);

const getDefaultDoc = (documentType = "performa") => (
  DOCUMENT_CONFIGS.find((item) => item.documentType === documentType) || DOCUMENT_CONFIGS[0]
);

const getOrCreateConfig = async (documentType = "performa") => {
  const docDefaults = getDefaultDoc(documentType);
  let config = await EstimateTermsConfig.findOne({ documentType: docDefaults.documentType });
  if (!config) {
    config = await EstimateTermsConfig.create({
      documentType: docDefaults.documentType,
      displayName: docDefaults.displayName,
      title: docDefaults.title,
      termsAndConditions: [],
      paymentConditions: [],
      deliveryNotes: [],
      specialRemark: "",
      updatedBy: "System",
    });
  }
  return config;
};

const ensureDefaultConfigs = async () => {
  const configs = [];
  for (const docConfig of DOCUMENT_CONFIGS) {
    configs.push(await getOrCreateConfig(docConfig.documentType));
  }
  return configs;
};

const getEstimateTermsConfig = async (req, res) => {
  try {
    if (req.params.documentType) {
      const config = await getOrCreateConfig(req.params.documentType);
      return res.json({ success: true, data: config });
    }

    const configs = await ensureDefaultConfigs();
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch estimate terms config", error: error.message });
  }
};

const updateEstimateTermsConfig = async (req, res) => {
  try {
    const config = await getOrCreateConfig(req.params.documentType || req.body.documentType || "performa");
    config.title = String(req.body.title || config.title || "").trim() || "Estimate Terms & Payment Conditions";
    config.displayName = String(req.body.displayName || config.displayName || "").trim() || getDefaultDoc(config.documentType).displayName;
    config.termsAndConditions = cleanList(req.body.termsAndConditions);
    config.paymentConditions = cleanList(req.body.paymentConditions);
    config.deliveryNotes = cleanList(req.body.deliveryNotes);
    config.specialRemark = String(req.body.specialRemark || "").trim();
    config.status = req.body.status === "inactive" ? "inactive" : "active";
    config.updatedBy = String(req.body.updatedBy || "Admin").trim() || "Admin";
    await config.save();
    res.json({ success: true, message: "Estimate terms config updated successfully", data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update estimate terms config", error: error.message });
  }
};

module.exports = {
  getEstimateTermsConfig,
  updateEstimateTermsConfig,
  DOCUMENT_CONFIGS,
};
