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

const countDiff = (before = [], after = []) => {
  const beforeCounts = before.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
  const afterCounts = after.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
  const keys = new Set([...Object.keys(beforeCounts), ...Object.keys(afterCounts)]);
  let added = 0;
  let removed = 0;

  keys.forEach((key) => {
    const diff = (afterCounts[key] || 0) - (beforeCounts[key] || 0);
    if (diff > 0) added += diff;
    if (diff < 0) removed += Math.abs(diff);
  });

  return { added, removed };
};

const buildUpdateDetails = (before, after) => {
  const changes = [];
  if (before.title !== after.title) changes.push(`Title: "${before.title || "-"}" to "${after.title || "-"}"`);
  if (before.displayName !== after.displayName) changes.push(`Name: "${before.displayName || "-"}" to "${after.displayName || "-"}"`);
  if (before.status !== after.status) changes.push(`Status: ${before.status || "-"} to ${after.status || "-"}`);
  if ((before.specialRemark || "") !== (after.specialRemark || "")) changes.push("Special remark updated");

  [
    ["Terms", before.termsAndConditions, after.termsAndConditions],
    ["Payment conditions", before.paymentConditions, after.paymentConditions],
    ["Delivery notes", before.deliveryNotes, after.deliveryNotes],
  ].forEach(([label, oldItems, newItems]) => {
    const diff = countDiff(oldItems || [], newItems || []);
    if (diff.added || diff.removed) changes.push(`${label}: ${diff.added} added, ${diff.removed} removed/changed`);
  });

  return changes.length ? changes.join("; ") : "Saved without visible content changes";
};

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
      createdBy: "System",
      auditLogs: [{
        action: "CREATED",
        by: "System",
        at: new Date(),
        details: `${docDefaults.displayName} default config created`,
      }],
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
    const before = {
      title: config.title,
      displayName: config.displayName,
      status: config.status,
      termsAndConditions: [...(config.termsAndConditions || [])],
      paymentConditions: [...(config.paymentConditions || [])],
      deliveryNotes: [...(config.deliveryNotes || [])],
      specialRemark: config.specialRemark || "",
    };

    const updatedBy = String(req.body.updatedBy || "Admin").trim() || "Admin";
    config.title = String(req.body.title || config.title || "").trim() || "Estimate Terms & Payment Conditions";
    config.displayName = String(req.body.displayName || config.displayName || "").trim() || getDefaultDoc(config.documentType).displayName;
    config.termsAndConditions = cleanList(req.body.termsAndConditions);
    config.paymentConditions = cleanList(req.body.paymentConditions);
    config.deliveryNotes = cleanList(req.body.deliveryNotes);
    config.specialRemark = String(req.body.specialRemark || "").trim();
    config.status = req.body.status === "inactive" ? "inactive" : "active";
    config.updatedBy = updatedBy;
    if (!config.createdBy) config.createdBy = config.updatedBy || "System";
    config.auditLogs = [
      {
        action: "UPDATED",
        by: updatedBy,
        at: new Date(),
        details: buildUpdateDetails(before, {
          title: config.title,
          displayName: config.displayName,
          status: config.status,
          termsAndConditions: config.termsAndConditions,
          paymentConditions: config.paymentConditions,
          deliveryNotes: config.deliveryNotes,
          specialRemark: config.specialRemark,
        }),
      },
      ...(config.auditLogs || []),
    ].slice(0, 50);
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
