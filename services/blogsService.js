const Blog = require('../models/Blog');
const mongoose = require('mongoose');

/**
 * Service to handle Blog operations.
 */
class BlogsService {
    /**
     * Get all blogs.
     */
    async getAllBlogs() {
        return await Blog.find().sort({ date: -1 });
    }

    /**
     * Get single blog by ID or Slug.
     */
    async getBlogByIdOrSlug(idOrSlug) {
        let blog;
        if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
            blog = await Blog.findById(idOrSlug);
        } else {
            blog = await Blog.findOne({ slug: idOrSlug });
        }
        if (!blog) throw { status: 404, message: 'Blog not found' };
        return blog;
    }

    /**
     * Create a new blog.
     */
    async createBlog(data) {
        const newBlog = new Blog(data);
        return await newBlog.save();
    }

    /**
     * Update a blog.
     */
    async updateBlog(id, data) {
        const updated = await Blog.findByIdAndUpdate(id, data, { new: true });
        if (!updated) throw { status: 404, message: 'Blog not found' };
        return updated;
    }

    /**
     * Delete a blog.
     */
    async deleteBlog(id) {
        const blog = await Blog.findByIdAndDelete(id);
        if (!blog) throw { status: 404, message: 'Blog not found' };
        return blog;
    }
}

module.exports = new BlogsService();
