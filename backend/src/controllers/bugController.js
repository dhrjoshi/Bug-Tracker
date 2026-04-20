const Bug = require("../models/Bug");
const mongoose = require("mongoose");

async function createBug(req,res){
    try{  
        const {
            title,
            severity,
            progress,
            reporterName,
            estimatedFixHours,
            dateReported,
        } = req.body;

        if (
            !title ||
            !severity ||
            !progress ||
            !reporterName ||
            estimatedFixHours === undefined ||
            !dateReported
        ) {
            return res.status(400).json({
            success: false,
            message: "Missing required fields.",
            });
        }

        const reportedDateObj = new Date(dateReported);
        if (Number.isNaN(reportedDateObj.getTime())) {
        return res.status(400).json({
            success: false,
            message: "Invalid dateReported.",
        });
        }

        const now = new Date();

        const bug = await Bug.create({
        title,
        severity,
        progress,
        reporterName,
        estimatedFixHours: Number(estimatedFixHours),
        dateReported: reportedDateObj,
        reportedAt: now, 
        progressHistory: [{ stage: progress, at: now }],
        });

        return res.status(201).json({
        success: true,
        message: "Bug created successfully",
        data: bug,
        });
    }catch(error){
        console.error("Create bug error:", err);
        return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
    }
}

async function getAllBugs(req,res){
    try{
        const bugs = await Bug.find().sort({createdAt:-1});
        return res.status(200).json({
            success:true,
            count: bugs.length,
            data:bugs
        });
    }catch(e){
        console.error("Unable to fetch all bug",e);
        return res.status(500).json({
            success:false,
            message:"Internal server error",
        });
    }
}

async function patchBugProgress(req,res){
      try {
        const { id } = req.params;
        const { progress } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid bug id" });
        }

        if (!progress) {
          return res.status(400).json({
            success: false,
            message: "Invalid progress",
          });
        }

        const now = new Date();
        const updated = await Bug.findByIdAndUpdate(
          id,
          {
            $set: { progress },
            $push: { progressHistory: { stage: progress, at: now } },
          },
          { new: true }
        );

        if (!updated) {
          return res
            .status(404)
            .json({ success: false, message: "Bug not found" });
        }

        return res.json({
          success: true,
          message: "Bug progress updated",
          data: updated,
        });
      } catch (err) {
        console.error("patchBugProgress error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }
}

async function deleteBug(req,res){
    try{
        const {id} = req.params;
        const deleteBug = await Bug.findByIdAndDelete(id);
        return res.status(200).json({
            success:true,
            message:"Bug deleted successfully"
        });
    }catch(e){
      console.error("Unable to delete bug".e);
      return res.status(500).json({
        success:false,
        message:"Something went wrong while deleting bug",
      })
    }
}

module.exports = {createBug,getAllBugs,patchBugProgress,deleteBug};