const mongoose = require('mongoose');

// Buyers are billed through the same Accounts documents as exhibitors (companyId = buyer _id), so the
// shared PI / Invoice screens ask for them as a "company". Returns the company-shaped record, or null.
const findBuyerAsCompany = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const BuyerRegistration = require('../models/BuyerRegistration');
  const InternationalBuyer = require('../models/InternationalBuyer');
  const buyer = await BuyerRegistration.findById(id).lean();
  if (buyer) {
    return {
      _id: buyer._id, _source: 'buyer', buyerKind: 'domestic',
      companyName: buyer.companyName, address: buyer.registeredAddress, city: buyer.city,
      state: buyer.stateProvince, country: buyer.country, pincode: buyer.pinCode,
      contactPerson: buyer.fullName, mobile: buyer.mobileNumber, email: buyer.emailAddress,
      website: buyer.website, gstNo: buyer.gstNumber, eventName: buyer.eventName,
      contacts: [{ name: buyer.fullName, designation: buyer.designation, mobile: buyer.mobileNumber, email: buyer.emailAddress }],
    };
  }
  const intl = await InternationalBuyer.findById(id).lean();
  if (intl) {
    const c = intl.primaryContact || {};
    return {
      _id: intl._id, _source: 'buyer', buyerKind: 'international',
      companyName: intl.brandName, address: intl.address, city: intl.city,
      state: intl.stateProvince, country: intl.country, pincode: intl.postalCode,
      contactPerson: c.fullName, mobile: c.mobileNumber, email: c.emailId, website: intl.website, eventName: intl.eventName,
      contacts: [{ name: c.fullName, designation: c.designation, mobile: c.mobileNumber, email: c.emailId }],
    };
  }
  return null;
};

module.exports = { findBuyerAsCompany };
