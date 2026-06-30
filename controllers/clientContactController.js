const Company = require("../models/Company");
const ExhibitorRegistration = require("../models/ExhibitorRegistration");
const ActivityLog = require("../models/activity/activityLogModel");
const { logActivity } = require("../utils/logger");

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const uniqueStrings = (values) => [...new Set(values.filter(Boolean).map((value) => String(value).trim()).filter(Boolean))];

const buildActivityQuery = (terms) => {
    const uniqueTerms = uniqueStrings(terms);
    if (uniqueTerms.length === 0) return null;

    return {
        $or: uniqueTerms.flatMap((term) => {
            const pattern = new RegExp(escapeRegex(term), "i");
            return [
                { user: pattern },
                { action: pattern },
                { module: pattern },
                { details: pattern },
                { link: pattern }
            ];
        })
    };
};

exports.getClientContacts = async (req, res) => {
    try {
        const { clientId } = req.params;
        let company = await Company.findById(clientId);
        let exhibitor = null;

        let contacts = [];
        let source = "";

        const injectPrimaryContact = (contactList, exhibitor) => {
            if (!exhibitor || !exhibitor.contact1 || (!exhibitor.contact1.firstName && !exhibitor.contact1.email)) {
                return contactList;
            }

            const hasPrimary = contactList.some(c => c.isPrimary);
            const hasSameEmail = contactList.some(c => c.email && exhibitor.contact1.email && c.email.toLowerCase() === exhibitor.contact1.email.toLowerCase());

            if (!hasPrimary && !hasSameEmail) {
                const primaryContact = {
                    name: (exhibitor.contact1.firstName || '') + (exhibitor.contact1.lastName ? ' ' + exhibitor.contact1.lastName : ''),
                    designation: exhibitor.contact1.designation || '',
                    email: exhibitor.contact1.email || '',
                    mobile: exhibitor.contact1.mobile || '',
                    isPrimary: true,
                    roleAtExhibition: 'Primary Contact',
                    passes: { exhibitor: true, delegate: false, lunch: false, parking: false },
                    verificationStatus: 'Verified'
                };

                return [primaryContact, ...contactList];
            }
            return contactList;
        };

        if (company) {
            contacts = company.contacts || [];
            source = "Company";

            if (company.exhibitorRegistrationId) {
                exhibitor = await ExhibitorRegistration.findById(company.exhibitorRegistrationId);
                if (exhibitor) {
                    contacts = exhibitor.teamMembers || [];
                    contacts = injectPrimaryContact(contacts, exhibitor);
                    source = "ExhibitorRegistration";
                }
            }
        } else {
            // Check if it is an ExhibitorRegistration ID directly
            exhibitor = await ExhibitorRegistration.findById(clientId);
            if (exhibitor) {
                contacts = exhibitor.teamMembers || [];
                contacts = injectPrimaryContact(contacts, exhibitor);
                source = "ExhibitorRegistration";
            } else {
                return res.status(404).json({ success: false, message: "Client not found" });
            }
        }

        const activityQuery = buildActivityQuery([
            clientId,
            company?._id?.toString(),
            exhibitor?._id?.toString(),
            company?.companyName,
            exhibitor?.exhibitorName,
            exhibitor?.registrationId,
            company?.exhibitorRegistrationId,
            company?.email,
            exhibitor?.companyEmail,
            exhibitor?.contact1?.email,
            exhibitor?.contact1?.mobile,
            ...(contacts || []).map((contact) => contact?.email),
            ...(contacts || []).map((contact) => contact?.mobile),
            ...(contacts || []).map((contact) => contact?.name)
        ]);

        const activityLogs = activityQuery
            ? await ActivityLog.find(activityQuery).sort({ createdAt: -1 }).limit(12).lean()
            : [];

        res.status(200).json({
            success: true,
            data: contacts,
            source,
            activityLogs: activityLogs.map((log) => ({
                id: log._id,
                action: log.action,
                module: log.module,
                details: log.details,
                user: log.user,
                link: log.link,
                ip_address: log.ip_address,
                timestamp: log.createdAt
            }))
        });
    } catch (error) {
        console.error("Error fetching client contacts:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.updateClientContacts = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { contacts } = req.body;

        let company = await Company.findById(clientId);
        let exhibitor = null;
        let existingContacts = [];
        const makeKey = (contact = {}) => [
            contact.email || "",
            contact.mobile || "",
            contact.name || contact.firstName || "",
            contact.roleAtExhibition || ""
        ].map((part) => String(part).trim().toLowerCase()).join("|");
        const displayName = (contact = {}) => contact.name || [contact.title, contact.firstName, contact.lastName].filter(Boolean).join(" ") || contact.email || contact.mobile || "Unknown";

        if (company) {
            if (company.exhibitorRegistrationId) {
                exhibitor = await ExhibitorRegistration.findById(company.exhibitorRegistrationId);
                if (exhibitor) {
                    existingContacts = exhibitor.teamMembers || [];
                    exhibitor.teamMembers = contacts;
                    await exhibitor.save();
                    const prevKeys = new Set(existingContacts.map(makeKey));
                    const nextKeys = new Set(contacts.map(makeKey));
                    const added = contacts.filter((c) => !prevKeys.has(makeKey(c)));
                    const removed = existingContacts.filter((c) => !nextKeys.has(makeKey(c)));
                    const summary = [
                        `Updated team members for ${exhibitor.exhibitorName || company.companyName || clientId}`,
                        added.length ? `+${added.length} added (${added.slice(0, 3).map(displayName).join(", ")})` : null,
                        removed.length ? `-${removed.length} removed (${removed.slice(0, 3).map(displayName).join(", ")})` : null,
                    ].filter(Boolean).join(" | ");
                    await logActivity(req, "Updated", "Team Members", summary);
                    return res.status(200).json({ success: true, message: "Contacts updated successfully", data: exhibitor.teamMembers });
                }
            }
            existingContacts = company.contacts || [];
            company.contacts = contacts;
            await company.save();
            const prevKeys = new Set(existingContacts.map(makeKey));
            const nextKeys = new Set(contacts.map(makeKey));
            const added = contacts.filter((c) => !prevKeys.has(makeKey(c)));
            const removed = existingContacts.filter((c) => !nextKeys.has(makeKey(c)));
            const summary = [
                `Updated contacts for ${company.companyName || clientId}`,
                added.length ? `+${added.length} added (${added.slice(0, 3).map(displayName).join(", ")})` : null,
                removed.length ? `-${removed.length} removed (${removed.slice(0, 3).map(displayName).join(", ")})` : null,
            ].filter(Boolean).join(" | ");
            await logActivity(req, "Updated", "Client Contacts", summary);
            return res.status(200).json({ success: true, message: "Contacts updated successfully", data: company.contacts });
        } else {
            // Check if it's an exhibitor ID directly
            exhibitor = await ExhibitorRegistration.findById(clientId);
            if (exhibitor) {
                existingContacts = exhibitor.teamMembers || [];
                exhibitor.teamMembers = contacts;
                await exhibitor.save();
                const prevKeys = new Set(existingContacts.map(makeKey));
                const nextKeys = new Set(contacts.map(makeKey));
                const added = contacts.filter((c) => !prevKeys.has(makeKey(c)));
                const removed = existingContacts.filter((c) => !nextKeys.has(makeKey(c)));
                const summary = [
                    `Updated team members for ${exhibitor.exhibitorName || clientId}`,
                    added.length ? `+${added.length} added (${added.slice(0, 3).map(displayName).join(", ")})` : null,
                    removed.length ? `-${removed.length} removed (${removed.slice(0, 3).map(displayName).join(", ")})` : null,
                ].filter(Boolean).join(" | ");
                await logActivity(req, "Updated", "Team Members", summary);
                return res.status(200).json({ success: true, message: "Contacts updated successfully", data: exhibitor.teamMembers });
            } else {
                return res.status(404).json({ success: false, message: "Client not found" });
            }
        }
    } catch (error) {
        console.error("Error updating client contacts:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

const aiDocumentVerificationService = require("../services/aiDocumentVerificationService");

exports.adminUploadPhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a photo/doc' });
        }

        const photoUrl = req.file.path || req.file.secure_url || req.file.url;
        const originalName = req.file.originalname || req.file.name || '';
        const mimeSubtype = String(req.file.mimetype || '').split('/').pop() || '';
        const extension = originalName.includes('.') ? originalName.split('.').pop() : '';
        const fileType = (extension || mimeSubtype).toUpperCase();
        const docType = req.body.documentType === 'idproof' ? 'ID Proof' : 'Person Photo';

        const aiResult = await aiDocumentVerificationService.verifyDocument({
            fileUrl: photoUrl,
            documentName: docType,
            fileType
        });

        const unsafePhotoIssues = new Set([
            'nudity', 'explicit', 'sexual_content', 'adult_content',
            'minor', 'inappropriate', 'inappropriate_content', 'graphic_violence', 'hate'
        ]);
        const aiIssue = String(aiResult.issue || '').toLowerCase();

        let isRejected = false;
        let rejectReason = aiResult.reason;

        if (!aiResult.skipped && aiResult.valid === false) {
            if (docType === 'Person Photo') {
                if (unsafePhotoIssues.has(aiIssue)) {
                    isRejected = true;
                    rejectReason = aiResult.reason || 'This photo was rejected because it contains inappropriate content.';
                }
            } else {
                isRejected = true;
            }
        }

        if (isRejected) {
            if (typeof deleteFileFromCloudinary === 'function') {
                await deleteFileFromCloudinary(photoUrl);
            }
            return res.status(400).json({
                success: false,
                message: rejectReason,
                aiIssue: aiResult.issue
            });
        }

        res.status(200).json({
            success: true,
            message: 'Uploaded and verified',
            url: photoUrl,
            fileUrl: photoUrl
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
