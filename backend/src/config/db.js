const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const DB_URL = process.env.MONGO_URL;

const connectDB = async () => {
  try {
    await mongoose.connect(DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);   }
};

module.exports = connectDB;