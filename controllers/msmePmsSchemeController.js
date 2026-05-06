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
}

module.exports = new MsmePmsSchemeController();
