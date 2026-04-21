const PsmAnnexureC = require('../models/psm_reports/PsmAnnexureC');
const PsmAnnexureD = require('../models/psm_reports/PsmAnnexureD');
const PsmDeclaration = require('../models/psm_reports/PsmDeclaration');
const PsmFeedbackReport = require('../models/psm_reports/PsmFeedbackReport');
const PsmUndertaking = require('../models/psm_reports/PsmUndertaking');
const PsmPreReceipt = require('../models/psm_reports/PsmPreReceipt');
const PsmMandateForm = require('../models/psm_reports/PsmMandateForm.js');
const PsmPfmsDetails = require('../models/psm_reports/PsmPfmsDetails');

const models = {
    'annexure-c': PsmAnnexureC,
    'annexure-d': PsmAnnexureD,
    'declaration': PsmDeclaration,
    'feedback-report': PsmFeedbackReport,
    'undertaking': PsmUndertaking,
    'pre-receipt': PsmPreReceipt,
    'mandate-form': PsmMandateForm,
    'pfms-details': PsmPfmsDetails,
};

class PsmClaimController {
    async saveReport(req, res) {
        try {
            const { type } = req.params;
            const Model = models[type];
            if (!Model) return res.status(400).json({ success: false, message: 'Invalid report type' });

            const { id } = req.body; // If id exists, update
            const data = { ...req.body, exhibitorId: req.user?.id || req.body.exhibitorId };

            let saved;
            if (id) {
                saved = await Model.findByIdAndUpdate(id, data, { new: true });
            } else {
                saved = await new Model(data).save();
            }

            res.status(200).json({ success: true, data: saved });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getAllReports(req, res) {
        try {
            const exhibitorId = req.user?.id;
            const allResults = await Promise.all(
                Object.entries(models).map(async ([type, Model]) => {
                    const reports = await Model.find({ exhibitorId }).sort({ createdAt: -1 });
                    return reports.map(r => ({ ...r.toObject(), reportType: type }));
                })
            );

            const flattened = allResults.flat().sort((a, b) => b.createdAt - a.createdAt);
            res.status(200).json({ success: true, data: flattened });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getReportById(req, res) {
        try {
            const { type, id } = req.params;
            const Model = models[type];
            if (!Model) return res.status(400).json({ success: false, message: 'Invalid report type' });

            const report = await Model.findById(id);
            if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

            res.status(200).json({ success: true, data: report });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async deleteReport(req, res) {
        try {
            const { type, id } = req.params;
            const Model = models[type];
            if (!Model) return res.status(400).json({ success: false, message: 'Invalid report type' });

            await Model.findByIdAndDelete(id);
            res.status(200).json({ success: true, message: 'Report deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new PsmClaimController();
