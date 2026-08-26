const mongoose = require('mongoose');

const logoSchema = new mongoose.Schema({
  image: { type: String, default: '' },
  imageAlt: { type: String, default: '' }
}, { _id: false });

const partnersAndBrandsSchema = new mongoose.Schema({
  industryLeadersLogos: { type: [logoSchema], default: [] },
  knowledgeLogos: { type: [logoSchema], default: [] },
  wellnessLogos: { type: [logoSchema], default: [] },
  supportingLogos: { type: [logoSchema], default: [] },
  emergingBrandsLogos: { type: [logoSchema], default: [] }
}, { timestamps: true });

const PartnersAndBrands = global.secondaryDB.model('OrganicPartnersAndBrands', partnersAndBrandsSchema);
module.exports = PartnersAndBrands;
