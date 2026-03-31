const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const blogsController = require('../controllers/blogsController');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/blogs';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `blog-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// Multi-file upload configuration
const blogUpload = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'ogImage', maxCount: 1 }
]);

// GET all blogs
router.get('/', (req, res) => blogsController.getAllBlogs(req, res));

// GET single blog by ID or Slug
router.get('/:idOrSlug', (req, res) => blogsController.getBlogByIdOrSlug(req, res));

// POST new blog
router.post('/', blogUpload, (req, res) => blogsController.createBlog(req, res));

// PATCH update blog
router.patch('/:id', blogUpload, (req, res) => blogsController.updateBlog(req, res));

// DELETE blog
router.delete('/:id', (req, res) => blogsController.deleteBlog(req, res));

module.exports = router;
