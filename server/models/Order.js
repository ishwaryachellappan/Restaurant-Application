const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: {
      type: Number,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    itemTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },

    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },

    tableNumber: {
      type: Number,
      required: true,
    },

    waiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    waiterName: {
      type: String,
      required: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items.length > 0;
        },
        message: "Order must contain at least one item.",
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

   status: {
  type: String,
  enum: [
    "NEW",
    "SENT_TO_KITCHEN",
    "PREPARING",
    "READY",
    "SERVED",
    "COMPLETED",
    "CANCELLED"
  ],
  default: "NEW"
},

paymentMethod: {
  type: String,
  enum: ["CASH", "CARD", "UPI", null],
  default: null,
},

paidAt: {
  type: Date,
  default: null,
},

paymentMethod: {
  type: String,
  enum: ["CASH", "CARD", "UPI"],
  default: null
},

paidAt: {
  type: Date,
  default: null
},
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);