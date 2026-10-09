const express = require("express");
const { getStats } = require("../../controllers/admin/dashboardController");
const { adminAuthToken } = require("../../middleware/adminAuth");

const router = express.Router();

router.get("/stats", adminAuthToken, getStats);

module.exports = router;
