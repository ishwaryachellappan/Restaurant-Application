const express = require("express");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Table = require("../models/Table");

const router = express.Router();

/*
  CREATE ORDER
  POST /api/orders
*/
router.post("/", async (req, res) => {
  try {
    const {
      tableId,
      tableNumber,
      waiterId,
      waiterName,
      items,
    } = req.body;

    // Basic validation
    if (
      !tableId ||
      tableNumber === undefined ||
      !waiterId ||
      !waiterName ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Table, waiter and order items are required.",
      });
    }

    // Validate MongoDB IDs
    if (
      !mongoose.Types.ObjectId.isValid(tableId) ||
      !mongoose.Types.ObjectId.isValid(waiterId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid table or waiter ID.",
      });
    }

    // Find the table
    const table = await Table.findById(tableId);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found.",
      });
    }

    // Don't allow a new order on an occupied table
    if (table.status === "OCCUPIED") {
      return res.status(400).json({
        success: false,
        message: "This table is already occupied.",
      });
    }

    // Calculate totals on the backend
    const processedItems = items.map((item) => {
      const quantity = Number(item.quantity);
      const price = Number(item.price);

      if (
        !item.menuItemId ||
        !item.name ||
        !item.category ||
        !Number.isFinite(price) ||
        !Number.isFinite(quantity) ||
        quantity < 1
      ) {
        throw new Error("Invalid order item.");
      }

      return {
        menuItemId: item.menuItemId,
        name: item.name,
        category: item.category,
        price,
        quantity,
        itemTotal: price * quantity,
      };
    });

    const subtotal = processedItems.reduce(
      (sum, item) => sum + item.itemTotal,
      0
    );

    const total = subtotal;

    // Generate order number
    const orderCount = await Order.countDocuments();

    const orderNumber =
      `ORD-${String(orderCount + 1).padStart(6, "0")}`;

    // Create order
    const order = await Order.create({
      orderNumber,
      tableId,
      tableNumber,
      waiterId,
      waiterName,
      items: processedItems,
      subtotal,
      total,
      status: "SENT_TO_KITCHEN",
    });

    // Update table status
    table.status = "OCCUPIED";
    table.currentOrder = order._id;

    await table.save();

    return res.status(201).json({
      success: true,
      message: "Order created successfully.",
      order,
    });

  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to create order.",
    });
  }
});


/*
  GET ALL ORDERS
  GET /api/orders
*/
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      orders,
    });

  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders.",
    });
  }
});


/*
  GET SINGLE ORDER
  GET /api/orders/:id
*/
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.json({
      success: true,
      order,
    });

  } catch (error) {
    console.error("Get order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch order.",
    });
  }
});
/*
  UPDATE EXISTING ORDER
  PATCH /api/orders/:id
*/
router.patch("/:id", async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item.",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const processedItems = items.map((item) => {
      const quantity = Number(item.quantity);
      const price = Number(item.price);

      if (
        !item.menuItemId ||
        !item.name ||
        !item.category ||
        !Number.isFinite(price) ||
        !Number.isFinite(quantity) ||
        quantity < 1
      ) {
        throw new Error("Invalid order item.");
      }

      return {
        menuItemId: item.menuItemId,
        name: item.name,
        category: item.category,
        price,
        quantity,
        itemTotal: price * quantity,
      };
    });

    const subtotal = processedItems.reduce(
      (sum, item) => sum + item.itemTotal,
      0
    );

    order.items = processedItems;
    order.subtotal = subtotal;
    order.total = subtotal;

    // Keep the order in the kitchen workflow
    if (
      order.status === "NEW" ||
      order.status === "SERVED"
    ) {
      order.status = "SENT_TO_KITCHEN";
    }

    await order.save();

    return res.json({
      success: true,
      message: "Order updated successfully.",
      order,
    });

  } catch (error) {
    console.error("Update order error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Unable to update order.",
    });
  }
});


module.exports = router;