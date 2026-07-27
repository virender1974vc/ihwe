'use strict';

async function resolveAccessoryNotificationRegistration(registration) {
        const toPlain = (doc) => doc?.toObject ? doc.toObject() : { ...(doc || {}) };
        const base = toPlain(registration);
        const merged = {
            ...base,
            contact1: { ...(base.contact1 || {}) },
            participation: { ...(base.participation || {}) }
        };
        const hasValue = (value) => {
            const normalized = String(value || '').trim();
            return normalized && normalized.toUpperCase() !== 'N/A';
        };
        const applyContact = (source = {}) => {
            if (!source) return;
            const map = {
                title: ['title'],
                firstName: ['firstName'],
                lastName: ['lastName', 'surname'],
                email: ['email'],
                designation: ['designation'],
                mobile: ['mobile'],
                whatsapp: ['whatsapp', 'mobile'],
                alternateNo: ['alternateNo', 'alternate'],
                photoUrl: ['photoUrl', 'photo']
            };

            Object.entries(map).forEach(([targetKey, sourceKeys]) => {
                if (hasValue(merged.contact1[targetKey])) return;
                const sourceKey = sourceKeys.find((key) => hasValue(source[key]));
                if (sourceKey) merged.contact1[targetKey] = String(source[sourceKey]).trim();
            });
        };

        try {
            const ExhibitorRegistration = require('../../models/ExhibitorRegistration');
            const query = [];
            if (base._id) query.push({ _id: base._id });
            if (base.clientId) query.push({ clientId: base.clientId });
            if (base.exhibitorName && base.eventId) query.push({ exhibitorName: base.exhibitorName, eventId: base.eventId });
            if (hasValue(base.registrationId)) query.push({ registrationId: base.registrationId });

            if (query.length) {
                const registrations = await ExhibitorRegistration.find({ $or: query })
                    .sort({ createdAt: -1 })
                    .limit(10)
                    .lean();
                registrations.forEach((doc) => {
                    applyContact(doc.contact1);
                    applyContact(doc.contact2);
                    if (!hasValue(merged.participation?.stallFor) && doc.participation?.stallFor) {
                        merged.participation.stallFor = doc.participation.stallFor;
                    }
                });
            }

            if (base.clientId) {
                const Company = require('../../models/Company');
                const crmCompany = await Company.findById(base.clientId).lean();
                if (crmCompany?.contacts?.length) {
                    crmCompany.contacts.forEach(applyContact);
                }
            }
        } catch (err) {
            console.error('[AccessoryNotification] Contact resolution failed:', err.message);
        }

        return merged;
    }

module.exports = { resolveAccessoryNotificationRegistration };
