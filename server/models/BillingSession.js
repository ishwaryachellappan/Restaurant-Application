const mongoose = require("mongoose");

const billingSessionSchema = new mongoose.Schema(
  {
    billingNumber: {
      type: String,
      required: true,
      unique: true,
    },

    orderIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
      },
    ],

    tableIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Table",
        required: true,
      },
    ],

    tableNumbers: [
      {
        type: Number,
        required: true,
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    billingType: {
      type: String,
      enum: ["SINGLE_BILL", "SPLIT_BILL"],
      default: "SINGLE_BILL",
    },

    status: {
      type: String,
      enum: [
        "OPEN",
        "PARTIALLY_PAID",
        "PAID",
        "CANCELLED",
      ],
      default: "OPEN",
    },

    payments: [
      {
        paymentMethod: {
          type: String,
          enum: ["CASH", "CARD", "UPI"],
          required: true,
        },

        amount: {
          type: Number,
          required: true,
          min: 0,
        },

        paidAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    createdBy: {
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
  "BillingSession",
  billingSessionSchema
);
