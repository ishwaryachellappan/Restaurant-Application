const mongoose = require("mongoose");

const restaurantSettingsSchema = new mongoose.Schema(
  {
    // ------------------------------------------
    // RESTAURANT INFORMATION
    // ------------------------------------------

    restaurantName: {
      type: String,
      required: true,
      trim: true,
      default: "Restaurant POS",
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    gstTaxNumber: {
      type: String,
      default: "",
      trim: true,
    },

    currency: {
      type: String,
      default: "INR",
      trim: true,
    },

    // ------------------------------------------
    // TAX & RECEIPT
    // ------------------------------------------

    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    receiptFooter: {
      type: String,
      default: "Thank you for dining with us!",
      trim: true,
    },

    logo: {
      type: String,
      default: "",
    },

    // ------------------------------------------
    // ORDER & TABLES
    // ------------------------------------------

    orderPrefix: {
      type: String,
      default: "ORD",
      trim: true,
    },

    tableCount: {
      type: Number,
      default: 10,
      min: 1,
    },

    // ------------------------------------------
    // PAYMENT METHODS
    // ------------------------------------------

    paymentMethods: {
      cash: {
        type: Boolean,
        default: true,
      },

      card: {
        type: Boolean,
        default: true,
      },

      upi: {
        type: Boolean,
        default: true,
      },
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