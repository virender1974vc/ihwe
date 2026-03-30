const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");
const CrmEventSchema = new mongoose.Schema(
  {
    event_name: { type: String, required: true },
    event_fullName: { type: String, required: true },
    event_fromDate: { type: Date, required: true },
    event_toDate: { type: Date, required: true },
    event_address: { type: String, required: true },
    event_country: { type: String, required: true },
    event_state: { type: String, required: true },
    event_city: { type: String, required: true },
    event_pincode: { type: String, required: true },
    event_status: { type: String, required: true },
    added_by: { type: String, required: true },
  },
  { timestamps: { createdAt: "added", updatedAt: "updated" } },
);

module.exports = secondaryDB.model("CrmEvent", CrmEventSchema);
