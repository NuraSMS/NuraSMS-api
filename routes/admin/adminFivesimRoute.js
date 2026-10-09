const express = require("express");
const {
  getProviderBalance,
  getProviderProfile,
  getOrders,
  getOrderById,
  finishOrder,
  cancelOrder,
  banOrder,
} = require("../../controllers/admin/fivesimController");
const { adminAuthToken } = require("../../middleware/adminAuth");

const router = express.Router();

router.use(adminAuthToken);

router.get("/balance", getProviderBalance);
router.get("/profile", getProviderProfile);
router.get("/orders", getOrders);
router.get("/orders/:orderId", getOrderById);
router.post("/orders/:orderId/finish", finishOrder);
router.post("/orders/:orderId/cancel", cancelOrder);
router.post("/orders/:orderId/ban", banOrder);

module.exports = router;
