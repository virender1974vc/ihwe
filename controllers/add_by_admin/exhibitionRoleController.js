const ExhibitionRole = require("../../models/add_by_admin/ExhibitionRole");

const createExhibitionRole = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Role name is required" });

    const existing = await ExhibitionRole.findOne({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
    const actor = String(req.body.created_by || req.body.updated_by || req.user?.fullName || req.user?.username || "Admin").trim();
    if (existing && !existing.isDeleted) return res.status(409).json({ message: "Role already exists" });
    if (existing?.isDeleted) {
      const restored = await ExhibitionRole.findByIdAndUpdate(
        existing._id,
        {
          name,
          status: req.body.status || "active",
          created_by: actor,
          updated_by: actor,
          deleted_by: null,
          deleted_at: null,
          isDeleted: false,
          added: new Date(),
        },
        { returnDocument: "after", timestamps: false },
      );
      return res.status(200).json({ message: "Exhibition role restored successfully", data: restored });
    }

    const role = new ExhibitionRole({
      ...req.body,
      name,
      created_by: actor,
      updated_by: actor,
      isDeleted: false,
      deleted_by: null,
      deleted_at: null,
    });
    await role.save();
    res.status(201).json({ message: "Exhibition role created successfully", data: role });
  } catch (error) {
    res.status(500).json({ message: "Error creating exhibition role", error: error.message });
  }
};

const getExhibitionRoles = async (req, res) => {
  try {
    const status = String(req.query.status || "").toLowerCase();
    const includeDeleted = String(req.query.includeDeleted || "").toLowerCase() === "true";
    const query = {};

    if (status === "deleted") {
      query.isDeleted = true;
    } else {
      if (!includeDeleted) query.isDeleted = { $ne: true };
      if (status) query.status = status;
    }

    const roles = await ExhibitionRole.find(query).sort({ isDeleted: 1, name: 1 });
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

    delete payload.isDeleted;
    delete payload.created_by;
    delete payload.deleted_by;
    delete payload.deleted_at;
    if (payload.updated_by !== undefined) payload.updated_by = String(payload.updated_by || "").trim();

    const updated = await ExhibitionRole.findByIdAndUpdate(req.params.id, payload, { returnDocument: "after" });
    if (!updated) return res.status(404).json({ message: "Exhibition role not found" });
    res.status(200).json({ message: "Exhibition role updated", data: updated });
  } catch (error) {
    res.status(500).json({ message: "Error updating exhibition role", error: error.message });
  }
};

const deleteExhibitionRole = async (req, res) => {
  try {
    const actor = String(req.body.deleted_by || req.body.updated_by || req.user?.fullName || req.user?.username || "Admin").trim();
    const deleted = await ExhibitionRole.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
        deleted_by: actor,
        deleted_at: new Date(),
        updated_by: actor,
      },
      { returnDocument: "after" },
    );
    if (!deleted) return res.status(404).json({ message: "Exhibition role not found" });
    res.status(200).json({ message: "Exhibition role deleted successfully", data: deleted });
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
