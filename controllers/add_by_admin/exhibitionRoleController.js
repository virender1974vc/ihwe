const ExhibitionRole = require("../../models/add_by_admin/ExhibitionRole");

const createExhibitionRole = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Role name is required" });

    const existing = await ExhibitionRole.findOne({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
    if (existing) return res.status(409).json({ message: "Role already exists" });

    const role = new ExhibitionRole({ ...req.body, name });
    await role.save();
    res.status(201).json({ message: "Exhibition role created successfully", data: role });
  } catch (error) {
    res.status(500).json({ message: "Error creating exhibition role", error: error.message });
  }
};

const getExhibitionRoles = async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = String(req.query.status).toLowerCase();
    const roles = await ExhibitionRole.find(query).sort({ name: 1 });
    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ message: "Error fetching exhibition roles", error: error.message });
  }
};

const getExhibitionRoleById = async (req, res) => {
  try {
    const role = await ExhibitionRole.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Exhibition role not found" });
    res.status(200).json(role);
  } catch (error) {
    res.status(500).json({ message: "Error fetching exhibition role", error: error.message });
  }
};

const updateExhibitionRole = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.name !== undefined) {
      payload.name = String(payload.name || "").trim();
      if (!payload.name) return res.status(400).json({ message: "Role name is required" });

      const existing = await ExhibitionRole.findOne({
        _id: { $ne: req.params.id },
        name: new RegExp(`^${payload.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      });
      if (existing) return res.status(409).json({ message: "Role already exists" });
    }

    const updated = await ExhibitionRole.findByIdAndUpdate(req.params.id, payload, { returnDocument: "after" });
    if (!updated) return res.status(404).json({ message: "Exhibition role not found" });
    res.status(200).json({ message: "Exhibition role updated", data: updated });
  } catch (error) {
    res.status(500).json({ message: "Error updating exhibition role", error: error.message });
  }
};

const deleteExhibitionRole = async (req, res) => {
  try {
    const deleted = await ExhibitionRole.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Exhibition role not found" });
    res.status(200).json({ message: "Exhibition role deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting exhibition role", error: error.message });
  }
};

module.exports = {
  createExhibitionRole,
  getExhibitionRoles,
  getExhibitionRoleById,
  updateExhibitionRole,
  deleteExhibitionRole,
};
