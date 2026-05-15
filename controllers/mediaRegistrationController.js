const PressRelease = require('../models/PressRelease');
const MediaVideo = require('../models/MediaVideo');
const MediaCoverage = require('../models/MediaCoverage');
const MediaPartner = require('../models/MediaPartner');
const MediaResource = require('../models/MediaResource');
const MediaBannerLogo = require('../models/MediaBannerLogo');
const MediaBannerSettings = require('../models/MediaBannerSettings');
const ContactEnquiry = require('../models/ContactEnquiry');
exports.getMediaPageData = async (req, res) => {
    try {
        const [pressReleases, videos, coverages, partners] = await Promise.all([
            PressRelease.find({ isActive: true }).sort({ order: 1, createdAt: -1 }),
            MediaVideo.find({ isActive: true }).sort({ order: 1, createdAt: -1 }),
            MediaCoverage.find({ isActive: true }).sort({ order: 1, createdAt: -1 }),
            MediaPartner.find({ isActive: true }).sort({ order: 1, createdAt: -1 })
        ]);
        const resources = await MediaResource.find({ isActive: true }).sort({ order: 1 });
        const bannerLogos = await MediaBannerLogo.find({ isActive: true }).sort({ order: 1 });
        let bannerSettings = await MediaBannerSettings.findOne();
        
        if (!bannerSettings) {
            bannerSettings = await MediaBannerSettings.create({});
        }

        res.json({
            success: true,
            data: {
                coverages,
                partners,
                videos,
                pressReleases,
                resources,
                bannerLogos,
                bannerSettings
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.submitMediaEnquiry = async (req, res) => {
    try {
        const { name, organization, email, phone, message } = req.body;

        const newEnquiry = new ContactEnquiry({
            name,
            email,
            phone,
            message,
            organization,
            source: 'Media Registration Page'
        });

        await newEnquiry.save();

        res.status(201).json({
            success: true,
            message: "Media enquiry submitted successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
const createHandler = (Model) => async (req, res) => {
    try {
        const item = new Model(req.body);
        await item.save();
        res.status(201).json({ success: true, data: item });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getHandler = (Model) => async (req, res) => {
    try {
        const items = await Model.find().sort({ order: 1, createdAt: -1 });
        res.status(200).json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateHandler = (Model) => async (req, res) => {
    try {
        const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, data: item });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteHandler = (Model) => async (req, res) => {
    try {
        await Model.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Press Releases
exports.getPressReleases = getHandler(PressRelease);
exports.createPressRelease = createHandler(PressRelease);
exports.updatePressRelease = updateHandler(PressRelease);
exports.deletePressRelease = deleteHandler(PressRelease);

// Videos
exports.getVideos = getHandler(MediaVideo);
exports.createVideo = createHandler(MediaVideo);
exports.updateVideo = updateHandler(MediaVideo);
exports.deleteVideo = deleteHandler(MediaVideo);

// Coverage
exports.getCoverage = getHandler(MediaCoverage);
exports.createCoverage = createHandler(MediaCoverage);
exports.updateCoverage = updateHandler(MediaCoverage);
exports.deleteCoverage = deleteHandler(MediaCoverage);

// Partners
exports.getPartners = getHandler(MediaPartner);
exports.createPartner = createHandler(MediaPartner);
exports.updatePartner = updateHandler(MediaPartner);
exports.deletePartner = deleteHandler(MediaPartner);

// Resources
exports.getResources = getHandler(MediaResource);
exports.createResource = createHandler(MediaResource);
exports.updateResource = updateHandler(MediaResource);
exports.deleteResource = deleteHandler(MediaResource);

// Banner Logos
exports.getBannerLogos = getHandler(MediaBannerLogo);
exports.createBannerLogo = createHandler(MediaBannerLogo);
exports.updateBannerLogo = updateHandler(MediaBannerLogo);
exports.deleteBannerLogo = deleteHandler(MediaBannerLogo);

// Banner Settings
exports.getBannerSettings = async (req, res) => {
    try {
        let settings = await MediaBannerSettings.findOne();
        if (!settings) settings = await MediaBannerSettings.create({});
        res.json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateBannerSettings = async (req, res) => {
    try {
        let settings = await MediaBannerSettings.findOne();
        if (settings) {
            settings = await MediaBannerSettings.findByIdAndUpdate(settings._id, req.body, { new: true });
        } else {
            settings = await MediaBannerSettings.create(req.body);
        }
        res.json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

