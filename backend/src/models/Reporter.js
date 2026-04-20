const mongoose = require("mongoose");

const reporterSchema = new mongoose.Schema(
  {
    name: { type: String,trim:true, required: true }
  }
);
const Reporter = mongoose.model("Reporters", reporterSchema);
module.exports = Reporter;
