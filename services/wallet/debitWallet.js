const mongoose = require("mongoose");
const WalletModel = require("../../models/Wallet");
const TransactionModel = require("../../models/Transactions");

const debitWallet = async (userId, amount, reference, meta = {}) => {
  if (!amount || amount <= 0) {
    throw new Error("Invalid amount");
  }

  if (!reference) {
    throw new Error("Transaction reference is required");
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existing = await TransactionModel.findOne({
      reference,
    }).session(session);

    if (existing) {
      throw new Error("Duplicate transaction");
    }

    const wallet = await WalletModel.findOne({
      user: userId,
    }).session(session);

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    if (wallet.isFrozen) {
      throw new Error("Wallet is frozen");
    }

    if (wallet.balance < amount) {
      throw new Error("Insufficient balance");
    }

    const previousBalance = wallet.balance;

    wallet.balance -= amount;

    await wallet.save({ session });

    await TransactionModel.create(
      [
        {
          user: userId,
          type: "debit",
          amount,
          reference,
          previousBalance,
          currentBalance: wallet.balance,
          status: "success",
          meta,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return {
      success: true,
      previousBalance,
      currentBalance: wallet.balance,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

module.exports = debitWallet;