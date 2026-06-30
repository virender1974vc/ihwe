const Company = require("../models/Company");
const ExhibitorRegistration = require("../models/ExhibitorRegistration");

const pickAccountName = (record, fallback = "account") =>
  record?.companyName ||
  record?.exhibitorName ||
  record?.consignee_name ||
  record?.company_name ||
  record?.name ||
  fallback;

const getAccountNameById = async (companyId, fallback = "account") => {
  if (!companyId) return fallback;

  const company = await Company.findById(companyId).lean().catch(() => null);
  if (company) return pickAccountName(company, fallback);

  const exhibitor = await ExhibitorRegistration.findById(companyId).lean().catch(() => null);
  if (exhibitor) return pickAccountName(exhibitor, fallback);

  return fallback;
};

const getDocumentAccountName = async (doc, fallback = "account") => {
  const localName = pickAccountName(doc, "");
  if (localName) return localName;
  return getAccountNameById(doc?.companyId, fallback);
};

module.exports = {
  getAccountNameById,
  getDocumentAccountName,
};
