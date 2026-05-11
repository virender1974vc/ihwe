const MsmePmsScheme = require('../models/MsmePmsScheme');
const MsmePmsPage = require('../models/MsmePmsPage');

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
            const applications = await MsmePmsScheme.find({ is_lead: false }).sort({ createdAt: -1 });
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
            const { status, is_lead } = req.body;
            const updateFields = {};
            if (status !== undefined) updateFields.status = status;
            if (is_lead !== undefined) updateFields.is_lead = is_lead;

            const updatedApplication = await MsmePmsScheme.findByIdAndUpdate(
                req.params.id,
                updateFields,
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

    async getPageContent(req, res) {
        try {
            let page = await MsmePmsPage.findOne();
            if (!page) {
                page = new MsmePmsPage({
                    stats: [
                        { img: "/msmepmsscheme/global.png", val: "1,000+", label: "GLOBAL BUYERS" },
                        { img: "/msmepmsscheme/exhibitors.png", val: "150+", label: "EXHIBITORS" },
                        { img: "/msmepmsscheme/visitors.png", val: "8,000+", label: "VISITORS/ DELEGATES" },
                        { img: "/msmepmsscheme/conference.png", val: "18+", label: "CONFERENCE SESSIONS" },
                        { img: "/msmepmsscheme/businessOpportunities.png", val: "3 DAYS", label: "OF BUSINESS OPPORTUNITIES" },
                        { img: "/msmepmsscheme/networkevents.png", val: "MULTIPLE", label: "NETWORKING EVENTS" },
                    ],
                    footerStats: [
                        { img: "/msmepmsscheme/global1.png", val: "1,000+", label: "GLOBAL BUYERS" },
                        { img: "/msmepmsscheme/exhibitors.png", val: "150+", label: "EXHIBITORS" },
                        { img: "/msmepmsscheme/visitors.png", val: "8,000+", label: "VISITORS/ DELEGATES" },
                        { img: "/msmepmsscheme/conference.png", val: "18+", label: "CONFERENCE SESSIONS" },
                        { img: "/msmepmsscheme/businessOpportunities1.png", val: "3 DAYS", label: "OF BUSINESS OPPORTUNITIES" },
                    ],
                    benefits: [
                        { img: "/msmepmsscheme/reimbursement.png", title: "Up to ₹1.5 Lakh* Reimbursement", desc: "Subsidy on stall booking & participation cost" },
                        { img: "/msmepmsscheme/reducedCost.png", title: "Reduced Cost", desc: "Lower financial burden for market expansion" },
                        { img: "/msmepmsscheme/marketexposure.png", title: "Market Exposure", desc: "Showcase your products to national & international buyers" },
                        { img: "/msmepmsscheme/businessgrowth.png", title: "Business Growth", desc: "Generate leads & expand your network" },
                        { img: "/msmepmsscheme/govsupport.png", title: "Government Support", desc: "Exhibit with the backing of Ministry of MSME" },
                        { img: "/msmepmsscheme/brandvisibility.png", title: "Brand Visibility", desc: "Enhance brand credibility and recognition" },
                    ]
                });
                await page.save();
            }
            res.status(200).json({ success: true, data: page });
        } catch (error) {
            console.error('Error fetching MSME PMS Page content:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }

    async updatePageContent(req, res) {
        try {
            let page = await MsmePmsPage.findOne();
            if (!page) {
                page = new MsmePmsPage(req.body);
            } else {
                Object.assign(page, req.body);
            }
            await page.save();
            res.status(200).json({ success: true, message: 'Page content updated successfully', data: page });
        } catch (error) {
            console.error('Error updating MSME PMS Page content:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }
}

module.exports = new MsmePmsSchemeController();
