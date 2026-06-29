const Company = require("../models/Company");
const ExhibitorRegistration = require("../models/ExhibitorRegistration");

exports.getClientContacts = async (req, res) => {
    try {
        const { clientId } = req.params;
        let company = await Company.findById(clientId);

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
                const exhibitor = await ExhibitorRegistration.findById(company.exhibitorRegistrationId);
                if (exhibitor) {
                    contacts = exhibitor.teamMembers || [];
                    contacts = injectPrimaryContact(contacts, exhibitor);
                    source = "ExhibitorRegistration";
                }
            }
        } else {
            // Check if it is an ExhibitorRegistration ID directly
            const exhibitor = await ExhibitorRegistration.findById(clientId);
            if (exhibitor) {
                contacts = exhibitor.teamMembers || [];
                contacts = injectPrimaryContact(contacts, exhibitor);
                source = "ExhibitorRegistration";
            } else {
                return res.status(404).json({ success: false, message: "Client not found" });
            }
        }

        res.status(200).json({ success: true, data: contacts, source });
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

        if (company) {
            if (company.exhibitorRegistrationId) {
                const exhibitor = await ExhibitorRegistration.findById(company.exhibitorRegistrationId);
                if (exhibitor) {
                    exhibitor.teamMembers = contacts;
                    await exhibitor.save();
                    return res.status(200).json({ success: true, message: "Contacts updated successfully", data: exhibitor.teamMembers });
                }
            }
            company.contacts = contacts;
            await company.save();
            return res.status(200).json({ success: true, message: "Contacts updated successfully", data: company.contacts });
        } else {
            // Check if it's an exhibitor ID directly
            const exhibitor = await ExhibitorRegistration.findById(clientId);
            if (exhibitor) {
                exhibitor.teamMembers = contacts;
                await exhibitor.save();
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
