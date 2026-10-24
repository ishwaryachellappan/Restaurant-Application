const express = require("express");
const router = express.Router();

const MenuItem = require("../models/MenuItem");
const MenuCategory = require("../models/MenuCategory");


/* ==========================================
   CATEGORY MANAGEMENT
========================================== */

// GET CATEGORIES
router.get("/categories", async (req, res) => {
  try {
    const existingCategories = await MenuItem.distinct("category");

    // Import existing menu categories into the category collection.
    for (const value of existingCategories) {
      const name = String(value || "").trim();

      if (name) {
        await MenuCategory.updateOne(
          { name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
          { $setOnInsert: { name } },
          { upsert: true }
        );
      }
    }

    const categories = await MenuCategory.find().sort({
      name: 1,
    });

    return res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load categories.",
    });
  }
});

// ADD CATEGORY
router.post("/categories", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required.",
      });
    }

    const duplicate = await MenuCategory.findOne({
      name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "This category already exists.",
      });
    }

    const category = await MenuCategory.create({ name });

    return res.status(201).json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("Add category error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to add category.",
    });
  }
});

// RENAME CATEGORY
router.patch("/categories/:id", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required.",
      });
    }

    const category = await MenuCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    const duplicate = await MenuCategory.findOne({
      _id: { $ne: category._id },
      name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "This category name already exists.",
      });
    }

    const oldName = category.name;

    // Update existing menu items so they keep their category.
    await MenuItem.updateMany(
      { category: oldName },
      { $set: { category: name } }
    );

    category.name = name;
    await category.save();

    return res.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("Rename category error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to rename category.",
    });
  }
});

// DELETE CATEGORY
router.delete("/categories/:id", async (req, res) => {
  try {
    const category = await MenuCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    const itemsUsingCategory = await MenuItem.countDocuments({
      category: category.name,
    });

    if (itemsUsingCategory > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This category is assigned to menu items. Reassign or delete those items first.",
      });
    }

    await category.deleteOne();

    return res.json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to delete category.",
    });
  }
});



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