const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const blogsController = require('../controllers/blogsController');
const createStorage = (destPath) => multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(destPath)) {
            fs.mkdirSync(destPath, { recursive: true });
        }
        cb(null, destPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${path.basename(destPath)}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const blogUpload = multer({ storage: createStorage('uploads/blogs') }).fields([
    { name: 'image', maxCount: 1 },
    { name: 'ogImage', maxCount: 1 }
]);

const expertUpload = multer({ storage: createStorage('uploads/experts') }).single('image');
const mediaUpload = multer({ storage: createStorage('uploads/media') }).single('file');

/**
 * Public Routes
 */
router.get('/', (req, res) => blogsController.getAllBlogs(req, res));
router.get('/expert-insights', (req, res) => blogsController.getExpertInsights(req, res));
router.get('/media-resources', (req, res) => blogsController.getMediaResources(req, res));
router.get('/settings', (req, res) => blogsController.getSettings(req, res));
router.get('/:idOrSlug', (req, res) => blogsController.getBlogByIdOrSlug(req, res));
router.post('/subscribe', (req, res) => blogsController.subscribeToNewsletter(req, res));
router.post('/', blogUpload, (req, res) => blogsController.createBlog(req, res));
router.patch('/:id', blogUpload, (req, res) => blogsController.updateBlog(req, res));
router.delete('/:id', (req, res) => blogsController.deleteBlog(req, res));
router.post('/experts', expertUpload, (req, res) => blogsController.createExpertInsight(req, res));
router.patch('/experts/:id', expertUpload, (req, res) => blogsController.updateExpertInsight(req, res));
router.delete('/experts/:id', (req, res) => blogsController.deleteExpertInsight(req, res));

// Media Resources CRUD
router.post('/resources', mediaUpload, (req, res) => blogsController.createMediaResource(req, res));
router.patch('/resources/:id', mediaUpload, (req, res) => blogsController.updateMediaResource(req, res));
router.delete('/resources/:id', (req, res) => blogsController.deleteMediaResource(req, res));

// Newsletter Management
router.get('/admin/subscribers', (req, res) => blogsController.getSubscribers(req, res));
router.delete('/admin/subscribers/:id', (req, res) => blogsController.deleteSubscriber(req, res));

// Settings
router.patch('/admin/settings', (req, res) => blogsController.updateSettings(req, res));

module.exports = router;
