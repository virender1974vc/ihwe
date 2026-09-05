const Company = require("../models/Company");
const ExhibitorRegistration = require("../models/ExhibitorRegistration");
const ActivityLog = require("../models/activity/activityLogModel");
const { logActivity } = require("../utils/logger");
const { cleanText, formatDetails } = require("../utils/activityLogFormatter");

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const uniqueStrings = (values) => [...new Set(values.filter(Boolean).map((value) => String(value).trim()).filter(Boolean))];
const getContactDisplayName = (contact = {}) =>
    cleanText(contact.name || contact.firstName || contact.email || contact.mobile, "Team Member");

const buildContactActivity = ({ operation, accountName, contactName, contactCount, added, removed }) => {
    const normalizedOperation = String(operation || "").toLowerCase();
    const cleanAccountName = cleanText(accountName, "this client");
    const cleanContactName = cleanText(contactName, "");

    if (normalizedOperation === "delete") {
        return {
            action: "Deleted",
            details: `Deleted Team Member ${cleanContactName || "Team Member"} for ${cleanAccountName}`,
        };
    }

    if (normalizedOperation === "create") {
        return {
            action: "Created",
            details: `Created Team Member ${cleanContactName || "Team Member"} for ${cleanAccountName}`,
        };
    }

    if (normalizedOperation === "bulk-create") {
        const count = Number(contactCount) || added.length || 0;
        const sampleNames = added.slice(0, 3).map(getContactDisplayName).join(", ");
        return {
            action: "Created",
            details: `Created ${count} Team Member${count === 1 ? "" : "s"} for ${cleanAccountName}${sampleNames ? ` (${sampleNames})` : ""}`,
        };
    }

    if (normalizedOperation === "update") {
        return {
            action: "Updated",
            details: `Updated Team Member ${cleanContactName || "Team Member"} for ${cleanAccountName}`,
        };
    }

    if (added.length && !removed.length) {
        const names = added.slice(0, 3).map(getContactDisplayName).join(", ");
        return {
            action: "Created",
            details: `Created ${added.length} Team Member${added.length === 1 ? "" : "s"} for ${cleanAccountName}${names ? ` (${names})` : ""}`,
        };
    }

    if (removed.length && !added.length) {
        const names = removed.slice(0, 3).map(getContactDisplayName).join(", ");
        return {
            action: "Deleted",
            details: `Deleted ${removed.length} Team Member${removed.length === 1 ? "" : "s"} for ${cleanAccountName}${names ? ` (${names})` : ""}`,
        };
    }

    return {
        action: "Updated",
        details: `Updated Team Members for ${cleanAccountName}`,
    };
};

const buildActivityQuery = (terms) => {
    const uniqueTerms = uniqueStrings(terms);
    if (uniqueTerms.length === 0) return null;

    return {
        module: { $in: [/^Client Contacts$/i, /^Team Members$/i] },
        $or: uniqueTerms.flatMap((term) => {
            const pattern = new RegExp(escapeRegex(term), "i");
            return [
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
                    title: exhibitor.contact1.title || '',
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

        const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

        if (company) {
            contacts = company.contacts || [];
            source = "Company";

            if (company.exhibitorRegistrationId) {
                if (isObjectId(company.exhibitorRegistrationId)) {
                    exhibitor = await ExhibitorRegistration.findById(company.exhibitorRegistrationId);
                } else {
                    exhibitor = await ExhibitorRegistration.findOne({ registrationId: company.exhibitorRegistrationId });
                }

                if (exhibitor) {
                    contacts = exhibitor.teamMembers || [];
                    contacts = injectPrimaryContact(contacts, exhibitor);
                    source = "ExhibitorRegistration";
                }
            }
        } else {
            // Check if it is an ExhibitorRegistration ID directly
            if (isObjectId(clientId)) {
                exhibitor = await ExhibitorRegistration.findById(clientId);
            } else {
                exhibitor = await ExhibitorRegistration.findOne({ registrationId: clientId });
            }

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
                action: cleanText(log.action, "Activity"),
                module: cleanText(log.module, "Client Contacts"),
                details: formatDetails(log.details),
                user: cleanText(log.user, "System"),
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
        const { contacts, contactOperation, contactName, contactCount } = req.body;

        let company = await Company.findById(clientId);
        let exhibitor = null;
        let existingContacts = [];
        const makeKey = (contact = {}) => [
            contact.email || "",
            contact.mobile || "",
            contact.name || contact.firstName || "",
            contact.roleAtExhibition || ""
        ].map((part) => String(part).trim().toLowerCase()).join("|");

        if (company) {
            if (company.exhibitorRegistrationId) {
                exhibitor = await ExhibitorRegistration.findById(company.exhibitorRegistrationId);
                if (exhibitor) {
                    existingContacts = exhibitor.teamMembers || [];
                    exhibitor.teamMembers = contacts;
                    await exhibitor.save();
                    // Keep the CRM Company's own contacts in step. Anything that reads the
                    // client through the Company record - Client Overview, the Proforma
                    // Invoice's Contact Person dropdown - uses company.contacts, so
                    // returning here without writing it left those screens showing the
                    // pre-rename contact indefinitely.
                    await Company.updateOne({ _id: company._id }, { $set: { contacts } });
                    const prevKeys = new Set(existingContacts.map(makeKey));
                    const nextKeys = new Set(contacts.map(makeKey));
                    const added = contacts.filter((c) => !prevKeys.has(makeKey(c)));
                    const removed = existingContacts.filter((c) => !nextKeys.has(makeKey(c)));
                    const activity = buildContactActivity({
                        operation: contactOperation,
                        accountName: exhibitor.exhibitorName || company.companyName,
                        contactName,
                        contactCount,
                        added,
                        removed,
                    });
                    await logActivity(req, activity.action, "Client Contacts", activity.details);
                    return res.status(200).json({ success: true, message: "Contacts updated successfully", data: exhibitor.teamMembers });
                }
            }
            existingContacts = company.contacts || [];
            await Company.updateOne({ _id: clientId }, { $set: { contacts } });
            company.contacts = contacts;
            const prevKeys = new Set(existingContacts.map(makeKey));
            const nextKeys = new Set(contacts.map(makeKey));
            const added = contacts.filter((c) => !prevKeys.has(makeKey(c)));
            const removed = existingContacts.filter((c) => !nextKeys.has(makeKey(c)));
            const activity = buildContactActivity({
                operation: contactOperation,
                accountName: company.companyName,
                contactName,
                contactCount,
                added,
                removed,
            });
            await logActivity(req, activity.action, "Client Contacts", activity.details);
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
                const activity = buildContactActivity({
                    operation: contactOperation,
                    accountName: exhibitor.exhibitorName,
                    contactName,
                    contactCount,
                    added,
                    removed,
                });
                await logActivity(req, activity.action, "Client Contacts", activity.details);
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
