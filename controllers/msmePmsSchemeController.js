const MsmePmsScheme = require('../models/MsmePmsScheme');

class MsmePmsSchemeController {
    async submitApplication(req, res) {
        try {
            const {
                companyName,
                contactPerson,
                mobileNumber,
                emailId,
                udyamNumber,
                gstNumber,
                category,
                companyBrief
            } = req.body;

            const documents = req.files ? req.files.map(file => ({
                filename: file.originalname,
                path: file.path,
                mimetype: file.mimetype
            })) : [];

            const newClaim = new MsmePmsScheme({
                companyName,
                contactPerson,
                mobileNumber,
                emailId,
                udyamNumber,
                gstNumber,
                category,
                companyBrief,
                documents
            });

            await newClaim.save();

            res.status(201).json({ success: true, message: 'Application submitted successfully', data: newClaim });
        } catch (error) {
            console.error('Error saving public PMS claim:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }

    async getAllApplications(req, res) {
        try {
            const applications = await MsmePmsScheme.find().sort({ createdAt: -1 });
            res.status(200).json({ success: true, data: applications });
        } catch (error) {
            console.error('Error fetching MSME PMS applications:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }

    async getApplicationById(req, res) {
        try {
            const application = await MsmePmsScheme.findById(req.params.id);
            if (!application) {
                return res.status(404).json({ success: false, message: 'Application not found' });
            }
            res.status(200).json({ success: true, data: application });
        } catch (error) {
            console.error('Error fetching MSME PMS application by ID:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }

    async updateApplicationStatus(req, res) {
        try {
            const { status } = req.body;
            const updatedApplication = await MsmePmsScheme.findByIdAndUpdate(
                req.params.id,
                { status },
                { new: true }
            );
            if (!updatedApplication) {
                return res.status(404).json({ success: false, message: 'Application not found' });
            }
            res.status(200).json({ success: true, message: 'Status updated successfully', data: updatedApplication });
        } catch (error) {
            console.error('Error updating MSME PMS application status:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }

    async deleteApplication(req, res) {
        try {
            const deleted = await MsmePmsScheme.findByIdAndDelete(req.params.id);
            if (!deleted) {
                return res.status(404).json({ success: false, message: 'Application not found' });
            }
            res.status(200).json({ success: true, message: 'Application deleted successfully' });
        } catch (error) {
            console.error('Error deleting MSME PMS application:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }
}

module.exports = new MsmePmsSchemeController();
