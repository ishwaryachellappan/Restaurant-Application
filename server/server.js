const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const tableRoutes = require("./routes/tables");
const orderRoutes = require("./routes/orders");
const kitchenRoutes = require("./routes/kitchen");
const cashierRoutes = require("./routes/cashier");
const staffRoutes = require("./routes/staff");
const menuRoutes = require("./routes/menu");
const taxRoutes = require("./routes/tax");

require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/kitchen", kitchenRoutes);
app.use("/api/cashier", cashierRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/tax", taxRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:");
    console.error(error.message);
  });

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Restaurant POS backend is running",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});