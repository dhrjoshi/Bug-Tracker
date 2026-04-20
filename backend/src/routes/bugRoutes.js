const express = require("express");
const router = express.Router();
const {createBug,getAllBugs,patchBugProgress,deleteBug} = require("../controllers/bugController");
const {getAnalyticsSummarySimple} =require("../controllers/analyticsController");

router.post("/create/bug",createBug);
router.get("/getAll/bugs",getAllBugs);
router.get("/getBug/analytics",getAnalyticsSummarySimple);
router.patch("/patch/bug-progress/:id",patchBugProgress);
router.delete("/delete/bug/:id",deleteBug);

module.exports = router;