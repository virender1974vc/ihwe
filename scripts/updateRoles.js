const mongoose = require("mongoose");
require("dotenv").config({ path: __dirname + "/.env" });

const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  permissions: { type: Object, default: {} },
  status: { type: String, default: "Active" },
}, { strict: false });

const Role = mongoose.model("Role", RoleSchema, "roles");

async function update() {
  try {
    await mongoose.connect(process.env.MONGO_URI_MAIN);
    console.log("Connected to DB");
    const roles = await Role.find({});
    for (const role of roles) {
      if (!role.permissions) role.permissions = {};
      role.permissions["Exhibitor Hero Slider"] = true;
      role.markModified('permissions');
      await role.save();
      console.log(`Updated role: ${role.name}`);
    }
    console.log("All roles updated successfully.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
update();
