const express = require("express");

const RestaurantSettings = require(
  "../models/RestaurantSettings"
);

const router = express.Router();


// ------------------------------------------
// DEFAULT SETTINGS
// ------------------------------------------

const getDefaultSettings = () => ({
  restaurantName: "Restaurant POS",
  address: "",
  phone: "",
  gstTaxNumber: "",
  currency: "INR",
  taxRate: 0,
  receiptFooter: "Thank you for dining with us!",
  logo: "",
  orderPrefix: "ORD",
  tableCount: 10,

  paymentMethods: {
    cash: true,
    card: true,
    upi: true,
  },
});


// ------------------------------------------
// GET RESTAURANT SETTINGS
// GET /api/settings/restaurant
// ------------------------------------------

router.get("/restaurant", async (req, res) => {
  try {
    let settings =
      await RestaurantSettings.findOne();

    // Create default settings if none exist
    if (!settings) {
      settings =
        await RestaurantSettings.create(
          getDefaultSettings()
        );
    }

    return res.json({
      success: true,

      settings: {
        id: settings._id,

        restaurantName:
          settings.restaurantName,

        address:
          settings.address,

        phone:
          settings.phone,

        gstTaxNumber:
          settings.gstTaxNumber,

        currency:
          settings.currency,

        taxRate:
          settings.taxRate,

        receiptFooter:
          settings.receiptFooter,

        logo:
          settings.logo,

        orderPrefix:
          settings.orderPrefix,

        tableCount:
          settings.tableCount,

        paymentMethods:
          settings.paymentMethods,

        updatedAt:
          settings.updatedAt,
      },
    });

  } catch (error) {

    console.error(
      "Get restaurant settings error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to load restaurant settings.",
    });
  }
});


// ------------------------------------------
// UPDATE RESTAURANT SETTINGS
// PUT /api/settings/restaurant
// ------------------------------------------

router.put("/restaurant", async (req, res) => {
  try {

    const {
      restaurantName,
      address,
      phone,
      gstTaxNumber,
      currency,
      taxRate,
      receiptFooter,
      logo,
      orderPrefix,
      tableCount,
      paymentMethods,
    } = req.body;


    // --------------------------------------
    // VALIDATION
    // --------------------------------------

    if (
      !restaurantName ||
      !restaurantName.trim()
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Restaurant name is required.",
      });
    }


    const numericTaxRate =
      Number(taxRate ?? 0);

    if (
      !Number.isFinite(numericTaxRate) ||
      numericTaxRate < 0 ||
      numericTaxRate > 100
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Tax rate must be between 0% and 100%.",
      });
    }


    const numericTableCount =
      Number(tableCount ?? 10);

    if (
      !Number.isInteger(numericTableCount) ||
      numericTableCount < 1
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Table count must be at least 1.",
      });
    }


    // --------------------------------------
    // FIND EXISTING SETTINGS
    // --------------------------------------

    let settings =
      await RestaurantSettings.findOne();


    // --------------------------------------
    // CREATE IF NOT EXISTS
    // --------------------------------------

    if (!settings) {

      settings =
        new RestaurantSettings({
          restaurantName:
            restaurantName.trim(),

          address:
            address?.trim() || "",

          phone:
            phone?.trim() || "",

          gstTaxNumber:
            gstTaxNumber?.trim() || "",

          currency:
            currency?.trim() || "INR",

          taxRate:
            numericTaxRate,

          receiptFooter:
            receiptFooter?.trim() ||
            "Thank you for dining with us!",

          logo:
            logo || "",

          orderPrefix:
            orderPrefix?.trim() || "ORD",

          tableCount:
            numericTableCount,

          paymentMethods: {
            cash:
              paymentMethods?.cash !== false,

            card:
              paymentMethods?.card !== false,

            upi:
              paymentMethods?.upi !== false,
          },
        });

    }

    // --------------------------------------
    // UPDATE EXISTING SETTINGS
    // --------------------------------------

    else {

      settings.restaurantName =
        restaurantName.trim();

      settings.address =
        address?.trim() || "";

      settings.phone =
        phone?.trim() || "";

      settings.gstTaxNumber =
        gstTaxNumber?.trim() || "";

      settings.currency =
        currency?.trim() || "INR";

      settings.taxRate =
        numericTaxRate;

      settings.receiptFooter =
        receiptFooter?.trim() ||
        "Thank you for dining with us!";

      if (logo !== undefined) {
        settings.logo = logo;
      }

      settings.orderPrefix =
        orderPrefix?.trim() || "ORD";

      settings.tableCount =
        numericTableCount;

      settings.paymentMethods = {
        cash:
          paymentMethods?.cash !== false,

        card:
          paymentMethods?.card !== false,

        upi:
          paymentMethods?.upi !== false,
      };
    }


    await settings.save();


    // --------------------------------------
    // RESPONSE
    // --------------------------------------

    return res.json({

      success: true,

      message:
        "Restaurant settings updated successfully.",

      settings: {

        id:
          settings._id,

        restaurantName:
          settings.restaurantName,

        address:
          settings.address,

        phone:
          settings.phone,

        gstTaxNumber:
          settings.gstTaxNumber,

        currency:
          settings.currency,

        taxRate:
          settings.taxRate,

        receiptFooter:
          settings.receiptFooter,

        logo:
          settings.logo,

        orderPrefix:
          settings.orderPrefix,

        tableCount:
          settings.tableCount,

        paymentMethods:
          settings.paymentMethods,

        updatedAt:
          settings.updatedAt,
      },
    });

  } catch (error) {

    console.error(
      "Update restaurant settings error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Unable to update restaurant settings.",

    });
  }
});


module.exports = router;