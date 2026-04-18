const exhibitorRegistrationService = require('../services/exhibitorRegistrationService');
const { logActivity } = require('../utils/logger');

/**
 * Controller for handling Exhibitor Registration requests.
 */
class ExhibitorRegistrationController {
    /**
     * Get all registrations.
     */
    async getAllRegistrations(req, res) {
        try {
            const enriched = await exhibitorRegistrationService.getAllRegistrations();
            res.status(200).json({ success: true, data: enriched });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getRegistrationById(req, res) {
        try {
            const registration = await exhibitorRegistrationService.getRegistrationById(req.params.id);
            if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });
            res.status(200).json({ success: true, data: registration });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Add a new registration.
     */
    async addRegistration(req, res) {
        try {
            const savedRegistration = await exhibitorRegistrationService.addRegistration(req.body);

            await logActivity(req, 'Created', 'Exhibitor Bookings', `New booking: ${savedRegistration.companyName} (${savedRegistration.registrationId})`);

            res.status(201).json({ success: true, data: savedRegistration });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    /**
     * Update a registration.
     */
    async updateRegistration(req, res) {
        try {
            const updatedRegistration = await exhibitorRegistrationService.updateRegistration(req.params.id, req.body);

            if (updatedRegistration) {
                await logActivity(req, 'Updated', 'Exhibitor Bookings', `Updated booking: ${updatedRegistration.companyName} (${updatedRegistration.registrationId})`);
            }

            res.status(200).json({ success: true, data: updatedRegistration });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    /**
     * Delete a registration.
     */
    async deleteRegistration(req, res) {
        try {
            const registration = await exhibitorRegistrationService.getRegistrationById(req.params.id); // Need this method
            const result = await exhibitorRegistrationService.deleteRegistration(req.params.id);

            if (registration) {
                await logActivity(req, 'Deleted', 'Exhibitor Bookings', `Deleted booking: ${registration.companyName} (${registration.registrationId})`);
            }

            res.status(200).json({ success: true, message: 'Registration deleted successfully' });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    /**
     * Update KYC Documents (Admin or Exhibitor)
     */
    async updateKycDocs(req, res) {
        try {
            const ExhibitorRegistration = require('../models/ExhibitorRegistration');
            const update = {};

            if (req.files) {
                const fileFields = {
                    companyLogo: 'companyLogoUrl',
                    panCardFront: 'panCardFrontUrl',
                    panCardBack: 'panCardBackUrl',
                    aadhaarCardFront: 'aadhaarCardFrontUrl',
                    aadhaarCardBack: 'aadhaarCardBackUrl',
                    gstCertificate: 'gstCertificateUrl',
                    cancelledCheque: 'cancelledChequeUrl',
                    representativePhoto: 'representativePhotoUrl'
                };

                Object.keys(fileFields).forEach(field => {
                    if (req.files[field] && req.files[field][0]) {
                        update[fileFields[field]] = req.files[field][0].path;
                    }
                });
            }

            // Also merge any text body fields
            const allowed = ['website', 'address', 'city', 'state', 'country', 'pincode', 'landlineNo', 'fasciaName', 'gstNo', 'panNo', 'contact1', 'contact2'];
            allowed.forEach(key => {
                if (req.body[key] !== undefined) {
                    try {
                        const val = req.body[key];
                        if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
                            update[key] = JSON.parse(val);
                        } else {
                            update[key] = val;
                        }
                    } catch (e) {
                        update[key] = req.body[key];
                    }
                }
            });

            const updated = await ExhibitorRegistration.findByIdAndUpdate(
                req.params.id,
                { $set: update },
                { new: true }
            );

            if (!updated) return res.status(404).json({ success: false, message: 'Registration not found' });

            res.status(200).json({ success: true, message: 'KYC documents updated successfully', data: updated });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Delete a specific KYC document field
     */
    async deleteKycDoc(req, res) {
        try {
            const ExhibitorRegistration = require('../models/ExhibitorRegistration');
            const { id, field } = req.params;

            // Validate field name to prevent arbitrary updates
            const validFields = [
                'companyLogoUrl', 'panCardFrontUrl', 'panCardBackUrl',
                'aadhaarCardFrontUrl', 'aadhaarCardBackUrl', 'gstCertificateUrl',
                'cancelledChequeUrl', 'representativePhotoUrl'
            ];

            if (!validFields.includes(field)) {
                return res.status(400).json({ success: false, message: 'Invalid document field' });
            }

            const updated = await ExhibitorRegistration.findByIdAndUpdate(
                id,
                { $unset: { [field]: "" } },
                { new: true }
            );

            if (!updated) return res.status(404).json({ success: false, message: 'Registration not found' });

            res.status(200).json({ success: true, message: 'Document deleted successfully', data: updated });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * BULK CLEANUP: Resets all KYC document fields for ALL registrations
     */
    async cleanupAllKycDocs(req, res) {
        try {
            const ExhibitorRegistration = require('../models/ExhibitorRegistration');
            const fieldsToReset = {
                companyLogoUrl: "",
                panCardFrontUrl: "",
                panCardBackUrl: "",
                aadhaarCardFrontUrl: "",
                aadhaarCardBackUrl: "",
                gstCertificateUrl: "",
                cancelledChequeUrl: "",
                representativePhotoUrl: "",
                companyLogo: "", // old field if any
                panFrontUrl: "", // old field if any
                panBackUrl: "", // old field if any
                aadhaarFrontUrl: "", // old field if any
                aadhaarBackUrl: "" // old field if any
            };

            const result = await ExhibitorRegistration.updateMany(
                {},
                { $set: fieldsToReset }
            );

            res.status(200).json({
                success: true,
                message: `Bulk cleanup successful. Reset ${result.modifiedCount} registrations.`,
                details: result
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Add a special document
     */
    async addSpecialDoc(req, res) {
        try {
            const ExhibitorRegistration = require('../models/ExhibitorRegistration');
            const { id } = req.params;
            const { label } = req.body;
            
            if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
            if (!label) return res.status(400).json({ success: false, message: 'Label is required' });

            const updated = await ExhibitorRegistration.findByIdAndUpdate(
                id,
                { $push: { specialDocuments: { label, url: req.file.path } } },
                { new: true }
            );

            if (!updated) return res.status(404).json({ success: false, message: 'Registration not found' });

            res.status(200).json({ success: true, message: 'Special document added', data: updated.specialDocuments });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Delete a special document
     */
    async deleteSpecialDoc(req, res) {
        try {
            const ExhibitorRegistration = require('../models/ExhibitorRegistration');
            const { id, docId } = req.params;

            const updated = await ExhibitorRegistration.findByIdAndUpdate(
                id,
                { $pull: { specialDocuments: { _id: docId } } },
                { new: true }
            );

            if (!updated) return res.status(404).json({ success: false, message: 'Registration not found' });

            res.status(200).json({ success: true, message: 'Special document deleted', data: updated.specialDocuments });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new ExhibitorRegistrationController();
