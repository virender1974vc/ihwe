const mongoose = require('mongoose');

const exploreCategoriesSchema = new mongoose.Schema({
  categoryname: { 
    type: String, 
    required: true 
  },
  logo: { 
    type: String, 
    default: '' 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'active' 
  },
  createdby: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null
  },
  updatedby: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null
  }
}, { timestamps: true });

const ExploreCategories = global.secondaryDB.model('OrganicExploreCategories', exploreCategoriesSchema);
module.exports = ExploreCategories;
