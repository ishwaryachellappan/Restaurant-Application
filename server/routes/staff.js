const express = require("express");
const router = express.Router();

const User = require("../models/User");
const bcrypt = require("bcryptjs");

// GET all staff
router.get("/", async (req, res) => {
  try {
    const users = await User.find(
      {},
      {
        password: 0,
      }
    ).sort({
      role: 1,
      name: 1,
    });

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get staff error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load staff.",
    });
  }
});

// UPDATE staff status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff status.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        status,
      },
      {
        new: true,
        projection: {
          password: 0,
        },
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found.",
      });
    }

    res.json({
      success: true,
      message: `Staff member ${status.toLowerCase()} successfully.`,
      user,
    });
  } catch (error) {
    console.error("Update staff status error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update staff status.",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    if (!username || !password || !name || !role) {
      return res.status(400).json({
        success: false,
        message: "Username, password, name and role are required.",
      });
    }

    if (!["WAITER", "KITCHEN", "CASHIER"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff role.",
      });
    }

    const existingUser = await User.findOne({
      username: username.trim(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: username.trim(),
      password: hashedPassword,
      name: name.trim(),
      role,
      status: "ACTIVE",
    });

    res.status(201).json({
      success: true,
      message: "Staff member created successfully.",
      user: {
        _id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Create staff error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create staff member.",
    });
  }
});

// ============================================================
// STAFF PERFORMANCE
// ============================================================

router.get("/performance", async (req, res) => {
  try {
    const {
      from,
      to,
    } = req.query;

    // --------------------------------------------------------
    // DATE VALIDATION
    // --------------------------------------------------------

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: "From and To dates are required.",
      });
    }

    const startDate = new Date(`${from}T00:00:00`);
    const endDate = new Date(`${to}T23:59:59.999`);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date range.",
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: "From date cannot be after To date.",
      });
    }

    // --------------------------------------------------------
    // LOAD COMPLETED ORDERS
    // --------------------------------------------------------

    const Order = require("../models/Order");

    const orders = await Order.find({
      status: "COMPLETED",

      $or: [
        {
          paidAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
        {
          paidAt: null,
          updatedAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      ],
    }).sort({
      paidAt: 1,
      createdAt: 1,
    });

    // --------------------------------------------------------
    // WAITer PERFORMANCE
    // --------------------------------------------------------

    const waiterMap = new Map();

    for (const order of orders) {
      if (!order.waiterId) {
        continue;
      }

      const waiterId = String(order.waiterId);

      if (!waiterMap.has(waiterId)) {
        waiterMap.set(waiterId, {
          staffId: order.waiterId,
          staffName: order.waiterName || "Unknown Waiter",
          role: "WAITER",
          orders: 0,
          amount: 0,
        });
      }

      const waiter = waiterMap.get(waiterId);

      waiter.orders += 1;
      waiter.amount += Number(order.total || 0);
    }

    // --------------------------------------------------------
    // CASHIER PERFORMANCE
    // --------------------------------------------------------

    const cashierMap = new Map();

    for (const order of orders) {
      if (!order.cashierId) {
        continue;
      }

      const cashierId = String(order.cashierId);

      if (!cashierMap.has(cashierId)) {
        cashierMap.set(cashierId, {
          staffId: order.cashierId,
          staffName: order.cashierName || "Unknown Cashier",
          role: "CASHIER",
          orders: 0,
          amount: 0,
        });
      }

      const cashier = cashierMap.get(cashierId);

      cashier.orders += 1;
      cashier.amount += Number(order.total || 0);
    }

    // --------------------------------------------------------
    // CONVERT MAPS TO ARRAYS
    // --------------------------------------------------------

    const waiters = Array.from(
      waiterMap.values()
    ).map((staff) => ({
      ...staff,
      amount: Number(staff.amount.toFixed(2)),
    }));

    const cashiers = Array.from(
      cashierMap.values()
    ).map((staff) => ({
      ...staff,
      amount: Number(staff.amount.toFixed(2)),
    }));

    // --------------------------------------------------------
    // TOTALS
    // --------------------------------------------------------

    const waiterTotalOrders = waiters.reduce(
      (sum, staff) =>
        sum + staff.orders,
      0
    );

    const waiterTotalAmount = waiters.reduce(
      (sum, staff) =>
        sum + staff.amount,
      0
    );

    const cashierTotalOrders = cashiers.reduce(
      (sum, staff) =>
        sum + staff.orders,
      0
    );

    const cashierTotalAmount = cashiers.reduce(
      (sum, staff) =>
        sum + staff.amount,
      0
    );

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    res.json({
      success: true,

      period: {
        from,
        to,
      },

      waiters,

      cashiers,

      totals: {
        waiterOrders: waiterTotalOrders,
        waiterAmount: Number(
          waiterTotalAmount.toFixed(2)
        ),

        cashierPayments:
          cashierTotalOrders,

        cashierAmount: Number(
          cashierTotalAmount.toFixed(2)
        ),
      },
    });
  } catch (error) {
    console.error(
      "Staff performance error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to load staff performance.",
      error: error.message,
    });
  }
}); 

module.exports = router;