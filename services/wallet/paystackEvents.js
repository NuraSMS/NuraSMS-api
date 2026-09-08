const crypto = require("crypto");
const VirtualAccountModel = require("../../models/VirtualAccounts");
const TransactionModel = require("../../models/Transactions");
const UserModel = require("../../models/User"); // Change this path/name if needed
const creditWallet = require("./creditWallet");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

const processPaystackEvent = async (req, res) => {
  const signature = req.headers["x-paystack-signature"];
  const payload = JSON.stringify(req.body);

  const computedHash = crypto
    .createHmac("sha512", PAYSTACK_SECRET)
    .update(payload)
    .digest("hex");

  const isValidSignature =
    signature &&
    signature.length === computedHash.length &&
    crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedHash)
    );

  if (!isValidSignature) {
    console.log("Invalid Paystack webhook signature");
    return res.status(400).send("Invalid signature");
  }

  const event = req.body;

  // Dedicated virtual account successfully created
  if (event.event === "dedicatedaccount.assign.success") {
    console.log("DVA created:", event.data);

    const data = event.data;

    try {
      const email = data.customer?.email?.trim().toLowerCase();
      const accountNumber = data.dedicated_account?.account_number;

      if (!email || !accountNumber) {
        console.error("DVA webhook is missing customer email or account number", {
          email,
          accountNumber,
        });

        return res.sendStatus(200);
      }

      // Find the app user using the same email sent to Paystack
      const user = await UserModel.findOne({ email }).select("_id");

      if (!user) {
        console.error("No user found for Paystack DVA webhook", { email });

        return res.sendStatus(200);
      }

      // Upsert prevents duplicate DVA records if Paystack retries the webhook
      await VirtualAccountModel.findOneAndUpdate(
        {
          "dedicatedAccount.account_number": accountNumber,
        },
        {
          $set: {
            user: user._id,
            customer: data.customer,
            dedicatedAccount: data.dedicated_account,
          },
        },
        {
          upsert: true,
          new: true,
        }
      );

      console.log("DVA stored in DB successfully");
    } catch (err) {
      console.error("Error storing DVA in DB:", err);
    }
  }

  // Wallet funding
  else if (event.event === "charge.success") {
    console.log("Wallet funded:", event.data);

    const data = event.data;

    try {
      const accountNumber =
        data.authorization?.receiver_bank_account_number;

      if (!accountNumber) {
        console.log("No receiving account number in this charge event");
        return res.sendStatus(200);
      }

      const virtualAccount = await VirtualAccountModel.findOne({
        "dedicatedAccount.account_number": accountNumber,
      });

      if (!virtualAccount) {
        console.log("Virtual account not found", { accountNumber });
        return res.sendStatus(200);
      }

      const existingTx = await TransactionModel.findOne({
        reference: data.reference,
      });

      if (existingTx) {
        console.log("Duplicate transaction", { reference: data.reference });
        return res.sendStatus(200);
      }

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

  // DVA creation failure
  else if (event.event === "dedicatedaccount.assign.failed") {
    console.log("DVA creation failed:", event.data);
  }

  // Other Paystack events
  else {
    console.log("Unhandled Paystack event:", event.event);
  }

  return res.sendStatus(200);
};

module.exports = { processPaystackEvent };