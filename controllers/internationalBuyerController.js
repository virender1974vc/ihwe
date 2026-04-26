const internationalBuyerService = require('../services/internationalBuyerService');
const { logActivity } = require('../utils/logger');

class InternationalBuyerController {
    async getAllRegistrations(req, res) {
        try {
            const data = await internationalBuyerService.getAllRegistrations();
            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getRegistrationById(req, res) {
        try {
            const data = await internationalBuyerService.getRegistrationById(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: 'Registration not found' });
            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async register(req, res) {
        try {
            const formData = { ...req.body };

            // Handle nested objects if they come as strings (common with FormData)
            const nestedFields = [
                'primaryContact', 'secondaryContact', 'stallRequirement', 
                'sponsorship', 'businessProfile', 'b2bInterest', 
                'travelSupport', 'billingDetails', 'declarations', 'vipProgram'
            ];

            nestedFields.forEach(field => {
                if (typeof formData[field] === 'string') {
                    try {
                        formData[field] = JSON.parse(formData[field]);
                    } catch (e) {
                        // Keep as is if not JSON
                    }
                }
            });

            // Handle Arrays
            const arrayFields = ['natureOfBusiness', 'productCategories', 'socialMediaLinks'];
            arrayFields.forEach(field => {
                if (typeof formData[field] === 'string') {
                    try {
                        formData[field] = JSON.parse(formData[field]);
                    } catch (e) {
                        formData[field] = formData[field].split(',').map(s => s.trim());
                    }
                }
            });

            // Handle Files
            if (req.files) {
                formData.documents = formData.documents || {};
                const fileMap = {
                    companyRegistrationCertificate: 'companyRegistrationCertificate',
                    taxRegistrationCertificate: 'taxRegistrationCertificate',
                    passportCopy: 'passportCopy',
                    productCatalogue: 'productCatalogue',
                    companyBrochure: 'companyBrochure',
                    logo: 'logo',
                    visitingCard: 'visitingCard',
                    productCertifications: 'productCertifications',
                    previousParticipationProof: 'previousParticipationProof'
                };

                Object.keys(fileMap).forEach(key => {
                    if (req.files[key]) {
                        formData.documents[fileMap[key]] = req.files[key][0].path;
                    }
                });
            }

            const saved = await internationalBuyerService.addRegistration(formData);

            try {
                await logActivity(req, 'Created', 'International Buyer', `New registration: ${saved.brandName} (${saved.registrationId})`);
            } catch (logErr) {
                console.error("Log activity error:", logErr);
            }

            res.status(201).json({ success: true, data: saved });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { adminApprovalStatus } = req.body;
            
            const updated = await internationalBuyerService.updateRegistration(id, { 
                'verification.adminApprovalStatus': adminApprovalStatus 
            });

            if (!updated) return res.status(404).json({ success: false, message: 'Registration not found' });

            res.status(200).json({ success: true, data: updated });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async deleteRegistration(req, res) {
        try {
            const data = await internationalBuyerService.getRegistrationById(req.params.id);
            await internationalBuyerService.deleteRegistration(req.params.id);
            
            if (data) {
                await logActivity(req, 'Deleted', 'International Buyer', `Deleted: ${data.brandName} (${data.registrationId})`);
            }
            
            res.status(200).json({ success: true, message: 'Deleted successfully' });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = new InternationalBuyerController();
