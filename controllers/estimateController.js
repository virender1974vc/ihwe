const Estimate = require("../models/Estimate");


// Add estimate
const addEstimate = async (req, res) => {
  try {
    const newEstimateNo = await Estimate.generateNextEstimateNo();

    const estimateBody = {
      ...req.body,
      est_no: newEstimateNo,
    };

    const estimate = new Estimate(estimateBody);
    await estimate.save();

    res.status(201).json({
      message: "✅ Estimate added",
      data: estimate,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Conflict: Estimate number already exists",
        error: error.message,
      });
    }

    res.status(500).json({
      message: "Error adding estimate",
      error: error.message,
    });
  }
};

// Get grouped data
const getGroupedEstimateData = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "companyId is required",
      });
    }

    const data = await Estimate.aggregate([
      { $match: { companyId } },

      {
        $lookup: {
          from: "performainvoices",
          let: { est_no: "$est_no", companyId: "$companyId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$companyId", "$$companyId"] },
                    { $eq: ["$est_no", "$$est_no"] },
                  ],
                },
              },
            },
            { $project: { _id: 1, pi_no: 1, added: 1 } },
          ],
          as: "performaInvoice",
        },
      },

      {
        $lookup: {
          from: "invoices",
          let: { est_no: "$est_no", companyId: "$companyId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$companyId", "$$companyId"] },
                    { $eq: ["$estimate_no", "$$est_no"] },
                  ],
                },
              },
            },
            { $project: { _id: 1, invoice_no: 1, added: 1 } },
          ],
          as: "invoice",
        },
      },

      {
        $project: {
          _id: 1,
          companyId: 1,
          est_no: 1,
          est_type: 1,
          gst_no: 1,
          consignee_name: 1,
          consignee_addr: 1,
          country: 1,
          state: 1,
          city: 1,
          pincode: 1,
          added_by: 1,
          updated: 1,
          items: 1,
          supply_date: 1,
          finalAmount: {
            $cond: {
              if: { $isArray: "$items" },
              then: { $sum: "$items.finalAmount" },
              else: 0,
            },
          },
          added: 1,
          performaInvoice: 1,
          invoice: 1,
        },
      },

      { $sort: { added: -1 } },
    ]);

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching data",
      error: error.message,
    });
  }
};
const getAllEstimates = async (req, res) => {
  try {
    const data = await Estimate.aggregate([
      {
        $lookup: {
          from: "performainvoices",
          let: { est_no: "$est_no", companyId: "$companyId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$companyId", "$$companyId"] },
                    { $eq: ["$est_no", "$$est_no"] },
                  ],
                },
              },
            },
            { $project: { _id: 1, pi_no: 1, updated: 1, finalAmount: 1 } },
          ],
          as: "performaInvoice",
        },
      },
      {
        $lookup: {
          from: "invoices",
          let: { est_no: "$est_no", companyId: "$companyId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$companyId", "$$companyId"] },
                    { $eq: ["$estimate_no", "$$est_no"] },
                  ],
                },
              },
            },
            { $project: { _id: 1, invoice_no: 1, added: 1 } },
          ],
          as: "invoice",
        },
      },
      {
        $project: {
          _id: 1,
          companyId: 1,
          est_no: 1,
          est_type: 1,
          gst_no: 1,
          consignee_name: 1,
          consignee_addr: 1,
          country: 1,
          state: 1,
          city: 1,
          pincode: 1,
          added_by: 1,
          updated: 1,
          items: 1,
          supply_date: 1,
          finalAmount: {
            $cond: {
              if: { $isArray: "$items" },
              then: { $sum: "$items.finalAmount" },
              else: 0,
            },
          },
          added: 1,
          performaInvoice: 1,
          invoice: 1,
        },
      },
      { $sort: { added: -1 } },
    ]);

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("❌ Error fetching all estimates:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching all estimates",
      error: error.message,
    });
  }
};

// Get by ID
const getEstimateById = async (req, res) => {
  try {
    const estimate = await Estimate.findById(req.params.id);

    if (!estimate)
      return res.status(404).json({ message: "Estimate not found" });

    res.status(200).json(estimate);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching estimate",
      error: error.message,
    });
  }
};

// Update
const updateEstimate = async (req, res) => {
  try {
    const updated = await Estimate.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
    });

    if (!updated)
      return res.status(404).json({ message: "Estimate not found" });

    res.status(200).json({
      message: "✏️ Estimate updated",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating estimate",
      error: error.message,
    });
  }
};

// Delete
const deleteEstimate = async (req, res) => {
  try {
    const deleted = await Estimate.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ message: "Estimate not found" });

    res.status(200).json({
      message: "🗑️ Estimate deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting estimate",
      error: error.message,
    });
  }
};

// Get next estimate number
const getNextEstimateNumber = async (req, res) => {
  try {
    const nextNo = await Estimate.generateNextEstimateNo();
    res.status(200).json({ est_no: nextNo });
  } catch (error) {
    res.status(500).json({
      message: "Error generating estimate number",
      error: error.message,
    });
  }
};

// ✅ EXPORT
module.exports = {
  addEstimate,
  getGroupedEstimateData,
  getAllEstimates,
  getEstimateById,
  updateEstimate,
  deleteEstimate,
  getNextEstimateNumber,
};
