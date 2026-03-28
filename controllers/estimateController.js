const Estimate = require("../models/Estimate");

// --- NEW HELPER FUNCTIONS ---

const getFiscalYear = () => {
  const date = new Date();
  const currentYear = date.getFullYear();
  const month = date.getMonth() + 1;

  let startYear = month >= 4 ? currentYear : currentYear - 1;
  let endYear = month >= 4 ? currentYear + 1 : currentYear;

  const startYearShort = startYear.toString().slice(-2);
  const endYearShort = endYear.toString().slice(-2);

  return `${startYearShort}-${endYearShort}`;
};

/**
 * Generates next estimate number
 */
const generateNextEstimateNo = async () => {
  const fiscalYear = getFiscalYear();
  const prefix = `NGW/${fiscalYear}/EST/`;

  const lastEstimate = await Estimate.findOne({
    est_no: { $regex: new RegExp(`^NGW/${fiscalYear}/EST/`) },
  }).sort({ added: -1 });

  let nextSequentialNumber = 1;

  if (lastEstimate) {
    const parts = lastEstimate.est_no.split("/");
    const lastNumber = parseInt(parts[parts.length - 1], 10);

    if (!isNaN(lastNumber)) {
      nextSequentialNumber = lastNumber + 1;
    }
  }

  const paddedNumber = String(nextSequentialNumber).padStart(3, "0");

  return `${prefix}${paddedNumber}`;
};

// Add estimate
const addEstimate = async (req, res) => {
  try {
    const newEstimateNo = await generateNextEstimateNo();

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
      new: true,
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
    const nextNo = await generateNextEstimateNo();
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
  getEstimateById,
  updateEstimate,
  deleteEstimate,
  getNextEstimateNumber,
};
