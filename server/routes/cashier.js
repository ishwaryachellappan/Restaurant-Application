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
// COMPLETE PAYMENT
// ------------------------------------------

router.patch("/orders/:id/pay", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== "READY") {
      return res.status(400).json({
        success: false,
        message:
          `Payment cannot be completed for order status ${order.status}`,
      });
    }

    // Complete the order
    order.status = "COMPLETED";

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
      message: "Payment completed successfully",
      order,
    });

  } catch (error) {
    console.error("Payment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to complete payment",
    });
  }
});


module.exports = router;