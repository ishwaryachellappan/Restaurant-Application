const mongoose = require("mongoose");

const restaurantSettingsSchema = new mongoose.Schema(
  {
    restaurantName: {
      type: String,
      required: true,
      trim: true,
      default: "Restaurant POS",
    },

    logo: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "RestaurantSettings",
  restaurantSettingsSchema
);