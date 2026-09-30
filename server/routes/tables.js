const express = require("express");
const Table = require("../models/Table");

const router = express.Router();

// Get all tables
router.get("/", async (req, res) => {
  try {
    const tables = await Table.find()
      .sort({ tableNumber: 1 });

    res.status(200).json({
      success: true,
      tables,
    });
  } catch (error) {
    console.error("Error fetching tables:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch tables.",
    });
  }
});

module.exports = router;