const express = require("express");

const router = express.Router();

const authToken = require("../../middleware/auth");

const {
  getCountries,
  getProducts,
  buyActivationNumber,
  buyHostingNumber,
  checkOrder,
  finishOrder,
  cancelOrder,
  banOrder,
  getSmsInbox,
  getBalance,
} = require("../../controllers/fivesim/fivesimController");

router.get("/countries", getCountries);

router.get("/products/:country", getProducts);

router.post("/buy/activation", authToken, buyActivationNumber);

router.post("/buy/hosting", authToken, buyHostingNumber);

router.get("/order/:orderId", authToken, checkOrder);

router.post("/order/:orderId/finish", authToken, finishOrder);

router.post("/order/:orderId/cancel", authToken, cancelOrder);

router.post("/order/:orderId/ban", authToken, banOrder);

router.get("/order/:orderId/inbox", authToken, getSmsInbox);

router.get("/balance", authToken, getBalance);

module.exports = router;
