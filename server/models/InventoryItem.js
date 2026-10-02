const mongoose = require("mongoose");

const inventoryItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    unit: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "kg",
        "g",
        "litre",
        "ml",
        "pcs",
        "pack",
        "box",
        "bottle",
        "other",
      ],
    },

    currentStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    minimumStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    maximumStock: {
      type: Number,
      min: 0,
      default: 0,
    },

    supplier: {
      type: String,
      default: "",
      trim: true,
    },

    costPerUnit: {
      type: Number,
      min: 0,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "IN_STOCK",
        "LOW_STOCK",
        "OUT_OF_STOCK",
      ],
      default: "IN_STOCK",
    },

    active: {
      type: Boolean,
      default: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: String,
      default: "",
      trim: true,
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

const InventoryItem = mongoose.model(
  "InventoryItem",
  inventoryItemSchema
);

module.exports = InventoryItem;
