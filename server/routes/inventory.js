const express = require("express");

const InventoryItem = require("../models/InventoryItem");
const StockMovement = require("../models/StockMovement");

const router = express.Router();

// =====================================================
// STOCK STATUS HELPER
// =====================================================

const calculateStockStatus = (currentStock, minimumStock) => {
  if (currentStock <= 0) {
    return "OUT_OF_STOCK";
  }

  if (currentStock <= minimumStock) {
    return "LOW_STOCK";
  }

  return "IN_STOCK";
};

// =====================================================
// GET ALL INVENTORY ITEMS
// =====================================================

router.get("/", async (req, res) => {
  try {
    const items = await InventoryItem.find({
      active: true,
    }).sort({
      category: 1,
      name: 1,
    });

    return res.json({
      success: true,
      items,
    });
  } catch (error) {
    console.error("Get inventory error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load inventory.",
      error: error.message,
    });
  }
});

// =====================================================
// GET ALL STOCK MOVEMENTS
// IMPORTANT: Must be BEFORE /:id
// =====================================================

router.get("/history/all", async (req, res) => {
  try {
    const movements = await StockMovement.find()
      .sort({
        createdAt: -1,
      })
      .limit(200);

    return res.json({
      success: true,
      movements,
    });
  } catch (error) {
    console.error("Get inventory history error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load inventory history.",
      error: error.message,
    });
  }
});

// =====================================================
// GET SINGLE INVENTORY ITEM
// =====================================================

router.get("/:id", async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found.",
      });
    }

    return res.json({
      success: true,
      item,
    });
  } catch (error) {
    console.error("Get inventory item error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load inventory item.",
      error: error.message,
    });
  }
});

// =====================================================
// CREATE INVENTORY ITEM
// =====================================================

router.post("/", async (req, res) => {
  try {
    const {
      name,
      category,
      unit,
      currentStock,
      minimumStock,
      maximumStock,
      supplier,
      costPerUnit,
      notes,
      createdBy,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Inventory item name is required.",
      });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category is required.",
      });
    }

    if (!unit) {
      return res.status(400).json({
        success: false,
        message: "Unit is required.",
      });
    }

    const stock = Number(currentStock || 0);
    const minimum = Number(minimumStock || 0);
    const maximum = Number(maximumStock || 0);
    const cost = Number(costPerUnit || 0);

    if (!Number.isFinite(stock) || stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Current stock must be a valid number.",
      });
    }

    if (!Number.isFinite(minimum) || minimum < 0) {
      return res.status(400).json({
        success: false,
        message: "Minimum stock must be a valid number.",
      });
    }

    if (!Number.isFinite(maximum) || maximum < 0) {
      return res.status(400).json({
        success: false,
        message: "Maximum stock cannot be negative.",
      });
    }

    if (!Number.isFinite(cost) || cost < 0) {
      return res.status(400).json({
        success: false,
        message: "Cost per unit must be a valid number.",
      });
    }

    const existing = await InventoryItem.findOne({
      name: {
        $regex: `^${name.trim()}$`,
        $options: "i",
      },
      active: true,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An inventory item with this name already exists.",
      });
    }

    const item = await InventoryItem.create({
      name: name.trim(),
      category: category.trim(),
      unit,
      currentStock: stock,
      minimumStock: minimum,
      maximumStock: maximum,
      supplier: supplier?.trim() || "",
      costPerUnit: cost,
      notes: notes?.trim() || "",
      createdBy: createdBy?.trim() || "",
      updatedBy: createdBy?.trim() || "",
      status: calculateStockStatus(stock, minimum),
    });

    // Record initial stock
    if (stock > 0) {
      await StockMovement.create({
        inventoryItemId: item._id,
        inventoryItemName: item.name,
        movementType: "STOCK_IN",
        quantity: stock,
        previousStock: 0,
        newStock: stock,
        reason: "Initial stock",
        performedBy: createdBy?.trim() || "",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Inventory item created successfully.",
      item,
    });
  } catch (error) {
    console.error("Create inventory error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create inventory item.",
      error: error.message,
    });
  }
});

// =====================================================
// UPDATE INVENTORY ITEM DETAILS
// =====================================================

router.patch("/:id", async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found.",
      });
    }

    const {
      name,
      category,
      unit,
      minimumStock,
      maximumStock,
      supplier,
      costPerUnit,
      notes,
      updatedBy,
    } = req.body;

    if (name !== undefined && !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Inventory item name cannot be empty.",
      });
    }

    if (category !== undefined && !String(category).trim()) {
      return res.status(400).json({
        success: false,
        message: "Category cannot be empty.",
      });
    }

    if (
      minimumStock !== undefined &&
      (
        !Number.isFinite(Number(minimumStock)) ||
        Number(minimumStock) < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Minimum stock cannot be negative.",
      });
    }

    if (
      maximumStock !== undefined &&
      (
        !Number.isFinite(Number(maximumStock)) ||
        Number(maximumStock) < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Maximum stock cannot be negative.",
      });
    }

    if (name !== undefined) {
      item.name = String(name).trim();
    }

    if (category !== undefined) {
      item.category = String(category).trim();
    }

    if (unit !== undefined) {
      item.unit = unit;
    }

    if (minimumStock !== undefined) {
      item.minimumStock = Number(minimumStock);
    }

    if (maximumStock !== undefined) {
      item.maximumStock = Number(maximumStock);
    }

    if (supplier !== undefined) {
      item.supplier = String(supplier).trim();
    }

    if (costPerUnit !== undefined) {
      const cost = Number(costPerUnit);

      if (!Number.isFinite(cost) || cost < 0) {
        return res.status(400).json({
          success: false,
          message: "Cost per unit must be a valid number.",
        });
      }

      item.costPerUnit = cost;
    }

    if (notes !== undefined) {
      item.notes = String(notes).trim();
    }

    if (updatedBy !== undefined) {
      item.updatedBy = String(updatedBy).trim();
    }

    // Recalculate status BEFORE saving
    item.status = calculateStockStatus(
      item.currentStock,
      item.minimumStock
    );

    await item.save();

    return res.json({
      success: true,
      message: "Inventory item updated successfully.",
      item,
    });
  } catch (error) {
    console.error("Update inventory error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update inventory item.",
      error: error.message,
    });
  }
});

