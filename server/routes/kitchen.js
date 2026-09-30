const express = require("express");
const router = express.Router();

const Order = require("../models/Order");

// Get orders that are currently in the kitchen workflow
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find({
      status: {
        $in: ["SENT_TO_KITCHEN", "PREPARING", "READY"]
      }
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error("Kitchen orders error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch kitchen orders"
    });
  }
});


// Start preparing an order
router.patch("/orders/:id/start", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.status !== "SENT_TO_KITCHEN") {
      return res.status(400).json({
        success: false,
        message: `Order cannot be started from status ${order.status}`
      });
    }

    order.status = "PREPARING";

    await order.save();

    res.json({
      success: true,
      message: "Order started preparing",
      order
    });
  } catch (error) {
    console.error("Start preparing error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to start preparing order"
    });
  }
});


// Mark order as ready
router.patch("/orders/:id/ready", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.status !== "PREPARING") {
      return res.status(400).json({
        success: false,
        message: `Order cannot be marked ready from status ${order.status}`
      });
    }

    order.status = "READY";

    await order.save();

    res.json({
      success: true,
      message: "Order marked as ready",
      order
    });
  } catch (error) {
    console.error("Mark ready error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to mark order ready"
    });
  }
});


module.exports = router;