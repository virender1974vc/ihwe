const blogsService = require('../services/blogsService');
const { logActivity } = require('../utils/logger');


/**
 * Controller to handle Blog requests.
 */
class BlogsController {
    /**
     * Get all blogs.
     */
    async getAllBlogs(req, res) {
        try {
            const data = await blogsService.getAllBlogs();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get single blog.
     */
    async getBlogByIdOrSlug(req, res) {
        try {
            const data = await blogsService.getBlogByIdOrSlug(req.params.idOrSlug);
            res.json({ success: true, data });
        } catch (error) {
            res.status(error.status || 500).json({ success: false, message: error.message });
        }
    }

    /**
     * Create new blog.
     */
    async createBlog(req, res) {
        try {
            const data = req.body;
            if (!req.files || !req.files['image']) {
                return res.status(400).json({ success: false, message: 'Main image is required' });
            }

            const blogData = {
                ...data,
                featured: data.featured === 'true' || data.featured === true,
                image: `/uploads/blogs/${req.files['image'][0].filename}`,
                ogImage: req.files['ogImage'] ? `/uploads/blogs/${req.files['ogImage'][0].filename}` : '',
                updatedBy: req.user?.username || 'System'
            };

            const data_res = await blogsService.createBlog(blogData);
            await logActivity(req, 'Created', 'Blogs', `Published new blog: ${data.title}`);
            res.status(201).json({ success: true, data: data_res });
        } catch (error) {

            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update blog.
     */
    async updateBlog(req, res) {
        try {
            const data = req.body;
            const updateData = { ...data };

            if (data.featured !== undefined) {
                updateData.featured = data.featured === 'true' || data.featured === true;
            }

            if (req.files && req.files['image']) {
                updateData.image = `/uploads/blogs/${req.files['image'][0].filename}`;
            }
            if (req.files && req.files['ogImage']) {
                updateData.ogImage = `/uploads/blogs/${req.files['ogImage'][0].filename}`;
            }

            updateData.updatedBy = req.user?.username || 'System';

            const data_res = await blogsService.updateBlog(req.params.id, updateData);
            await logActivity(req, 'Updated', 'Blogs', `Updated blog: ${data.title || 'ID: ' + req.params.id}`);
            res.json({ success: true, data: data_res });
        } catch (error) {

            res.status(error.status || 500).json({ success: false, message: error.message });
        }
    }

    /**
     * Delete blog.
     */
    async deleteBlog(req, res) {
        try {
            await blogsService.deleteBlog(req.params.id);
            await logActivity(req, 'Deleted', 'Blogs', `Deleted blog ID: ${req.params.id}`);
            res.json({ success: true, message: 'Blog deleted successfully' });
        } catch (error) {

            res.status(error.status || 500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new BlogsController();
