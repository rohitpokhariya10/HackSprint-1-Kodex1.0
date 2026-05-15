const mongoose = require("mongoose");
const dns = require("dns");

// Force Node.js to use Google DNS for MongoDB Atlas SRV lookup
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// Prefer IPv4 first
dns.setDefaultResultOrder("ipv4first");

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing");
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`MongoDB connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error("Failed to connect DB:", error.message);
    throw error;
  }
};

module.exports = connectDB;
