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

// ------------------------------------------
// PAY COMBINED BILLING SESSION
// ------------------------------------------

router.patch(
  "/billing/:id/pay",
  async (req, res) => {
    try {
      const { paymentMethod } = req.body;

      const allowedMethods = [
        "CASH",
        "CARD",
        "UPI",
      ];

      // ------------------------------------------
      // VALIDATE PAYMENT METHOD
      // ------------------------------------------

      if (
        !allowedMethods.includes(
          paymentMethod
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid payment method. Use CASH, CARD or UPI.",
        });
      }

      // ------------------------------------------
      // LOAD BILLING SESSION
      // ------------------------------------------

      const BillingSession =
        require(
          "../models/BillingSession"
        );

      const billingSession =
        await BillingSession.findById(
          req.params.id
        );

      if (!billingSession) {
        return res.status(404).json({
          success: false,
          message:
            "Billing session not found.",
        });
      }

      // ------------------------------------------
      // BILL MUST STILL BE OPEN
      // ------------------------------------------

      if (
        billingSession.status !==
        "OPEN"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This billing session has already been processed.",
        });
      }

      // ------------------------------------------
      // LOAD ORDERS
      // ------------------------------------------

      const orders = await Order.find({
        _id: {
          $in:
            billingSession.orderIds,
        },
      });

      if (
        orders.length !==
        billingSession.orderIds.length
      ) {
        return res.status(400).json({
          success: false,
          message:
            "One or more orders in the billing session could not be found.",
        });
      }

      // ------------------------------------------
      // ALL ORDERS MUST STILL BE READY
      // ------------------------------------------

      const invalidOrder =
        orders.find(
          (order) =>
            order.status !== "READY"
        );

      if (invalidOrder) {
        return res.status(400).json({
          success: false,
          message:
            `Order ${invalidOrder.orderNumber} is no longer READY for payment.`,
        });
      }

      // ------------------------------------------
      // VERIFY TOTAL
      // ------------------------------------------

      const calculatedTotal =
        orders.reduce(
          (sum, order) =>
            sum +
            Number(
              order.total || 0
            ),
          0
        );

      const expectedTotal =
        Number(
          billingSession.totalAmount ||
            0
        );

      if (
        Math.abs(
          calculatedTotal -
            expectedTotal
        ) > 0.01
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Billing total has changed. Please create the combined bill again.",
        });
      }

      // ------------------------------------------
      // LOAD TABLES
      // ------------------------------------------

      const tableIds =
        billingSession.tableIds;

      const tables =
        await Table.find({
          _id: {
            $in: tableIds,
          },
        });

      if (
        tables.length !==
        tableIds.length
      ) {
        return res.status(400).json({
          success: false,
          message:
            "One or more tables could not be found.",
        });
      }

      // ------------------------------------------
      // COMPLETE ALL ORDERS
      // ------------------------------------------

      const paidAt =
        new Date();

      for (const order of orders) {
        order.status =
          "COMPLETED";

        order.paymentMethod =
          paymentMethod;

        order.paidAt =
          paidAt;

        await order.save();
      }

      // ------------------------------------------
      // RELEASE ALL TABLES
      // ------------------------------------------

      for (const table of tables) {
        table.status =
          "AVAILABLE";

        table.currentOrder =
          null;

        // Clear temporary billing merge
        table.mergedInto =
          null;

        table.mergedWith = [];

        await table.save();
      }

      // ------------------------------------------
      // UPDATE BILLING SESSION
      // ------------------------------------------

      billingSession.status =
        "PAID";

      billingSession.payments.push({
        paymentMethod,
        amount:
          expectedTotal,
        paidAt,
      });

      await billingSession.save();

      // ------------------------------------------
      // RESPONSE
      // ------------------------------------------

      res.json({
        success: true,

        message:
          `Combined payment completed successfully using ${paymentMethod}.`,

        billingSession: {
          id:
            billingSession._id,

          billingNumber:
            billingSession.billingNumber,

          totalAmount:
            billingSession.totalAmount,

          status:
            billingSession.status,

          paymentMethod,

          paidAt,
        },

        orders: orders.map(
          (order) => ({
            id:
              order._id,

            orderNumber:
              order.orderNumber,

            tableNumber:
              order.tableNumber,

            status:
              order.status,

            paymentMethod:
              order.paymentMethod,

            paidAt:
              order.paidAt,

            total:
              order.total,
          })
        ),

        tables: tables.map(
          (table) => ({
            id:
              table._id,

            tableNumber:
              table.tableNumber,

            status:
              table.status,
          })
        ),
      });
    } catch (error) {
      console.error(
        "Combined payment error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to complete combined payment.",
        error:
          error.message,
      });
    }
  }
);

module.exports = router;

// ------------------------------------------
// CREATE COMBINED BILLING SESSION
// ------------------------------------------

