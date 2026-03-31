const express = require('express');
const router = express.Router();
const sitemapController = require('../controllers/sitemapController');

router.get('/', (req, res) => sitemapController.getSitemap(req, res));

module.exports = router;
