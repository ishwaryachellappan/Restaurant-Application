const mongoose = require("mongoose");

const taxConfigurationSchema = new mongoose.Schema(
  {
    effectiveDate: {
      type: String,
      required: true,
      unique: true,
    },

    taxRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    updatedBy: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "TaxConfiguration",
  taxConfigurationSchema
);