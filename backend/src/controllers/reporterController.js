const Reporter = require("../models/Reporter");

async function createReporter(req,res){
    try{
       const {name} = req.body;
       if(!name){
          return res.status(400).json({
            success:false,
            message:"Missing name",
          });
       }

       const reporter = await Reporter.create({name});
       return res.status(201).json({
           success:true,
           message:"Reporter created successfully",
           data: reporter
       });

    }catch(e){
        console.error("Unable to create reporter",e);
         return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
    }
}

async function getAllReporters(req,res){
    try{
       const reporters = await Reporter.find().sort({createdAt: -1});

       return res.status(200).json({
           success: true,
           count: reporters.length,
           data: reporters,
       });
    }catch(e){
        console.error("Unable to fetch reporters list",e);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch vendors",
            error: error.message,
        });
    }
}

module.exports = {createReporter,getAllReporters};