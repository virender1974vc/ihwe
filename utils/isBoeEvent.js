// Single source of truth for "does this visitor/event belong to BOE (Bharat Organic Expo)?"
// Matches "BOE 2027", "Bharat Organic Expo", "Organic Expo 2026"; anything else is IHWE.
const isBoeEvent = (eventName = '', domainName = '') =>
  String(domainName || '').toLowerCase() === 'boe' ||
  /\bboe\b|organic/i.test(String(eventName || ''));

module.exports = { isBoeEvent };