// =====================================================
// ADD STOCK
// =====================================================

router.post("/:id/stock-in", async (req, res) => {
  try {
    const {
      quantity,
      reason,
      performedBy,
    } = req.body;

    const amount = Number(quantity);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Stock quantity must be greater than zero.",
      });
    }

    const item = await InventoryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found.",
      });
    }

    const previousStock = item.currentStock;
    const newStock = previousStock + amount;

    item.currentStock = newStock;

    item.updatedBy = performedBy?.trim() || item.updatedBy;

    item.status = calculateStockStatus(
      item.currentStock,
      item.minimumStock
    );

    await item.save();

    await StockMovement.create({
      inventoryItemId: item._id,
      inventoryItemName: item.name,
      movementType: "STOCK_IN",
      quantity: amount,
      previousStock,
      newStock,
      reason: reason?.trim() || "Stock received",
      performedBy: performedBy?.trim() || "",
    });

    return res.json({
      success: true,
      message: "Stock added successfully.",
      item,
    });
  } catch (error) {
    console.error("Stock in error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add stock.",
      error: error.message,
    });
  }
});

// =====================================================
// REMOVE / USE STOCK
// =====================================================

router.post("/:id/stock-out", async (req, res) => {
  try {
    const {
      quantity,
      reason,
      performedBy,
    } = req.body;

    const amount = Number(quantity);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Stock quantity must be greater than zero.",
      });
    }

    const item = await InventoryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found.",
      });
    }

    const previousStock = item.currentStock;
    const newStock = previousStock - amount;

    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${previousStock} ${item.unit}.`,
      });
    }

    item.currentStock = newStock;

    item.updatedBy = performedBy?.trim() || item.updatedBy;

    item.status = calculateStockStatus(
      item.currentStock,
      item.minimumStock
    );

    await item.save();

    await StockMovement.create({
      inventoryItemId: item._id,
      inventoryItemName: item.name,
      movementType: "STOCK_OUT",
      quantity: amount,
      previousStock,
      newStock,
      reason: reason?.trim() || "Stock used",
      performedBy: performedBy?.trim() || "",
    });

    return res.json({
      success: true,
      message: "Stock reduced successfully.",
      item,
    });
  } catch (error) {
    console.error("Stock out error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reduce stock.",
      error: error.message,
    });
  }
});

// =====================================================
// STOCK ADJUSTMENT
// =====================================================

router.post("/:id/adjust", async (req, res) => {
  try {
    const {
      newStock,
      reason,
      performedBy,
    } = req.body;

    const adjustedStock = Number(newStock);

    if (
      !Number.isFinite(adjustedStock) ||
      adjustedStock < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "New stock must be zero or greater.",
      });
    }

    const item = await InventoryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found.",
      });
    }

    // IMPORTANT:
    // Save the old stock BEFORE changing it.
    const previousStock = item.currentStock;

    item.currentStock = adjustedStock;

    item.updatedBy = performedBy?.trim() || item.updatedBy;

    item.status = calculateStockStatus(
      item.currentStock,
      item.minimumStock
    );

    await item.save();

    await StockMovement.create({
      inventoryItemId: item._id,
      inventoryItemName: item.name,
      movementType: "ADJUSTMENT",
      quantity: Math.abs(adjustedStock - previousStock),
      previousStock,
      newStock: adjustedStock,
      reason: reason?.trim() || "Stock adjustment",
      performedBy: performedBy?.trim() || "",
    });

    return res.json({
      success: true,
      message: "Stock adjusted successfully.",
      item,
    });
  } catch (error) {
    console.error("Stock adjustment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to adjust stock.",
      error: error.message,
    });
  }
});

// =====================================================
// GET STOCK MOVEMENT HISTORY FOR ITEM
// =====================================================

router.get("/:id/movements", async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found.",
      });
    }

    const movements = await StockMovement.find({
      inventoryItemId: item._id,
    }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      movements,
    });
  } catch (error) {
    console.error("Get stock movements error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load stock history.",
      error: error.message,
    });
  }
});

// =====================================================
// DELETE / DEACTIVATE INVENTORY ITEM
// =====================================================

router.delete("/:id", async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found.",
      });
    }

    item.active = false;

    await item.save();

    return res.json({
      success: true,
      message: "Inventory item removed successfully.",
    });
  } catch (error) {
    console.error("Delete inventory error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to remove inventory item.",
      error: error.message,
    });
  }
});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;