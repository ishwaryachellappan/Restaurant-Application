const express = require("express");

const RestaurantSettings = require(
  "../models/RestaurantSettings"
);

const router = express.Router();

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
        await RestaurantSettings.create({
          restaurantName:
            "Restaurant POS",

          logo: "",
        });
    }

    return res.json({
      success: true,

      settings: {
        id: settings._id,

        restaurantName:
          settings.restaurantName,

        logo:
          settings.logo,

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
      logo,
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

          logo:
            logo || "",
        });

    }

    // --------------------------------------
    // UPDATE
    // --------------------------------------

    else {

      settings.restaurantName =
        restaurantName.trim();

      if (logo !== undefined) {
        settings.logo = logo;
      }

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

        id: settings._id,

        restaurantName:
          settings.restaurantName,

        logo:
          settings.logo,

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