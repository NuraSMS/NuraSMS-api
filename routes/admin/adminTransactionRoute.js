const express = require("express");
const {
  getTransactions,
  getTransactionById,
  updateTransactionStatus,
} = require("../../controllers/admin/transactionController");
const { adminAuthToken, requireAdminRole } = require("../../middleware/adminAuth");

const router = express.Router();

router.use(adminAuthToken);

router.get("/", getTransactions);
router.get("/:id", getTransactionById);
router.patch("/:id/status", requireAdminRole("superadmin"), updateTransactionStatus);

module.exports = router;
