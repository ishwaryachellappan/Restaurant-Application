const express = require("express");

const TaxConfiguration = require("../models/TaxConfiguration");

const router = express.Router();

// ------------------------------------------
// HELPER — TODAY'S DATE
// ------------------------------------------

const getTodayDate = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


// ------------------------------------------
// GET TODAY'S TAX
// GET /api/tax/today
// ------------------------------------------

router.get("/today", async (req, res) => {
  try {
    const effectiveDate = getTodayDate();

    const configuration =
      await TaxConfiguration.findOne({
        effectiveDate,
      });

    // No tax configured yet for today
    if (!configuration) {
      return res.json({
        success: true,
        configured: false,
        effectiveDate,
        taxRate: 0,
        message:
          "Tax rate has not been configured for today.",
      });
    }

    return res.json({
      success: true,
      configured: true,
      effectiveDate,
      taxRate: configuration.taxRate,
      updatedBy: configuration.updatedBy,
      updatedAt: configuration.updatedAt,
    });

  } catch (error) {
    console.error(
      "Get today's tax error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch today's tax rate.",
    });
  }
});


// ------------------------------------------
// UPDATE TODAY'S TAX
// PUT /api/tax/today
// ------------------------------------------

router.put("/today", async (req, res) => {
  try {
    const {
      taxRate,
      updatedBy,
    } = req.body;

    const rate = Number(taxRate);

    // Validate tax rate
    if (!Number.isFinite(rate)) {
      return res.status(400).json({
        success: false,
        message:
          "Tax rate must be a valid number.",
      });
    }

    if (rate < 0 || rate > 100) {
      return res.status(400).json({
        success: false,
        message:
          "Tax rate must be between 0 and 100.",
      });
    }

    const effectiveDate = getTodayDate();

    const configuration =
      await TaxConfiguration.findOneAndUpdate(
        {
          effectiveDate,
        },
        {
          effectiveDate,
          taxRate: rate,
          updatedBy:
            updatedBy?.trim() || "",
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

    return res.json({
      success: true,
      message:
        "Today's tax rate updated successfully.",
      configuration: {
        effectiveDate:
          configuration.effectiveDate,

        taxRate:
          configuration.taxRate,

        updatedBy:
          configuration.updatedBy,

        updatedAt:
          configuration.updatedAt,
      },
    });

  } catch (error) {
    console.error(
      "Update today's tax error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update today's tax rate.",
    });
  }
});


module.exports = router;