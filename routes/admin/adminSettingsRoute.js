const express = require("express");
const {
  getPlatformSettings,
  updatePlatformSettings,
} = require("../../controllers/admin/settingsController");
const { adminAuthToken, requireAdminRole } = require("../../middleware/adminAuth");

const router = express.Router();

router.use(adminAuthToken);

router.get("/", getPlatformSettings);
router.patch("/", requireAdminRole("superadmin"), updatePlatformSettings);

module.exports = router;
