const express = require("express");
const Table = require("../models/Table");
const RestaurantSettings = require("../models/RestaurantSettings");

const router = express.Router();


// ======================================================
// GET ALL TABLES
// Also synchronizes MongoDB tables with Restaurant Settings
// ======================================================

router.get("/", async (req, res) => {
  try {

    // ------------------------------------------
    // GET CURRENT RESTAURANT TABLE COUNT
    // ------------------------------------------

    const settings =
      await RestaurantSettings.findOne();

    const configuredTableCount =
      Number(settings?.tableCount || 12);

    const tableCount =
      Number.isInteger(configuredTableCount) &&
      configuredTableCount > 0
        ? configuredTableCount
        : 12;


    // ------------------------------------------
    // GET EXISTING TABLES
    // ------------------------------------------

    let tables =
      await Table.find().sort({
        tableNumber: 1,
      });


    // ------------------------------------------
    // CREATE MISSING TABLES
    // ------------------------------------------

    const existingTableNumbers =
      new Set(
        tables.map(
          (table) =>
            Number(table.tableNumber)
        )
      );


    const newTables = [];

    for (
      let tableNumber = 1;
      tableNumber <= tableCount;
      tableNumber++
    ) {

      if (
        !existingTableNumbers.has(
          tableNumber
        )
      ) {

        newTables.push({
          tableNumber,

          name:
            `Table ${tableNumber}`,

          // Default capacity for newly
          // created tables.
          capacity: 4,

          status: "AVAILABLE",

          currentOrder: null,
        });

      }
    }


    // ------------------------------------------
    // INSERT NEW TABLES
    // ------------------------------------------

    if (newTables.length > 0) {

      await Table.insertMany(
        newTables
      );

    }


    // ------------------------------------------
    // REMOVE EXTRA AVAILABLE TABLES
    //
    // IMPORTANT:
    // Never remove an occupied table.
    // Never remove a table with an order.
    // ------------------------------------------

    if (tables.length > tableCount) {

      await Table.deleteMany({
        tableNumber: {
          $gt: tableCount,
        },

        status: "AVAILABLE",

        currentOrder: null,
      });

    }


    // ------------------------------------------
    // FETCH FINAL TABLE LIST
    // ------------------------------------------

    tables =
      await Table.find().sort({
        tableNumber: 1,
      });


    // ------------------------------------------
    // RESPONSE
    // ------------------------------------------

    return res.json({
      success: true,
      tables,
    });

  } catch (error) {

    console.error(
      "Fetch tables error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch tables.",
    });

  }
});


module.exports = router;