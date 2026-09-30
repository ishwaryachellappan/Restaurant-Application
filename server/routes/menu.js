const express = require("express");
const router = express.Router();

const MenuItem = require("../models/MenuItem");

// ==========================================
// GET ALL MENU ITEMS
// ==========================================

router.get("/", async (req, res) => {
  try {
    const items = await MenuItem.find().sort({
      category: 1,
      name: 1,
    });

    res.json({
      success: true,
      items,
    });
  } catch (error) {
    console.error("Get menu error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load menu items.",
    });
  }
});

// ==========================================
// GET AVAILABLE MENU ITEMS
// ==========================================

router.get("/available", async (req, res) => {
  try {
    const items = await MenuItem.find({
      available: true,
    }).sort({
      category: 1,
      name: 1,
    });

    res.json({
      success: true,
      items,
    });
  } catch (error) {
    console.error("Get available menu error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load available menu items.",
    });
  }
});

// ==========================================
// CREATE MENU ITEM
// ==========================================

router.post("/", async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      description,
      foodType,
      available,
    } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, category and price are required.",
      });
    }

    const item = await MenuItem.create({
      name: name.trim(),
      category: category.trim(),
      price: Number(price),
      description: description?.trim() || "",
      foodType: foodType || "VEG",
      available:
        available === undefined ? true : Boolean(available),
    });

    res.status(201).json({
      success: true,
      item,
    });
  } catch (error) {
    console.error("Create menu item error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create menu item.",
    });
  }
});

// ==========================================
// UPDATE MENU ITEM
// ==========================================

router.patch("/:id", async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      description,
      foodType,
      available,
    } = req.body;

    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      {
        ...(name !== undefined && {
          name: name.trim(),
        }),

        ...(category !== undefined && {
          category: category.trim(),
        }),

        ...(price !== undefined && {
          price: Number(price),
        }),

        ...(description !== undefined && {
          description: description.trim(),
        }),

        ...(foodType !== undefined && {
          foodType,
        }),

        ...(available !== undefined && {
          available: Boolean(available),
        }),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found.",
      });
    }

    res.json({
      success: true,
      item,
    });
  } catch (error) {
    console.error("Update menu item error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update menu item.",
    });
  }
});

// ==========================================
// DELETE MENU ITEM
// ==========================================

router.delete("/:id", async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(
      req.params.id
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found.",
      });
    }

    res.json({
      success: true,
      message: "Menu item deleted successfully.",
    });
  } catch (error) {
    console.error("Delete menu item error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to delete menu item.",
    });
  }
});

module.exports = router;