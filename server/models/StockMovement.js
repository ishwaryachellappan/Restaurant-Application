const mongoose = require("mongoose");

const stockMovementSchema =
  new mongoose.Schema(
    {
      inventoryItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InventoryItem",
        required: true,
      },

      inventoryItemName: {
        type: String,
        required: true,
        trim: true,
      },

      movementType: {
        type: String,
        required: true,
        enum: [
          "STOCK_IN",
          "STOCK_OUT",
          "ADJUSTMENT",
        ],
      },

      quantity: {
        type: Number,
        required: true,
        min: 0,
      },

      previousStock: {
        type: Number,
        required: true,
        min: 0,
      },

      newStock: {
        type: Number,
        required: true,
        min: 0,
      },

      reason: {
        type: String,
        default: "",
        trim: true,
      },

      performedBy: {
        type: String,
        default: "",
        trim: true,
      },
    },
    {
      timestamps: true,
    }
  );


const StockMovement =
  mongoose.models.StockMovement ||
  mongoose.model(
    "StockMovement",
    stockMovementSchema
  );

module.exports = StockMovement;