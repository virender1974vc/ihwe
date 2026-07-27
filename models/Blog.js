const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    h1Title: { type: String }, // Hero Title (H1 for SEO)
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true },
    categoryIcon: { type: String, default: 'Layers' }, // Store icon name
    readTime: { type: String, default: '5 min read' },
    image: { type: String, required: true },
    imageAlt: { type: String },
    status: { type: String, enum: ['published', 'draft', 'archived'], default: 'draft' },
    featured: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    viewsCount: { type: Number, default: 0 },
    author: {
        name: { type: String, default: 'IHWE Editorial Team' },
        role: { type: String, default: 'Health Journalist' },
        image: { type: String }
    },
    tags: [{ type: String }],
    date: { type: Date, default: Date.now },

    // SEO Metadata
    metaTitle: { type: String },
    metaDescription: { type: String },
    metaKeywords: { type: String },
    canonicalTag: { type: String },
    schemaMarkup: { type: String },
    openGraphTags: { type: String },

    // Social Sharing
    ogTitle: { type: String },
    ogDescription: { type: String },
    ogImage: { type: String },
    updatedBy: { type: String, default: 'System' }
}, { timestamps: true });


module.exports = mongoose.model('Blog', blogSchema);
