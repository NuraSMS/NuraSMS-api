const express = require("express");
const {
  getVirtualAccounts,
  getVirtualAccountByUser,
} = require("../../controllers/admin/virtualAccountController");
const { adminAuthToken } = require("../../middleware/adminAuth");

const router = express.Router();

router.use(adminAuthToken);

router.get("/", getVirtualAccounts);
router.get("/:userId", getVirtualAccountByUser);

module.exports = router;
