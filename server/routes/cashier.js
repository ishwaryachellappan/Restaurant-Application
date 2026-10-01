const express = require("express");
const router = express.Router();

const Order = require("../models/Order");
const Table = require("../models/Table");

// ------------------------------------------
// GET READY ORDERS
// ------------------------------------------

router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find({
      status: "READY",
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Cashier orders error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch cashier orders",
    });
  }
});


// ------------------------------------------
// GET PAYMENT HISTORY
// ------------------------------------------

router.get("/payments", async (req, res) => {
  try {
    const payments = await Order.find({
      status: "COMPLETED",
      paymentMethod: {
        $in: ["CASH", "CARD", "UPI"],
      },
      paidAt: {
        $ne: null,
      },
    }).sort({
      paidAt: -1,
    });

    res.json({
      success: true,
      count: payments.length,
      payments,
    });

  } catch (error) {
    console.error(
      "Cashier payment history error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch payment history",
    });
  }
});

// ------------------------------------------
// COMPLETE PAYMENT
// ------------------------------------------


router.patch("/orders/:id/pay", async (req, res) => {
  try {
    const { paymentMethod } = req.body;

    // Validate payment method
    const allowedMethods = [
      "CASH",
      "CARD",
      "UPI",
    ];

    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment method. Use CASH, CARD or UPI.",
      });
    }

    const order = await Order.findById(
      req.params.id
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.status !== "READY") {
      return res.status(400).json({
        success: false,
        message:
          "Only READY orders can be paid.",
      });
    }

    // Complete payment
    order.status = "COMPLETED";
    order.paymentMethod = paymentMethod;
    order.paidAt = new Date();

    await order.save();

    // Release the table
    await Table.findByIdAndUpdate(
      order.tableId,
      {
        status: "AVAILABLE",
        currentOrder: null,
      }
    );

    res.json({
      success: true,
      message:
        `Payment completed successfully using ${paymentMethod}.`,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paidAt: order.paidAt,
        total: order.total,
      },
    });
  } catch (error) {
    console.error(
      "Cashier payment error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to complete payment.",
    });
  }
});


module.exports = router;