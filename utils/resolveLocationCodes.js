// A past bulk import left some records' state/city holding raw
// CrmState.stateCode / CrmCity.cityCode numbers instead of names (see
// scripts/migrateStateCityCodesToNames.js). Shared guard so any endpoint
// that feeds a client's displayed address (invoices, company/exhibitor
// lookups, ...) resolves a bare numeric code back to its real name before
// sending it to the frontend, regardless of which record it leaked in from.
const CrmState = require("../models/CrmState");
const CrmCity = require("../models/CrmCity");

const isNumericCode = (value) => typeof value === "string" && /^\d+$/.test(value.trim());
const STATE_KEYS = ["state", "billing_state"];
const CITY_KEYS = ["city", "billing_city"];
const NESTED_KEYS = ["company", "exhibitor"];

// Works over one object or an array of them (each optionally carrying nested
// `company`/`exhibitor` objects — see NESTED_KEYS), resolving every numeric
// state/city field found with a single batched CrmState/CrmCity lookup.
const resolveLocationCodes = async (objOrList) => {
  const list = Array.isArray(objOrList) ? objOrList : [objOrList];
  const targets = [];
  list.forEach((obj) => {
    if (!obj) return;
    targets.push(obj);
    NESTED_KEYS.forEach((key) => { if (obj[key]) targets.push(obj[key]); });
  });

  const stateCodes = new Set();
  const cityCodes = new Set();
  targets.forEach((target) => {
    STATE_KEYS.forEach((key) => { if (isNumericCode(target[key])) stateCodes.add(Number(target[key].trim())); });
    CITY_KEYS.forEach((key) => { if (isNumericCode(target[key])) cityCodes.add(Number(target[key].trim())); });
  });
  if (stateCodes.size === 0 && cityCodes.size === 0) return objOrList;

  const [states, cities] = await Promise.all([
    stateCodes.size ? CrmState.find({ stateCode: { $in: [...stateCodes] } }).select("stateCode name").lean() : [],
    cityCodes.size ? CrmCity.find({ cityCode: { $in: [...cityCodes] } }).select("cityCode name").lean() : [],
  ]);
  const stateNameByCode = new Map(states.map((s) => [s.stateCode, s.name]));
  const cityNameByCode = new Map(cities.map((c) => [c.cityCode, c.name]));

  targets.forEach((target) => {
    STATE_KEYS.forEach((key) => {
      if (isNumericCode(target[key])) {
        const name = stateNameByCode.get(Number(target[key].trim()));
        if (name) target[key] = name;
      }
    });
    CITY_KEYS.forEach((key) => {
      if (isNumericCode(target[key])) {
        const name = cityNameByCode.get(Number(target[key].trim()));
        if (name) target[key] = name;
      }
    });
  });
  return objOrList;
};

module.exports = { resolveLocationCodes };
