const mongoose = require("mongoose")

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log("Connect to DB");

  } catch (error) {
    console.log("Failed to connect DB:", error);
  }
}

module.exports = connectDB
