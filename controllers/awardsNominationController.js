const awardsNominationService = require('../services/awardsNominationService');
const { logActivity } = require('../utils/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── Multer setup for nomination documents ──
const uploadDir = path.join(__dirname, '../uploads/nominations');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|doc|docx|jpg|jpeg|png|mp4|mov|avi|webm/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('Invalid file type'));
  }
}).single('file');

class AwardsNominationController {

  // POST /api/awards-nomination/upload
  uploadFile(req, res) {
    upload(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
      const fileUrl = `/uploads/nominations/${req.file.filename}`;
      res.json({ success: true, url: fileUrl, originalName: req.file.originalname });
    });
  }

  // POST /api/awards-nomination
  async submitNomination(req, res) {
    try {
      const data = await awardsNominationService.submitNomination(req.body);
      res.status(201).json({ success: true, message: 'Nomination submitted successfully', data });
    } catch (error) {
      console.error('[Awards Nomination] Submit error:', error);
      res.status(error.status || 500).json({ success: false, message: error.message || 'Server Error' });
    }
  }

  // GET /api/awards-nomination
  async getAllNominations(req, res) {
    try {
      const filters = {
        status: req.query.status,
        awardCategory: req.query.awardCategory,
        applicantType: req.query.applicantType,
        search: req.query.search,
      };
      const result = await awardsNominationService.getAllNominations(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('[Awards Nomination] Fetch error:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  // GET /api/awards-nomination/:id
  async getNominationById(req, res) {
    try {
      const data = await awardsNominationService.getNominationById(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message || 'Server Error' });
    }
  }

  // PATCH /api/awards-nomination/:id/status
  async updateStatus(req, res) {
    try {
      const { status, adminRemarks } = req.body;
      const updatedBy = req.body.updatedBy || 'Admin';
      const data = await awardsNominationService.updateStatus(req.params.id, status, adminRemarks, updatedBy);
      await logActivity(req, 'Updated', 'Awards Nomination', `Status changed to ${status} for nomination ID: ${req.params.id}`);
      res.json({ success: true, message: 'Status updated successfully', data });
    } catch (error) {
      console.error('[Awards Nomination] Status update error:', error);
      res.status(error.status || 500).json({ success: false, message: error.message || 'Server Error' });
    }
  }

  // DELETE /api/awards-nomination/:id
  async deleteNomination(req, res) {
    try {
      await awardsNominationService.deleteNomination(req.params.id);
      await logActivity(req, 'Deleted', 'Awards Nomination', `Deleted nomination ID: ${req.params.id}`);
      res.json({ success: true, message: 'Nomination deleted successfully' });
    } catch (error) {
      console.error('[Awards Nomination] Delete error:', error);
      res.status(error.status || 500).json({ success: false, message: error.message || 'Server Error' });
    }
  }
}

module.exports = new AwardsNominationController();
