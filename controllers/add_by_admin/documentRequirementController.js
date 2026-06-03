const DocumentRequirement = require("../../models/add_by_admin/DocumentRequirement");

// Get all document requirements
exports.getAllDocumentRequirements = async (req, res) => {
    try {
        const requirements = await DocumentRequirement.find().sort({ category: 1, order: 1, added: -1 });
        res.status(200).json(requirements);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch document requirements", error: error.message });
    }
};

// Get single document requirement
exports.getDocumentRequirementById = async (req, res) => {
    try {
        const requirement = await DocumentRequirement.findById(req.params.id);
        if (!requirement) {
            return res.status(404).json({ message: "Document requirement not found" });
        }
        res.status(200).json(requirement);
    } catch (error) {
        res.status(500).json({ message: "Error fetching document requirement", error: error.message });
    }
};

// Create a new document requirement
exports.createDocumentRequirement = async (req, res) => {
    try {
        const { document_name, category, order, status, added_by } = req.body;

        if (!document_name || !category) {
            return res.status(400).json({ message: "Document name and category are required" });
        }

        const newRequirement = new DocumentRequirement({
            document_name,
            category,
            order: order || 0,
            status: status || "Active",
            added_by: added_by || "admin"
        });

        const savedRequirement = await newRequirement.save();
        res.status(201).json(savedRequirement);
    } catch (error) {
        res.status(500).json({ message: "Error creating document requirement", error: error.message });
    }
};

// Update an existing document requirement
exports.updateDocumentRequirement = async (req, res) => {
    try {
        const { document_name, category, order, status, added_by } = req.body;
        const requirementId = req.params.id;

        const updatedRequirement = await DocumentRequirement.findByIdAndUpdate(
            requirementId,
            {
                document_name,
                category,
                order: order !== undefined ? order : 0,
                status,
                updated_by: added_by || "admin",
                updated: Date.now()
            },
            { new: true, runValidators: true }
        );

        if (!updatedRequirement) {
            return res.status(404).json({ message: "Document requirement not found" });
        }

        res.status(200).json(updatedRequirement);
    } catch (error) {
        res.status(500).json({ message: "Error updating document requirement", error: error.message });
    }
};

// Delete a document requirement
exports.deleteDocumentRequirement = async (req, res) => {
    try {
        const requirementId = req.params.id;
        const deletedRequirement = await DocumentRequirement.findByIdAndDelete(requirementId);

        if (!deletedRequirement) {
            return res.status(404).json({ message: "Document requirement not found" });
        }

        res.status(200).json({ message: "Document requirement deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting document requirement", error: error.message });
    }
};
