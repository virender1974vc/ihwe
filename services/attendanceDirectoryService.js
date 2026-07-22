const Attendance = require('../models/Attendance');
const CorporateVisitor = require('../models/visitor/CorporateVisitorModel');
const GeneralVisitor = require('../models/visitor/GeneralVisitorModel');
const FreeHealthCamp = require('../models/visitor/FreeHealthCampModel');
const GroupVisitor = require('../models/visitor/GroupVisitorModel');
const BuyerRegistration = require('../models/BuyerRegistration');
const InternationalBuyer = require('../models/InternationalBuyer');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const SellerRegistration = require('../models/SellerRegistration');

const value = input => String(input || '').trim();
const assetUrl = (input, origin = '') => {
  const path = value(input);
  if (!path || /^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
  return `${value(origin).replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};
const row = (doc, type, subType, fields = {}) => ({
  registrationId: value(fields.registrationId), subjectId: value(fields.subjectId || doc._id),
  type, subType, name: value(fields.name), company: value(fields.company),
  email: value(fields.email), mobile: value(fields.mobile), designation: value(fields.designation),
  country: value(fields.country), city: value(fields.city), status: value(fields.status),
  photoUrl: value(fields.photoUrl), photoKind: value(fields.photoKind || 'person'),
  companyId: value(fields.companyId), createdAt: doc.createdAt || null,
  present: false, presentDays: [], attendanceId: null
});

async function registeredRows(type) {
  if (type === 'visitor') {
    const [corporate, general, health, groups] = await Promise.all([
      CorporateVisitor.find().lean(), GeneralVisitor.find().lean(), FreeHealthCamp.find().lean(), GroupVisitor.find().lean()
    ]);
    return [
      ...corporate.map(d => row(d, type, 'corporate-visitor', { registrationId:d.registrationId, name:`${d.firstName||''} ${d.lastName||''}`, company:d.companyName, email:d.email, mobile:d.mobile, designation:d.designation, country:d.country, city:d.city, status:d.status })),
      ...general.map(d => row(d, type, 'general-visitor', { registrationId:d.registrationId, name:`${d.firstName||''} ${d.lastName||''}`, company:d.companyName, email:d.email, mobile:d.mobile, designation:d.designation, country:d.country, city:d.city, status:d.status })),
      ...health.map(d => row(d, type, 'health-camp-visitor', { registrationId:d.registrationId, name:`${d.firstName||''} ${d.lastName||''}`, email:d.email, mobile:d.mobile, country:d.country, city:d.city, status:d.status })),
      ...groups.flatMap(g => (g.persons || []).map(p => row(g, type, 'group-visitor-member', { subjectId:p._id, registrationId:p.registrationId || g.groupRegistrationId, name:`${p.firstName||''} ${p.lastName||''}`, company:g.companyName, email:p.email, mobile:p.mobileNo, designation:p.designation, country:g.country, city:g.city, status:g.status })))
    ];
  }
  if (type === 'buyer') {
    const [buyers, international] = await Promise.all([BuyerRegistration.find().lean(), InternationalBuyer.find().lean()]);
    return [
      ...buyers.map(d => row(d, type, 'buyer', { registrationId:d.registrationId, name:d.fullName || d.contactPerson, company:d.companyName || d.companyFirmName, email:d.emailAddress, mobile:d.mobileNumber, designation:d.designation, country:d.country, city:d.city, status:d.paymentStatus })),
      ...international.map(d => row(d, type, 'international-buyer', { registrationId:d.registrationId, name:d.primaryContact?.fullName, company:d.brandName || d.companyName, email:d.primaryContact?.emailId, mobile:d.primaryContact?.mobileNumber, designation:d.primaryContact?.designation, country:d.country, city:d.city, status:d.status, photoUrl:d.primaryContact?.photoUrl || d.documents?.logo }))
    ];
  }
  const [exhibitors, sellers] = await Promise.all([ExhibitorRegistration.find().lean(), SellerRegistration.find().lean()]);
  return [
    ...exhibitors.map(d => row(d, type, 'exhibitor', { registrationId:d.registrationId, name:d.exhibitorName, company:d.exhibitorName, email:d.contact1?.email, mobile:d.contact1?.mobile, designation:d.contact1?.designation, country:d.country, city:d.city, status:d.status, photoUrl:d.companyLogoUrl || d.companyLogo, photoKind:'logo', companyId:d._id })),
    ...sellers.map(d => row(d, type, 'seller', { registrationId:d.registrationId, name:d.companyName || d.fullName, company:d.companyName, email:d.emailAddress, mobile:d.mobileNumber, designation:d.designation, country:d.country, city:d.city, status:d.paymentStatus }))
  ];
}

async function getDirectory({ type, view, day, subType, search, page = 1, limit = 50, eventId, origin }) {
  let items = await registeredRows(type);
  items = items.map(item => ({ ...item, photoUrl:assetUrl(item.photoUrl, origin) }));
  const attendance = await Attendance.find({ eventId, subjectType:type, attendanceKind:{ $ne:'pass' } })
    .select('_id subjectKey companyId registrationId eventDay markedAt').sort({ markedAt:-1 }).lean();
  const byKey = new Map();
  for (const a of attendance) {
    const key = type === 'exhibitor' && a.companyId ? `company:${a.companyId}` : `registration:${a.registrationId}`;
    const current = byKey.get(key) || { days:new Set(), attendanceId:String(a._id) };
    current.days.add(a.eventDay); byKey.set(key, current);
  }
  items = items.map(item => {
    const key = type === 'exhibitor' && item.companyId ? `company:${item.companyId}` : `registration:${item.registrationId}`;
    const hit = byKey.get(key);
    return hit ? { ...item, present:true, presentDays:[...hit.days], attendanceId:hit.attendanceId } : item;
  });
  if (view === 'present') items = items.filter(item => item.present && (!day || item.presentDays.includes(day)));
  if (subType) items = items.filter(item => item.subType === subType);
  if (search) {
    const needle = value(search).toLowerCase();
    items = items.filter(item => [item.name,item.company,item.registrationId,item.email,item.mobile].some(v => value(v).toLowerCase().includes(needle)));
  }
  items.sort((a,b) => (b.present ? 1:0) - (a.present ? 1:0) || value(a.company || a.name).localeCompare(value(b.company || b.name)));
  const total = items.length; const safePage = Math.max(1, Number(page)||1); const safeLimit = Math.min(1000, Math.max(1, Number(limit)||50));
  return { items:items.slice((safePage-1)*safeLimit, safePage*safeLimit), pagination:{ page:safePage, limit:safeLimit, total, pages:Math.ceil(total/safeLimit) } };
}

module.exports = { getDirectory, registeredRows };
