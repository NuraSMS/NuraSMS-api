const mongoose = require("mongoose");
const WalletModel = require("../../models/Wallet");
const TransactionModel = require("../../models/Transactions");

const creditWallet = async ({
  userId,
  amount,
  reference,
  meta = {},
  source = "SYSTEM",
}) => {
  console.log("Crediting wallet:", { userId, amount, reference, meta, source });
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existing = await transactionModel
      .findOne({
        reference,
      })
      .session(session);

    if (existing) {
      throw new Error("Duplicate transaction");
    }

    const wallet = await walletModel.findOneAndUpdate(
      {
        user: userId,
        isFrozen: false,
      },
      {
        $inc: {
          balance: amount,
        },
      },
      {
        new: true,
        session,
        upsert: true,
      },
    );

    await transactionModel.create(
      [
        {
          user: userId,
          type: "credit",
          amount,
          previousBalance: wallet.balance - amount,
          currentBalance: wallet.balance,
          reference,
          status: "success",
          meta,
          source,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    // this is for push Notification 

    // Fire-and-forget notification — must never block or roll back a successful credit
    // const { sendPushNotification } = require("../notificationService");
    // console.log("Sending push notification for wallet credit:", {
    //   userId,
    //   amount,
    //   reference,
    // });
    // sendPushNotification(
    //   userId,
    //   "Wallet Funded",
    //   `Your wallet has been credited with ₦${amount.toLocaleString()}`,
    //   { type: "payment", reference, screen: "/Transaction-Details" },
    //   "payment"
    // ).catch((err) => console.error("Deposit notification error:", err));

    return wallet;
  } catch (error) {
    await session.abortTransaction();

    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = creditWallet;