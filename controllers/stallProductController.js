const StallProduct = require('../models/StallProduct');
const StallProductEnquiry = require('../models/StallProductEnquiry');
const fs = require('fs');
const path = require('path');
const deleteFile = (filePath) => {
    const abs = path.join(__dirname, '..', filePath);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
};
exports.getMyProducts = async (req, res) => {
    try {
        const products = await StallProduct.find({ exhibitorId: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, data: products });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.addProduct = async (req, res) => {
    try {
        const { name, description, category, tags, price, priceUnit, moq } = req.body;
        const images = (req.files || []).map(f => `/uploads/stall-products/${f.filename}`);

        const product = await StallProduct.create({
            exhibitorId: req.user.id,
            name, description, category,
            tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean)) : [],
            price: Number(price) || 0,
            priceUnit: priceUnit || 'per piece',
            moq: moq || '',
            images,
        });

        res.status(201).json({ success: true, data: product });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
exports.updateProduct = async (req, res) => {
    try {
        const product = await StallProduct.findOne({ _id: req.params.id, exhibitorId: req.user.id });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        const { name, description, category, tags, price, priceUnit, moq, isActive, removeImages } = req.body;
        if (removeImages) {
            const toRemove = Array.isArray(removeImages) ? removeImages : [removeImages];
            toRemove.forEach(img => deleteFile(img));
            product.images = product.images.filter(img => !toRemove.includes(img));
        }
        const newImages = (req.files || []).map(f => `/uploads/stall-products/${f.filename}`);
        product.images = [...product.images, ...newImages];

        if (name !== undefined) product.name = name;
        if (description !== undefined) product.description = description;
        if (category !== undefined) product.category = category;
        if (tags !== undefined) product.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean);
        if (price !== undefined) product.price = Number(price);
        if (priceUnit !== undefined) product.priceUnit = priceUnit;
        if (moq !== undefined) product.moq = moq;
        if (isActive !== undefined) product.isActive = isActive === 'true' || isActive === true;

        await product.save();
        res.json({ success: true, data: product });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
exports.deleteProduct = async (req, res) => {
    try {
        const product = await StallProduct.findOne({ _id: req.params.id, exhibitorId: req.user.id });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        product.images.forEach(img => deleteFile(img));
        await product.deleteOne();
        res.json({ success: true, message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.recordView = async (req, res) => {
    try {
        await StallProduct.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.submitEnquiry = async (req, res) => {
    try {
        const product = await StallProduct.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        const { visitorName, visitorEmail, visitorPhone, message, source } = req.body;
        if (!visitorName) return res.status(400).json({ success: false, message: 'Name is required' });

        const enquiry = await StallProductEnquiry.create({
            productId: product._id,
            exhibitorId: product.exhibitorId,
            visitorName, visitorEmail, visitorPhone, message,
            source: source || 'web',
        });
        await StallProduct.findByIdAndUpdate(req.params.id, { $inc: { enquiryCount: 1 } });

        res.status(201).json({ success: true, data: enquiry });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getProductEnquiries = async (req, res) => {
    try {
        const product = await StallProduct.findOne({ _id: req.params.id, exhibitorId: req.user.id });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        const enquiries = await StallProductEnquiry.find({ productId: req.params.id }).sort({ createdAt: -1 });
        res.json({ success: true, data: enquiries });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getAnalytics = async (req, res) => {
    try {
        const products = await StallProduct.find({ exhibitorId: req.user.id })
            .select('name views enquiryCount images isActive createdAt')
            .sort({ views: -1 });

        const totalViews = products.reduce((s, p) => s + p.views, 0);
        const totalEnquiries = products.reduce((s, p) => s + p.enquiryCount, 0);
        const topProduct = products[0] || null;
        const recentEnquiries = await StallProductEnquiry.find({ exhibitorId: req.user.id })
            .populate('productId', 'name')
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            success: true,
            data: {
                totalProducts: products.length,
                activeProducts: products.filter(p => p.isActive).length,
                totalViews,
                totalEnquiries,
                topProduct,
                products,
                recentEnquiries,
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
// Admin specific controllers
const getExhibitorProductsAdmin = async (req, res) => {
    try {
        const { exhibitorId } = req.params;
        const products = await StallProduct.find({ exhibitorId }).sort({ createdAt: -1 });
        res.json({ success: true, data: products });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getExhibitorAnalyticsAdmin = async (req, res) => {
    try {
        const { exhibitorId } = req.params;
        const products = await StallProduct.find({ exhibitorId });
        const totalViews = products.reduce((s, p) => s + p.views, 0);
        const totalEnquiries = products.reduce((s, p) => s + p.enquiryCount, 0);
        res.json({
            success: true,
            data: {
                totalProducts: products.length,
                totalViews,
                totalEnquiries,
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const deleteProductAdmin = async (req, res) => {
    try {
        const product = await StallProduct.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        product.images.forEach(img => deleteFile(img));
        await product.deleteOne();
        res.json({ success: true, message: 'Product deleted by admin' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const addProductAdmin = async (req, res) => {
    try {
        const { exhibitorId, name, description, category, tags, price, priceUnit, moq } = req.body;
        const images = (req.files || []).map(f => `/uploads/stall-products/${f.filename}`);

        const product = await StallProduct.create({
            exhibitorId,
            name, description, category,
            tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean)) : [],
            price: Number(price) || 0,
            priceUnit: priceUnit || 'per piece',
            moq: moq || '',
            images,
        });

        res.status(201).json({ success: true, data: product });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports = {
    getMyProducts: exports.getMyProducts,
    addProduct: exports.addProduct,
    updateProduct: exports.updateProduct,
    deleteProduct: exports.deleteProduct,
    recordView: exports.recordView,
    submitEnquiry: exports.submitEnquiry,
    getProductEnquiries: exports.getProductEnquiries,
    getAnalytics: exports.getAnalytics,
    getExhibitorProductsAdmin,
    getExhibitorAnalyticsAdmin,
    deleteProductAdmin,
    addProductAdmin
};
