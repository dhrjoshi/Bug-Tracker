const Bug = require("../models/Bug");

const ProgressStages = [
  "Not Started",
  "In Development",
  "In Code Review",
  "In QA",
  "Ready for Release",
  "Live",
];

const Severities = ["Critical", "High", "Medium", "Low", "Trivial"];

getAnalyticsSummarySimple = async (req, res) => {
  try {
    // Run aggregations in parallel
    const [progressAgg, severityAgg, avgAgg] = await Promise.all([
      // 1) Count by progress (Pie + Funnel)
      Bug.aggregate([
        { $group: { _id: "$progress", count: { $sum: 1 } } },
        { $project: { _id: 0, key: "$_id", count: 1 } },
      ]),

      // 2) Count by severity (Pie)
      Bug.aggregate([
        { $group: { _id: "$severity", count: { $sum: 1 } } },
        { $project: { _id: 0, key: "$_id", count: 1 } },
      ]),

      // 3) Avg time from "In Development" -> "Live"
      // Uses earliest time for each stage per bug. Only counts bugs where Live is after Dev.
      Bug.aggregate([
        { $project: { progressHistory: 1 } },
        {
          $set: {
            devEvents: {
              $filter: {
                input: "$progressHistory",
                as: "h",
                cond: { $eq: ["$$h.stage", "In Development"] },
              },
            },
            liveEvents: {
              $filter: {
                input: "$progressHistory",
                as: "h",
                cond: { $eq: ["$$h.stage", "Live"] },
              },
            },
          },
        },
        {
          $set: {
            devAt: { $min: "$devEvents.at" },
            liveAt: { $min: "$liveEvents.at" },
          },
        },
        {
          $set: {
            devToLiveMs: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$devAt", null] },
                    { $ne: ["$liveAt", null] },
                    { $gt: ["$liveAt", "$devAt"] },
                  ],
                },
                { $subtract: ["$liveAt", "$devAt"] },
                null,
              ],
            },
          },
        },
        { $match: { devToLiveMs: { $ne: null } } },
        {
          $group: {
            _id: null,
            avgMs: { $avg: "$devToLiveMs" },
            sampleSize: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            avgHours: { $divide: ["$avgMs", 1000 * 60 * 60] },
            sampleSize: 1,
          },
        },
      ]),
    ]);

    // ---- Normalize results so frontend always gets all stages/severities (even 0) ----
    const progressMap = new Map(progressAgg.map((x) => [x.key, x.count]));
    const severityMap = new Map(severityAgg.map((x) => [x.key, x.count]));

    const bugsByProgress = ProgressStages.map((stage) => ({
      stage,
      count: progressMap.get(stage) ?? 0,
    }));

    const bugsBySeverity = Severities.map((sev) => ({
      severity: sev,
      count: severityMap.get(sev) ?? 0,
    }));

    // Funnel uses same counts as progress distribution
    const funnelByProgress = bugsByProgress;

    const avgDevToLiveHours = avgAgg?.[0]?.avgHours ?? null;
    const avgDevToLiveSampleSize = avgAgg?.[0]?.sampleSize ?? 0;

    return res.json({
      success: true,
      data: {
        bugsByProgress,        // Pie chart (progress)
        bugsBySeverity,        // Pie chart (severity)
        funnelByProgress,      // Funnel chart (progress)
        avgDevToLiveHours,     // metric (number or null)
        avgDevToLiveSampleSize // helpful to show "based on N bugs"
      },
    });
  } catch (err) {
    console.error("getAnalyticsSummarySimple error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {getAnalyticsSummarySimple};