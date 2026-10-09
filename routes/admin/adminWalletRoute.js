const express = require("express");
const {
  getWallets,
  getWalletByUser,
  creditUserWallet,
  debitUserWallet,
  freezeWallet,
  unfreezeWallet,
} = require("../../controllers/admin/walletController");
const { adminAuthToken } = require("../../middleware/adminAuth");

const router = express.Router();

router.use(adminAuthToken);

router.get("/", getWallets);
router.get("/:userId", getWalletByUser);
router.post("/:userId/credit", creditUserWallet);
router.post("/:userId/debit", debitUserWallet);
router.post("/:userId/freeze", freezeWallet);
router.post("/:userId/unfreeze", unfreezeWallet);

module.exports = router;
