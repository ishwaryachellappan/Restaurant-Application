const express = require("express");
const router = express.Router();

const User = require("../models/User");

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

module.exports = router;