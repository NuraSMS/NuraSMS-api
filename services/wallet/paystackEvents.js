const crypto = require("crypto");
const VirtualAccountModel = require("../../models/VirtualAccounts");
const TransactionModel = require("../../models/Transactions");
const WalletModel = require("../../models/Wallet");
const creditWallet = require("./creditWallet");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

const processPaystackEvent = async (req, res) => {
  const hash = req.headers["x-paystack-signature"];
  const payload = JSON.stringify(req.body);
  // const payload = req.body.toString();

  // Verify signature came from Paystack
  const computedHash = crypto
    .createHmac("sha512", PAYSTACK_SECRET)
    .update(payload)
    .digest("hex");

  console.log(hash, computedHash);

  if (hash !== computedHash) {
    console.log("invalid signature");
    return res.status(400).send("Invalid signature");
  }

  const event = req.body;

  // Handle dedicated account creation success
  if (event.event === "dedicatedaccount.assign.success") {
    console.log("DVA created:", event.data);
    const data = event.data;
    try {
      await VirtualAccountModel.create({
        user: event.data.customer.metadata.userId,
        customer: data.customer,
        dedicatedAccount: data.dedicated_account,
      });
      console.log("DVA stored in DB successfully");
    } catch (err) {
      console.error("Error storing DVA in DB:", err);
    }
  }

  // handle wallet funding
  else if (event.event === "charge.success") {
    console.log("Wallet funded:", event.data);

    const data = event.data;
    console.log(data);

    try {
      const accountNumber = data.authorization.receiver_bank_account_number;

      // get the user with the acct
      const virtualAccount = await virtualAccountModel.findOne({
        "dedicatedAccount.account_number": accountNumber,
      });

      if (!virtualAccount) {
        console.log("Virtual account not found");
        return res.sendStatus(200);
      }

      // to prevent duplicate transactions
      const existingTx = await TransactionModel.findOne({
        reference: data.reference,
      });

      if (existingTx) {
        console.log("Duplicate transaction");
        return res.sendStatus(200);
      }

      // credit wallet
      await creditWallet({
        userId: virtualAccount.user,
        amount: data.amount / 100,
        reference: data.reference,
        source: "PAYSTACK",
        meta: data,
      });

      console.log("Wallet credited successfully");
    } catch (err) {
      console.error("Funding error:", err);
    }
  }

  // Handle dedicated account creation failure
  else if (event.event === "dedicatedaccount.assign.failed") {
    console.log("DVA creation failed:", event);
    // Optionally, store failed attempt in DB
  }

  // Handle other/unexpected events
  else {
    console.log("Unhandled event:", event.event);
  }

  res.sendStatus(200);
};

module.exports = { processPaystackEvent };