const ExhibitorRegistration = require("../models/ExhibitorRegistration");
const Stall = require("../models/Stall");

const ROUND_FN = {
  floor: Math.floor,
  round: Math.round,
  ceil: Math.ceil,
};

function computeEntitlement(config, stallArea) {
  if (!config) return 0;
  if (config.allocationMode !== "perArea") {
    return Number(config.fixedQty) || 0;
  }
  const ratioArea = Number(config.ratioArea);
  const area = Number(stallArea);
  if (!area || !ratioArea) return 0;
  const roundFn = ROUND_FN[config.roundingMode] || Math.floor;
  const multiplier = roundFn(area / ratioArea);
  return multiplier * (Number(config.ratioQty) || 0);
}

async function getExhibitorStallArea(exhibitorRegistrationId) {
  const reg = await ExhibitorRegistration.findById(exhibitorRegistrationId).select(
    "participation.stallSize participation.stallNo"
  );
  let area = reg?.participation?.stallSize;
  if (!area && reg?.participation?.stallNo) {
    const stall = await Stall.findById(reg.participation.stallNo).select("area");
    area = stall?.area;
  }
  return Number(area) || 0;
}

module.exports = { computeEntitlement, getExhibitorStallArea };
