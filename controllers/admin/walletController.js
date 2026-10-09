const WalletModel = require("../../models/Wallet");
const creditWallet = require("../../services/wallet/creditWallet");
const debitWallet = require("../../services/wallet/debitWallet");

const KNOWN_WALLET_ERRORS = [
  "Duplicate transaction",
  "Insufficient balance",
  "Wallet not found",
  "Wallet is frozen",
  "Invalid amount",
];

const getWallets = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { isFrozen } = req.query;

    const filter = {};
    if (isFrozen !== undefined) filter.isFrozen = isFrozen === "true";

    const [wallets, total] = await Promise.all([
      WalletModel.find(filter)
        .populate("user", "username email firstName lastName")
        .sort({ balance: -1 })
        .skip(skip)
        .limit(limit),
      WalletModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      data: wallets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Admin get wallets error:", error);

    return res.status(500).json({ message: "Unable to retrieve wallets" });
  }
};

const getWalletByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const wallet = await WalletModel.findOne({ user: userId }).populate(
      "user",
      "username email firstName lastName",
    );

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    return res.status(200).json({ wallet });
  } catch (error) {
    console.error("Admin get wallet error:", error);

    return res.status(500).json({ message: "Unable to retrieve wallet" });
  }
};

const creditUserWallet = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "A positive amount is required" });
    }

    const reference = `ADMIN-CREDIT-${userId}-${Date.now()}`;

    const wallet = await creditWallet({
      userId,
      amount: Number(amount),
      reference,
      source: "ADMIN",
      meta: {
        adjustedBy: req.admin.id,
        reason: reason || "Manual admin credit",
      },
    });

    return res.status(200).json({ message: "Wallet credited", wallet });
  } catch (error) {
    console.error("Admin credit wallet error:", error);

    const status = KNOWN_WALLET_ERRORS.includes(error.message) ? 400 : 500;
    return res.status(status).json({ message: error.message || "Unable to credit wallet" });
  }
};

const debitUserWallet = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "A positive amount is required" });
    }

    const reference = `ADMIN-DEBIT-${userId}-${Date.now()}`;

    const result = await debitWallet(userId, Number(amount), reference, {
      adjustedBy: req.admin.id,
      reason: reason || "Manual admin debit",
    });

    return res.status(200).json({ message: "Wallet debited", ...result });
  } catch (error) {
    console.error("Admin debit wallet error:", error);

    const status = KNOWN_WALLET_ERRORS.includes(error.message) ? 400 : 500;
    return res.status(status).json({ message: error.message || "Unable to debit wallet" });
  }
};

const freezeWallet = async (req, res) => {
  try {
    const { userId } = req.params;

    const wallet = await WalletModel.findOneAndUpdate(
      { user: userId },
      { isFrozen: true },
      { new: true },
    );

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    return res.status(200).json({ message: "Wallet frozen", wallet });
  } catch (error) {
    console.error("Admin freeze wallet error:", error);

    return res.status(500).json({ message: "Unable to freeze wallet" });
  }
};

const unfreezeWallet = async (req, res) => {
  try {
    const { userId } = req.params;

    const wallet = await WalletModel.findOneAndUpdate(
      { user: userId },
      { isFrozen: false },
      { new: true },
    );

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    return res.status(200).json({ message: "Wallet unfrozen", wallet });
  } catch (error) {
    console.error("Admin unfreeze wallet error:", error);

    return res.status(500).json({ message: "Unable to unfreeze wallet" });
  }
};

module.exports = {
  getWallets,
  getWalletByUser,
  creditUserWallet,
  debitUserWallet,
  freezeWallet,
  unfreezeWallet,
};
