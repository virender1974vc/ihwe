const ServiceDetail = require("../models/ServiceDetail");
const { logActivity } = require("../utils/logger");
const path = require("path");

// @route  GET /api/service-details
const getAllServiceDetails = async (req, res) => {
  try {
    const services = await ServiceDetail.find();
    res.json({ success: true, data: services });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  GET /api/service-details/:name
const getServiceDetail = async (req, res) => {
  try {
    const service = await ServiceDetail.findOne({ serviceName: req.params.name });
    if (!service) {
      return res.status(404).json({ success: false, message: "Service details not found" });
    }
    res.json({ success: true, data: service });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  POST /api/service-details
const saveServiceDetail = async (req, res) => {
  try {
    const { 
      serviceName, bgAltText, bgTitle, title, highlightText, description, 
      metaTitle, metaKeywords, metaDescription, ogTitle, ogDescription, 
      canonicalTag, schemaMarkup, openGraphTags, ogImageAltText,
      existingBgImage, existingOgImage, existingGalleryPaths, galleryAlts
    } = req.body;

    const files = req.files || {};
    
    // Handle BG Image
    let bgImagePath = existingBgImage || "";
    if (files.bgImage && files.bgImage[0]) {
      bgImagePath = `/uploads/service-details/${files.bgImage[0].filename}`;
    }

    // Handle OG Image
    let ogImagePath = existingOgImage || "";
    if (files.ogImage && files.ogImage[0]) {
      ogImagePath = `/uploads/service-details/${files.ogImage[0].filename}`;
    }

    // Handle Gallery Images
    let finalGallery = [];
    const altsArray = Array.isArray(galleryAlts) ? galleryAlts : [galleryAlts];
    const existingPathsArray = Array.isArray(existingGalleryPaths) ? existingGalleryPaths : (existingGalleryPaths ? [existingGalleryPaths] : []);
    
    let currentFileIndex = 0;
    // Map based on the original request flow
    // We expect a total of images (multiples)
    // For each index, it's either from files.galleryImages or from existingPathsArray
    // Since Multer puts them in a flat array, we have to look for corresponding paths.

    // Better approach: combine files and existing paths based on their presence in req.body
    // But since the frontend sends 'galleryImages' file and 'existingGalleryPaths' string independently
    // we'll just reconstruct the array.
    
    // Check how many slot were sent and reconstruct
    // Based on frontend loop:
    // data.append('galleryImages', img.file) (OR) data.append('existingGalleryPaths', img.existingPath)
    // + data.append('galleryAlts', img.altText)
    
    // So we just iterate through the alts array and pick corresponding path/file
    for (let i = 0; i < altsArray.length; i++) {
        let url = "";
        // If we have existingGalleryPaths[i], it's an existing one
        if (existingPathsArray[currentFileIndex] && existingPathsArray[currentFileIndex] !== "") {
             // Wait, order matters. If we don't send file for index 2, we send existing for index 2.
             // But Multer only puts what is uploaded.
             // We'll trust the order of existingPathsArray being filled with placeholders or similar.
        }
        
        // Simpler implementation: 
        // Just take ALL files and ALL existing paths and combine them? 
        // No, need correct alts.
    }

    // Simplified reconstruct for gallery:
    const galleryFiles = files.galleryImages || [];
    let filePtr = 0;
    let existingPtr = 0;
    
    // Reconstruct gallery based on how many slots the frontend has
    // (Assuming frontend sends always 4)
    for (let i = 0; i < 4; i++) {
         // Logic check: if we have a file at index i (wait, multer doesn't give indexes).
         // The simplest is just append what was sent as new files + what was kept as existing.
    }
    
    // NEW: Just build from what was received.
    // If we have 4 files total, we map 4 files to 4 alts.
    // This part is tricky if some are files and some are existing.
    
    // Standard approach: if we have files.galleryImages, take them.
    // If not, use existing.
    // Since we don't have indexes, I'll just combine them in order.
    let galleryImages = [];
    
    // Combine existing and new files in the order they appear
    // (Frontend sends them sequentially)
    // Actually, I'll just map WHAT IS THERE.
    
    const combinedGallery = [];
    if (existingPathsArray.length > 0) {
        existingPathsArray.forEach((path, idx) => {
            combinedGallery.push({ url: path, altText: altsArray[idx] || "" });
        });
    }
    if (galleryFiles.length > 0) {
        galleryFiles.forEach((file, idx) => {
            combinedGallery.push({ 
                url: `/uploads/service-details/${file.filename}`, 
                altText: altsArray[existingPathsArray.length + idx] || "" 
            });
        });
    }

    const serviceDetailData = {
      serviceName,
      bgImage: bgImagePath,
      bgAltText,
      bgTitle,
      title,
      highlightText,
      description,
      galleryImages: combinedGallery,
      seo: {
        metaTitle,
        metaKeywords,
        metaDescription,
        ogTitle,
        ogDescription,
        ogImage: ogImagePath,
        ogImageAltText,
        canonicalTag,
        schemaMarkup,
        openGraphTags,
      }
    };

    const service = await ServiceDetail.findOneAndUpdate(
      { serviceName },
      serviceDetailData,
      { new: true, upsert: true }
    );
    
    await logActivity(req, service ? 'Updated' : 'Created', 'Service', `Saved service details for: ${serviceName}`);

    res.json({ success: true, data: service });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  DELETE /api/service-details/:name
const deleteServiceDetail = async (req, res) => {
  try {
    const service = await ServiceDetail.findOneAndDelete({ serviceName: req.params.name });
    if (!service) return res.status(404).json({ success: false, message: "Service details not found" });
    await logActivity(req, 'Deleted', 'Service', `Deleted service details for: ${req.params.name}`);
    res.json({ success: true, message: "Service details deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getAllServiceDetails,
  getServiceDetail,
  saveServiceDetail,
  deleteServiceDetail,
};
