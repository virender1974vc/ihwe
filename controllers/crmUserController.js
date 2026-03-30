const CrmUser = require("../models/CrmUser.js");

// GET all users
const getAllUsers = async (req, res) => {
  try {
    const users = await CrmUser.find().select("-user_password");
    res.json(users);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: err.message });
  }
};

// GET one user by ID
const getUserById = async (req, res) => {
  try {
    const user = await CrmUser.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching user", error: err.message });
  }
};

// CREATE user
const createUser = async (req, res) => {
  try {
    const newUser = new CrmUser(req.body);
    const savedUser = await newUser.save();

    res.status(201).json(savedUser);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating user", error: err.message });
  }
};

// UPDATE user
const updateUser = async (req, res) => {
  try {
    const updates = req.body || {};
    const user = await CrmUser.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    Object.keys(updates).forEach((key) => {
      user[key] = updates[key];
    });

    const savedUser = await user.save();
    res.json(savedUser);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating user", error: err.message });
  }
};

// DELETE user
const deleteUser = async (req, res) => {
  try {
    const user = await CrmUser.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: err.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
