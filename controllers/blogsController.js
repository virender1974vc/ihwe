const blogsService = require('../services/blogsService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle Blog requests.
 */
class BlogsController {
    /**
     * Blog Methods
     */
    async getAllBlogs(req, res) {
        try {
            const data = await blogsService.getAllBlogs(req.query);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getBlogByIdOrSlug(req, res) {
        try {
            const data = await blogsService.getBlogByIdOrSlug(req.params.idOrSlug);
            res.json({ success: true, data });
        } catch (error) {
            res.status(error.status || 500).json({ success: false, message: error.message });
        }
    }

    async createBlog(req, res) {
        try {
            const data = req.body;
            if (!req.files || !req.files['image']) {
                return res.status(400).json({ success: false, message: 'Main image is required' });
            }

            const blogData = {
                ...data,
                featured: data.featured === 'true' || data.featured === true,
                isTrending: data.isTrending === 'true' || data.isTrending === true,
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

    async updateBlog(req, res) {
        try {
            const data = req.body;
            const updateData = { ...data };

            if (data.featured !== undefined) {
                updateData.featured = data.featured === 'true' || data.featured === true;
            }
            if (data.isTrending !== undefined) {
                updateData.isTrending = data.isTrending === 'true' || data.isTrending === true;
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

    async deleteBlog(req, res) {
        try {
            await blogsService.deleteBlog(req.params.id);
            await logActivity(req, 'Deleted', 'Blogs', `Deleted blog ID: ${req.params.id}`);
            res.json({ success: true, message: 'Blog deleted successfully' });
        } catch (error) {
            res.status(error.status || 500).json({ success: false, message: error.message });
        }
    }

    /**
     * Expert Insight Methods
     */
    async getExpertInsights(req, res) {
        try {
            const data = await blogsService.getExpertInsights();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async createExpertInsight(req, res) {
        try {
            const data = req.body;
            if (req.file) {
                data.image = `/uploads/experts/${req.file.filename}`;
            }
            const data_res = await blogsService.createExpertInsight(data);
            await logActivity(req, 'Created', 'ExpertInsights', `Added expert: ${data.name}`);
            res.status(201).json({ success: true, data: data_res });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateExpertInsight(req, res) {
        try {
            const data = req.body;
            if (req.file) {
                data.image = `/uploads/experts/${req.file.filename}`;
            }
            const data_res = await blogsService.updateExpertInsight(req.params.id, data);
            await logActivity(req, 'Updated', 'ExpertInsights', `Updated expert: ${data.name || req.params.id}`);
            res.json({ success: true, data: data_res });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async deleteExpertInsight(req, res) {
        try {
            await blogsService.deleteExpertInsight(req.params.id);
            await logActivity(req, 'Deleted', 'ExpertInsights', `Deleted expert ID: ${req.params.id}`);
            res.json({ success: true, message: 'Expert Insight deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Media Resource Methods
     */
    async getMediaResources(req, res) {
        try {
            const data = await blogsService.getMediaResources();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async createMediaResource(req, res) {
        try {
            const data = req.body;
            if (req.file) {
                data.link = `/uploads/media/${req.file.filename}`;
            }
            const data_res = await blogsService.createMediaResource(data);
            await logActivity(req, 'Created', 'MediaResources', `Added resource: ${data.title}`);
            res.status(201).json({ success: true, data: data_res });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateMediaResource(req, res) {
        try {
            const data = req.body;
            if (req.file) {
                data.link = `/uploads/media/${req.file.filename}`;
            }
            const data_res = await blogsService.updateMediaResource(req.params.id, data);
            await logActivity(req, 'Updated', 'MediaResources', `Updated resource: ${data.title || req.params.id}`);
            res.json({ success: true, data: data_res });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async deleteMediaResource(req, res) {
        try {
            await blogsService.deleteMediaResource(req.params.id);
            await logActivity(req, 'Deleted', 'MediaResources', `Deleted resource ID: ${req.params.id}`);
            res.json({ success: true, message: 'Resource deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Newsletter Methods
     */
    async subscribeToNewsletter(req, res) {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
            await blogsService.subscribeToNewsletter(email);
            res.json({ success: true, message: 'Subscribed successfully' });
        } catch (error) {
            res.status(error.status || 500).json({ success: false, message: error.message });
        }
    }

    async getSubscribers(req, res) {
        try {
            const data = await blogsService.getSubscribers();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async deleteSubscriber(req, res) {
        try {
            await blogsService.deleteSubscriber(req.params.id);
            res.json({ success: true, message: 'Subscriber removed' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Settings
     */
    async getSettings(req, res) {
        try {
            const data = await blogsService.getSettings();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateSettings(req, res) {
        try {
            const data = await blogsService.updateSettings(req.body);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new BlogsController();
