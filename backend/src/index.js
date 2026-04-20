const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("../src/config/db");
const cors = require("cors");
const bugRoutes = require("./routes/bugRoutes");
const reporterRoutes = require("./routes/reporterRoutes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
connectDB();

app.use(cors());
app.use(express.json());
app.use("/api",bugRoutes);
app.use("/api",reporterRoutes);
app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