router.post("/billing/combine", async (req, res) => {
  try {
    const { orderIds, createdBy } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "At least two orders are required to combine billing.",
      });
    }

    // Remove duplicate IDs
    const uniqueOrderIds = [
      ...new Set(orderIds.map(String)),
    ];

    if (uniqueOrderIds.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "At least two different orders are required.",
      });
    }

    // ------------------------------------------
    // LOAD ORDERS
    // ------------------------------------------

    const orders = await Order.find({
      _id: {
        $in: uniqueOrderIds,
      },
    }).sort({
      tableNumber: 1,
    });

    if (orders.length !== uniqueOrderIds.length) {
      return res.status(404).json({
        success: false,
        message:
          "One or more selected orders could not be found.",
      });
    }

    // ------------------------------------------
    // ALL ORDERS MUST BE READY
    // ------------------------------------------

    const invalidOrder = orders.find(
      (order) => order.status !== "READY"
    );

    if (invalidOrder) {
      return res.status(400).json({
        success: false,
        message:
          `Order ${invalidOrder.orderNumber} is not READY for payment.`,
      });
    }

    // ------------------------------------------
    // MAKE SURE ORDERS BELONG TO DIFFERENT TABLES
    // ------------------------------------------

    const tableIds = [
      ...new Set(
        orders.map((order) =>
          String(order.tableId)
        )
      ),
    ];

    if (tableIds.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Combined billing requires orders from at least two tables.",
      });
    }

    // ------------------------------------------
    // CHECK TABLES
    // ------------------------------------------

    const tables = await Table.find({
      _id: {
        $in: tableIds,
      },
    });

    if (tables.length !== tableIds.length) {
      return res.status(404).json({
        success: false,
        message:
          "One or more tables could not be found.",
      });
    }

    // ------------------------------------------
    // CHECK THAT ORDERS ARE STILL ACTIVE
    // ------------------------------------------

    for (const order of orders) {
      const table = tables.find(
        (item) =>
          String(item._id) ===
          String(order.tableId)
      );

      if (!table) {
        return res.status(400).json({
          success: false,
          message:
            `Table ${order.tableNumber} could not be found.`,
        });
      }

      if (
        table.currentOrder &&
        String(table.currentOrder) !==
          String(order._id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Table ${order.tableNumber} has a different active order.`,
        });
      }
    }

    // ------------------------------------------
    // CHECK FOR ALREADY OPEN BILLING SESSION
    // ------------------------------------------

    const BillingSession = require(
      "../models/BillingSession"
    );

    const existingSession =
      await BillingSession.findOne({
        orderIds: {
          $in: uniqueOrderIds,
        },
        status: {
          $in: [
            "OPEN",
            "PARTIALLY_PAID",
          ],
        },
      });

    if (existingSession) {
      return res.status(400).json({
        success: false,
        message:
          "One or more selected orders are already part of an active billing session.",
      });
    }

    // ------------------------------------------
    // CALCULATE TOTAL
    // ------------------------------------------

    const totalAmount = orders.reduce(
      (sum, order) =>
        sum + Number(order.total || 0),
      0
    );

    const tableNumbers = orders.map(
      (order) => order.tableNumber
    );

    // ------------------------------------------
    // BILLING NUMBER
    // ------------------------------------------

    const billingNumber =
      `BILL-${Date.now()}`;

    // ------------------------------------------
    // CREATE BILLING SESSION
    // ------------------------------------------

    const billingSession =
      await BillingSession.create({
        billingNumber,

        orderIds: orders.map(
          (order) => order._id
        ),

        tableIds: tables.map(
          (table) => table._id
        ),

        tableNumbers,

        totalAmount,

        billingType:
          "SINGLE_BILL",

        status:
          "OPEN",

        payments: [],

        createdBy:
          createdBy || "",
      });

    // ------------------------------------------
    // RESPONSE
    // ------------------------------------------

    res.status(201).json({
      success: true,

      message:
        "Combined billing session created successfully.",

      billingSession: {
        id: billingSession._id,
        billingNumber:
          billingSession.billingNumber,

        orderIds:
          billingSession.orderIds,

        tableIds:
          billingSession.tableIds,

        tableNumbers:
          billingSession.tableNumbers,

        totalAmount:
          billingSession.totalAmount,

        billingType:
          billingSession.billingType,

        status:
          billingSession.status,

        orders,
      },
    });
  } catch (error) {
    console.error(
      "Create combined billing session error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to create combined billing session.",
      error: error.message,
    });
  }
});


// ------------------------------------------
// GET BILLING SESSION
// ------------------------------------------

router.get(
  "/billing/:id",
  async (req, res) => {
    try {
      const BillingSession =
        require("../models/BillingSession");

      const billingSession =
        await BillingSession.findById(
          req.params.id
        ).populate("orderIds");

      if (!billingSession) {
        return res.status(404).json({
          success: false,
          message:
            "Billing session not found.",
        });
      }

      res.json({
        success: true,
        billingSession,
      });
    } catch (error) {
      console.error(
        "Get billing session error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to load billing session.",
        error: error.message,
      });
    }
  }
);
