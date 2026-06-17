const ClientDocument = require("../models/ClientDocument");
const cloudinary = require('cloudinary').v2;

// Upload or update a document
exports.uploadClientDocument = async (req, res) => {
    try {
        const { client_id, document_name, category, uploaded_by } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const file_url = req.file.path;

        // Extract size in MB
        const sizeInMB = (req.file.size / (1024 * 1024)).toFixed(1) + " MB";

        // Extract file type (extension)
        const originalName = req.file.originalname || req.file.name || "unknown.pdf";
        const file_type = originalName.split('.').pop().toUpperCase();

        const updateData = {
            category,
            file_url,
            file_type,
            size: sizeInMB,
            status: "Pending", // Reset to pending on re-upload
            uploaded_by: uploaded_by || "admin",
            created_by: uploaded_by || "admin"
        };

        // Use findOneAndUpdate with upsert to replace existing doc of the same type for the client
        const document = await ClientDocument.findOneAndUpdate(
            { client_id, document_name },
            {
                $set: updateData,
                $push: {
                    history: {
                        action: "Document Uploaded",
                        author: uploaded_by || "admin",
                        timestamp: Date.now()
                    }
                }
            },
            { new: true, upsert: true }
        );

        res.status(201).json(document);
    } catch (error) {
        res.status(500).json({ message: "Error uploading document", error: error.message });
    }
};

// Get all documents for a client
exports.getClientDocuments = async (req, res) => {
    try {
        const documents = await ClientDocument.find({ client_id: req.params.client_id }).sort({ added: -1 }).lean();
        res.status(200).json(documents);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch client documents", error: error.message });
    }
};

// Update document status
exports.updateDocumentStatus = async (req, res) => {
    try {
        const { status, author } = req.body;
        const document = await ClientDocument.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        document.status = status;
        document.history.push({
            action: `Status changed to ${status}`,
            author: author || "admin",
            timestamp: Date.now()
        });

        await document.save();
        res.status(200).json(document);
    } catch (error) {
        res.status(500).json({ message: "Error updating status", error: error.message });
    }
};

// Add comment to document
exports.addDocumentComment = async (req, res) => {
    try {
        const { text, author } = req.body;
        const document = await ClientDocument.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        if (!text) {
            return res.status(400).json({ message: "Comment text is required" });
        }

        document.comments.push({
            text,
            author: author || "admin",
            timestamp: Date.now()
        });

        await document.save();
        res.status(200).json(document);
    } catch (error) {
        res.status(500).json({ message: "Error adding comment", error: error.message });
    }
};
// Delete document
exports.deleteClientDocument = async (req, res) => {
    try {
        const document = await ClientDocument.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        // Delete from Cloudinary
        if (document.file_url && document.file_url.includes('cloudinary.com')) {
            try {
                const urlParts = document.file_url.split('/upload/');
                if (urlParts.length > 1) {
                    let publicId = urlParts[1];
                    if (publicId.match(/^v\d+\//)) {
                        publicId = publicId.replace(/^v\d+\//, '');
                    }
                    publicId = publicId.substring(0, publicId.lastIndexOf('.')) || publicId;

                    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' }).catch(() => { });
                    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }).catch(() => { });
                }
            } catch (cloudErr) {
                console.error("Cloudinary deletion error:", cloudErr);
            }
        }

        await ClientDocument.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Document deleted successfully", id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: "Error deleting document", error: error.message });
    }
};

// Proxy download for Cloudinary files to avoid CORS
exports.downloadProxy = async (req, res) => {
    try {
        const { url, download } = req.query;
        if (!url) {
            return res.status(400).json({ message: "URL is required" });
        }

        let targetUrl = url;

        if (url.includes('cloudinary.com')) {
            const urlParts = url.split('/upload/');
            if (urlParts.length > 1) {
                let publicIdWithExt = urlParts[1];
                // Remove version
                if (publicIdWithExt.match(/^v\d+\//)) {
                    publicIdWithExt = publicIdWithExt.replace(/^v\d+\//, '');
                }
                const isRaw = url.includes('/raw/upload/');

                const cloudinary = require('cloudinary').v2;
                
                // For raw files, the public_id must include the extension and format should be empty.
                // For image/auto files, the public_id should not include the extension.
                const format = (!isRaw && publicIdWithExt.includes('.')) ? publicIdWithExt.split('.').pop() : '';
                const publicId = (!isRaw && publicIdWithExt.includes('.')) ? publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.')) : publicIdWithExt;

                // For Strict Delivery, we must use the private_download_url to access the file securely.
                // We use type 'upload' because the files were uploaded as 'upload' but are blocked by strict delivery.
                targetUrl = cloudinary.utils.private_download_url(
                    publicId,
                    format,
                    {
                        resource_type: isRaw ? 'raw' : 'image',
                        type: 'upload'
                    }
                );
            }
        }

        // Fallback or Proxy for Cloudinary URLs
        const axios = require('axios');
        const response = await axios({
            url: targetUrl,
            method: 'GET',
            responseType: 'stream'
        });

        const contentType = response.headers['content-type'];
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }

        if (download === 'true') {
            const fileName = url.split('/').pop().split('?')[0] || 'document';
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        } else {
            res.setHeader('Content-Disposition', 'inline');
        }

        response.data.pipe(res);
    } catch (error) {
        console.error("Proxy download error:", error.message);
        res.status(500).json({ message: "Error downloading file", error: error.message });
    }
};
