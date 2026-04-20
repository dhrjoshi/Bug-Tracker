const mongoose = require("mongoose");

const ProgressStages = [
  "Not Started",
  "In Development",
  "In Code Review",
  "In QA",
  "Ready for Release",
  "Live",
];

const Severities = ["Critical", "High", "Medium", "Low", "Trivial"];

const progressHistorySchema = new mongoose.Schema(
  {
    stage: { type: String, enum: ProgressStages, required: true },
    at: { type: Date, required: true },
  },
  { _id: false }
);

const bugSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    severity: { type: String, enum: Severities, required: true },
    progress: { type: String, enum: ProgressStages, required: true },
    reporterName: { type: String, required: true, trim: true },
    estimatedFixHours: { type: Number, required: true, min: 0 },
    dateReported: { type: Date, required: true },
    reportedAt: { type: Date, required: true, default: Date.now },
    progressHistory: { type: [progressHistorySchema], default: [] },
  },
  { timestamps: true }
);

const Bug = mongoose.model("Bugs", bugSchema);
module.exports = Bug;
