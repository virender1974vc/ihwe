const StallProduct = require('../models/StallProduct');
const StallProductEnquiry = require('../models/StallProductEnquiry');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const fs = require('fs');
const path = require('path');
const deleteFile = (filePath) => {
    const abs = path.join(__dirname, '..', filePath);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
};
const getTargetExhibitorId = (req) => req.body?.regId || req.query?.regId || req.user.id;

exports.getMyProducts = async (req, res) => {
    try {
        const exhibitorId = getTargetExhibitorId(req);
        const products = await StallProduct.find({ exhibitorId }).sort({ createdAt: -1 });
        res.json({ success: true, data: products });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.addProduct = async (req, res) => {
    try {
        const exhibitorId = getTargetExhibitorId(req);
        const { name, description, category, tags, price, priceUnit, moq } = req.body;
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
exports.updateProduct = async (req, res) => {
    try {
        const exhibitorId = getTargetExhibitorId(req);
        const product = await StallProduct.findOne({ _id: req.params.id, exhibitorId });
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
        const exhibitorId = getTargetExhibitorId(req);
        const product = await StallProduct.findOne({ _id: req.params.id, exhibitorId });
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
        const exhibitorId = getTargetExhibitorId(req);
        const product = await StallProduct.findOne({ _id: req.params.id, exhibitorId });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        const enquiries = await StallProductEnquiry.find({ productId: req.params.id }).sort({ createdAt: -1 });
        res.json({ success: true, data: enquiries });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getAnalytics = async (req, res) => {
    try {
        const exhibitorId = getTargetExhibitorId(req);
        const products = await StallProduct.find({ exhibitorId })
            .select('name views enquiryCount images isActive createdAt')
            .sort({ views: -1 });

        const totalViews = products.reduce((s, p) => s + p.views, 0);
        const totalEnquiries = products.reduce((s, p) => s + p.enquiryCount, 0);
        const topProduct = products[0] || null;
        const recentEnquiries = await StallProductEnquiry.find({ exhibitorId })
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
const getExhibitorsWithProductsAdmin = async (req, res) => {
    try {
        const productStats = await StallProduct.aggregate([
            {
                $group: {
                    _id: '$exhibitorId',
                    productCount: { $sum: 1 },
                    totalViews: { $sum: '$views' },
                    totalEnquiries: { $sum: '$enquiryCount' },
                    latestProductAt: { $max: '$createdAt' }
                }
            },
            { $sort: { latestProductAt: -1 } }
        ]);

        const exhibitorIds = productStats.map(item => item._id).filter(Boolean);
        const exhibitors = await ExhibitorRegistration.find({ _id: { $in: exhibitorIds } })
            .select('exhibitorName city country contact1 companyLogoUrl registrationId sellerSubscription isSeller sellerStatus');

        const exhibitorById = new Map(exhibitors.map(exhibitor => [String(exhibitor._id), exhibitor]));
        const data = productStats
            .map(stat => {
                const exhibitor = exhibitorById.get(String(stat._id));
                if (!exhibitor) return null;
                return {
                    ...exhibitor.toObject(),
                    productCount: stat.productCount,
                    totalViews: stat.totalViews,
                    totalEnquiries: stat.totalEnquiries,
                    latestProductAt: stat.latestProductAt
                };
            })
            .filter(Boolean);

        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

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
    getExhibitorsWithProductsAdmin,
    getExhibitorProductsAdmin,
    getExhibitorAnalyticsAdmin,
    deleteProductAdmin,
    addProductAdmin
};
