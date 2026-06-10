const mongoose = require("mongoose");
const { secondaryDB } = require('../../config/secondaryDb');

const ClientDocumentSchema = new mongoose.Schema(
  {
    client_id: { type: String, required: true },
    document_name: { type: String, required: true },
    category: { type: String, required: true },
    file_url: { type: String, required: true },
    file_type: { type: String },
    size: { type: String },
    status: { 
        type: String, 
        default: "Pending",
        enum: ["Pending", "Approved", "Rejected"] 
    },
    uploaded_by: { type: String },
    created_by: { type: String },
    comments: [{
        text: String,
        author: String,
        timestamp: { type: Date, default: Date.now }
    }],
    history: [{
        action: String,
        author: String,
        timestamp: { type: Date, default: Date.now }
    }]
  },
  { timestamps: { createdAt: "added", updatedAt: "updated" } },
);

module.exports = secondaryDB.model("ClientDocument", ClientDocumentSchema);
