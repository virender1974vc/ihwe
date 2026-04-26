const SellerSubscriptionPlan = require("../../models/add_by_admin/SellerSubscriptionPlan");

// ➤ Create new subscription plan
const createPlan = async (req, res) => {
  try {
    const { name, price, currency, durationDays, features, maxLeads, maxExportInquiries, maxServiceRequests, description, status, displayOrder, imageUrl } = req.body;
    const existing = await SellerSubscriptionPlan.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Plan with this name already exists",
      });
    }

    const newPlan = new SellerSubscriptionPlan({
      name: name.trim(),
      price,
      currency: currency || "INR",
      durationDays: durationDays || 365,
      features: features || [],
      maxLeads: maxLeads || 0,
      maxExportInquiries: maxExportInquiries || 0,
      maxServiceRequests: maxServiceRequests || 0,
      description: description || "",
      status: status || "active",
      displayOrder: displayOrder || 0,
      imageUrl: imageUrl || null,
      updatedBy: req.user?.name || req.user?.email || "Admin",
    });

    await newPlan.save();

    res.status(201).json({
      success: true,
      message: "Subscription plan created successfully",
      data: newPlan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating subscription plan",
      error: error.message,
    });
  }
};

// ➤ Get all subscription plans
const getPlans = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const plans = await SellerSubscriptionPlan.find(query).sort({ displayOrder: 1, price: 1 });
    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching subscription plans",
      error: error.message,
    });
  }
};

// ➤ Get active plans (for dropdowns)
const getActivePlans = async (req, res) => {
  try {
    const plans = await SellerSubscriptionPlan.find({ status: "active" })
      .select("name price currency durationDays features maxLeads maxExportInquiries maxServiceRequests description displayOrder imageUrl")
      .sort({ displayOrder: 1, price: 1 });

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching active plans",
      error: error.message,
    });
  }
};

// ➤ Get one by ID
const getPlanById = async (req, res) => {
  try {
    const plan = await SellerSubscriptionPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found",
      });
    }

    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching subscription plan",
      error: error.message,
    });
  }
};

// ➤ Update subscription plan
const updatePlan = async (req, res) => {
  try {
    const { name, price, currency, durationDays, features, maxLeads, maxExportInquiries, maxServiceRequests, description, status, displayOrder, imageUrl } = req.body;

    // Build update object with all fields
    const updateData = {
      updatedBy: req.user?.name || req.user?.email || "Admin",
    };

    // Update all provided fields
    if (name !== undefined) updateData.name = name.trim();
    if (price !== undefined) updateData.price = price;
    if (currency !== undefined) updateData.currency = currency;
    if (durationDays !== undefined) updateData.durationDays = durationDays;
    if (features !== undefined) updateData.features = features;
    if (maxLeads !== undefined) updateData.maxLeads = maxLeads;
    if (maxExportInquiries !== undefined) updateData.maxExportInquiries = maxExportInquiries;
    if (maxServiceRequests !== undefined) updateData.maxServiceRequests = maxServiceRequests;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    
    // Handle imageUrl - preserve existing if not provided, update if provided
    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl || null;
    }

    console.log('Update Data:', updateData);
    console.log('ImageUrl from request:', imageUrl);

    const updated = await SellerSubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: false }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found",
      });
    }

    console.log('Updated plan imageUrl:', updated.imageUrl);

    res.status(200).json({
      success: true,
      message: "Subscription plan updated",
      data: updated,
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({
      success: false,
      message: "Error updating subscription plan",
      error: error.message,
    });
  }
};

// ➤ Delete subscription plan
const deletePlan = async (req, res) => {
  try {
    const deleted = await SellerSubscriptionPlan.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subscription plan deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting subscription plan",
      error: error.message,
    });
  }
};

// ➤ Get available features list (for admin to select)
const getAvailableFeatures = async (req, res) => {
  try {
    const features = [
      { key: "bsm_marketing", label: "BSM Marketing Access", description: "Access to Buyer Seller Meeting marketing tools" },
      { key: "export_inquiry", label: "Export Inquiry Submission", description: "Submit export-related inquiries" },
      { key: "lead_access", label: "Lead Access", description: "View and access buyer leads" },
      { key: "service_request", label: "Service Requests", description: "Submit service requests to organizers" },
      { key: "premium_support", label: "Premium Support", description: "Priority support from organizers" },
      { key: "analytics_dashboard", label: "Analytics Dashboard", description: "Access to detailed analytics and reports" },
      { key: "product_showcase", label: "Product Showcase", description: "Feature products on seller portal" },
      { key: "meeting_scheduler", label: "Meeting Scheduler", description: "Schedule meetings with buyers" },
    ];

    res.status(200).json({
      success: true,
      data: features,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching features",
      error: error.message,
    });
  }
};

// ✅ EXPORT
module.exports = {
  createPlan,
  getPlans,
  getActivePlans,
  getPlanById,
  updatePlan,
  deletePlan,
  getAvailableFeatures,
  uploadPlanImage: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image file provided",
        });
      }

      const imageUrl = `/uploads/subscription-plans/${req.file.filename}`;

      res.status(200).json({
        success: true,
        message: "Image uploaded successfully",
        imageUrl,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error uploading image",
        error: error.message,
      });
    }
  },
};
