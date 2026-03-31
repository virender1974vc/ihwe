const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const clientController = require('../controllers/clientController');

// Storage for images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/clients';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Get all client data
router.get('/', (req, res) => clientController.getClientData(req, res));

// Update headings
router.post('/headings', (req, res) => clientController.updateHeadings(req, res));

// Add image card
router.post('/images', (req, res) => clientController.addImage(req, res));

// Update image card
router.put('/images/:imageId', (req, res) => clientController.updateImage(req, res));

// Delete image card
router.delete('/images/:imageId', (req, res) => clientController.deleteImage(req, res));

// Image upload
router.post('/upload', upload.single('image'), (req, res) => clientController.uploadImage(req, res));

module.exports = router;
