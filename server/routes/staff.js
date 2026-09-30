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

module.exports = router;