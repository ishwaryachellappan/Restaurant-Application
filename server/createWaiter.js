const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

async function createWaiter() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB");

    const existingWaiter = await User.findOne({
      username: "waiter01",
    });

    if (existingWaiter) {
      console.log("waiter01 already exists.");
      return;
    }

    const hashedPassword = await bcrypt.hash("1234", 10);

    const waiter = await User.create({
      username: "waiter01",
      password: hashedPassword,
      name: "Main Waiter",
      role: "WAITER",
      status: "ACTIVE",
    });

    console.log("Waiter created successfully!");
    console.log({
      username: waiter.username,
      name: waiter.name,
      role: waiter.role,
      status: waiter.status,
    });
  } catch (error) {
    console.error("Error creating waiter:", error.message);
  } finally {
    await mongoose.connection.close();
  }
}

createWaiter();