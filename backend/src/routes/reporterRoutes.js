const express = require("express");
const router = express.Router();
const {createReporter,getAllReporters} = require("../controllers/reporterController");

router.post("/create/reporter",createReporter);
router.get("/getAll/reporters",getAllReporters);

module.exports = router;
