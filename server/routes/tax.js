const express = require("express");

const TaxConfiguration = require("../models/TaxConfiguration");

const router = express.Router();

// ------------------------------------------
// HELPER — CURRENT DATE
// ------------------------------------------

const getCurrentDate = () => {
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
// GET ACTIVE TAX
// GET /api/tax/today
//
// NOTE:
// The endpoint name stays /today so the
// existing frontend continues to work.
//
// The tax itself is NOT daily anymore.
// The latest configured tax remains active
// until the cashier changes it.
// ------------------------------------------

router.get("/today", async (req, res) => {
  try {

    const configuration =
      await TaxConfiguration.findOne()
        .sort({
          updatedAt: -1,
        });

    // No tax has ever been configured
    if (!configuration) {

      return res.json({
        success: true,

        configured: false,

        effectiveDate:
          getCurrentDate(),

        taxRate: 0,

        updatedBy: "",

        updatedAt: null,

        message:
          "No tax rate has been configured yet.",
      });
    }

    return res.json({

      success: true,

      configured: true,

      // Date from which this configuration
      // originally became active
      effectiveDate:
        configuration.effectiveDate,

      taxRate:
        configuration.taxRate,

      updatedBy:
        configuration.updatedBy,

      updatedAt:
        configuration.updatedAt,

    });

  } catch (error) {

    console.error(
      "Get active tax error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Unable to fetch active tax rate.",

    });
  }
});


// ------------------------------------------
// UPDATE ACTIVE TAX
// PUT /api/tax/today
//
// Cashier changes the currently active tax.
// The same configuration record is updated.
//
// Example:
//
// 12%
// ↓
// remains active
//
// Cashier changes it to 18%
// ↓
// 18% becomes active
// ------------------------------------------

router.put("/today", async (req, res) => {

  try {

    const {
      taxRate,
      updatedBy,
    } = req.body;

    const rate = Number(taxRate);


    // --------------------------------------
    // VALIDATION
    // --------------------------------------

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


    // --------------------------------------
    // FIND CURRENT ACTIVE CONFIGURATION
    // --------------------------------------

    let configuration =
      await TaxConfiguration.findOne()
        .sort({
          updatedAt: -1,
        });


    // --------------------------------------
    // FIRST EVER TAX CONFIGURATION
    // --------------------------------------

    if (!configuration) {

      configuration =
        await TaxConfiguration.create({

          effectiveDate:
            getCurrentDate(),

          taxRate: rate,

          updatedBy:
            updatedBy?.trim() || "",

        });

    }

    // --------------------------------------
    // UPDATE EXISTING CONFIGURATION
    // --------------------------------------

    else {

      configuration.taxRate =
        rate;

      configuration.updatedBy =
        updatedBy?.trim() || "";

      await configuration.save();

    }


    // --------------------------------------
    // RESPONSE
    // --------------------------------------

    return res.json({

      success: true,

      message:
        "Tax rate updated successfully.",

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
      "Update active tax error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Unable to update tax rate.",

    });
  }
});


module.exports = router;