const Blog = require('../models/Blog');
const ExpertInsight = require('../models/ExpertInsight');
const MediaResource = require('../models/MediaResource');
const BlogSetting = require('../models/BlogSetting');
const NewsletterSubscription = require('../models/NewsletterSubscription');
const mongoose = require('mongoose');
class BlogsService {
    async getAllBlogs(filters = {}) {
        const query = {};
        if (filters.category && filters.category !== 'all') {
            query.category = { $regex: new RegExp(filters.category, 'i') };
        }
        if (filters.search) {
            query.$or = [
                { title: { $regex: new RegExp(filters.search, 'i') } },
                { excerpt: { $regex: new RegExp(filters.search, 'i') } }
            ];
        }
        return await Blog.find(query).sort({ date: -1 });
    }

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

    async createBlog(data) {
        const newBlog = new Blog(data);
        return await newBlog.save();
    }

    async updateBlog(id, data) {
        const updated = await Blog.findByIdAndUpdate(id, data, { returnDocument: 'after' });
        if (!updated) throw { status: 404, message: 'Blog not found' };
        return updated;
    }

    async deleteBlog(id) {
        const blog = await Blog.findByIdAndDelete(id);
        if (!blog) throw { status: 404, message: 'Blog not found' };
        return blog;
    }

    /**
     * Expert Insight Methods
     */
    async getExpertInsights() {
        return await ExpertInsight.find().sort({ createdAt: -1 });
    }

    async createExpertInsight(data) {
        const newItem = new ExpertInsight(data);
        return await newItem.save();
    }

    async updateExpertInsight(id, data) {
        const updated = await ExpertInsight.findByIdAndUpdate(id, data, { returnDocument: 'after' });
        if (!updated) throw { status: 404, message: 'Expert Insight not found' };
        return updated;
    }

    async deleteExpertInsight(id) {
        const item = await ExpertInsight.findByIdAndDelete(id);
        if (!item) throw { status: 404, message: 'Expert Insight not found' };
        return item;
    }

    /**
     * Media Resource Methods
     */
    async getMediaResources() {
        return await MediaResource.find().sort({ createdAt: -1 });
    }

    async createMediaResource(data) {
        const newItem = new MediaResource(data);
        return await newItem.save();
    }

    async updateMediaResource(id, data) {
        const updated = await MediaResource.findByIdAndUpdate(id, data, { returnDocument: 'after' });
        if (!updated) throw { status: 404, message: 'Media Resource not found' };
        return updated;
    }

    async deleteMediaResource(id) {
        const item = await MediaResource.findByIdAndDelete(id);
        if (!item) throw { status: 404, message: 'Media Resource not found' };
        return item;
    }

    /**
     * Newsletter Methods
     */
    async subscribeToNewsletter(email) {
        const existing = await NewsletterSubscription.findOne({ email });
        if (existing) {
            if (existing.status === 'unsubscribed') {
                existing.status = 'active';
                return await existing.save();
            }
            throw { status: 400, message: 'Email already subscribed' };
        }
        const newSub = new NewsletterSubscription({ email });
        return await newSub.save();
    }

    async getSubscribers() {
        return await NewsletterSubscription.find().sort({ subscribedAt: -1 });
    }

    async deleteSubscriber(id) {
        return await NewsletterSubscription.findByIdAndDelete(id);
    }

    /**
     * Settings
     */
    async getSettings() {
        let settings = await BlogSetting.findOne();
        if (!settings) {
            settings = await BlogSetting.create({});
        }
        return settings;
    }

    async updateSettings(data) {
        let settings = await BlogSetting.findOne();
        if (!settings) {
            settings = await BlogSetting.create(data);
        } else {
            settings = await BlogSetting.findByIdAndUpdate(settings._id, data, { returnDocument: 'after' });
        }
        return settings;
    }
}

module.exports = new BlogsService();
