const mongoose = require("mongoose");
require("dotenv").config();

const Table = require("./models/Table");

const tables = [
  {
    tableNumber: 1,
    name: "Table 1",
    capacity: 2,
    status: "AVAILABLE",
  },
  {
    tableNumber: 2,
    name: "Table 2",
    capacity: 2,
    status: "AVAILABLE",
  },
  {
    tableNumber: 3,
    name: "Table 3",
    capacity: 4,
    status: "AVAILABLE",
  },
  {
    tableNumber: 4,
    name: "Table 4",
    capacity: 4,
    status: "AVAILABLE",
  },
  {
    tableNumber: 5,
    name: "Table 5",
    capacity: 4,
    status: "AVAILABLE",
  },
  {
    tableNumber: 6,
    name: "Table 6",
    capacity: 6,
    status: "AVAILABLE",
  },
  {
    tableNumber: 7,
    name: "Table 7",
    capacity: 6,
    status: "AVAILABLE",
  },
  {
    tableNumber: 8,
    name: "Table 8",
    capacity: 8,
    status: "AVAILABLE",
  },
  {
    tableNumber: 9,
    name: "Table 9",
    capacity: 4,
    status: "AVAILABLE",
  },
  {
    tableNumber: 10,
    name: "Table 10",
    capacity: 4,
    status: "AVAILABLE",
  },
  {
    tableNumber: 11,
    name: "Table 11",
    capacity: 2,
    status: "AVAILABLE",
  },
  {
    tableNumber: 12,
    name: "Table 12",
    capacity: 2,
    status: "AVAILABLE",
  },
];

async function createTables() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB");

    for (const tableData of tables) {
      const existingTable = await Table.findOne({
        tableNumber: tableData.tableNumber,
      });

      if (existingTable) {
        console.log(
          `${tableData.name} already exists`
        );
        continue;
      }

      await Table.create(tableData);

      console.log(
        `${tableData.name} created`
      );
    }

    console.log("Table setup completed.");
  } catch (error) {
    console.error(
      "Error creating tables:",
      error.message
    );
  } finally {
    await mongoose.connection.close();
  }
}

createTables();