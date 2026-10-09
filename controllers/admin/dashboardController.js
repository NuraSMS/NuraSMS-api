const UserModel = require("../../models/User");
const WalletModel = require("../../models/Wallet");
const TransactionModel = require("../../models/Transactions");
const VirtualAccountModel = require("../../models/VirtualAccounts");

const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      suspendedUsers,
      totalVirtualAccounts,
      walletAgg,
      frozenWallets,
      transactionAgg,
      recentUsers,
      recentTransactions,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ isSuspended: true }),
      VirtualAccountModel.countDocuments(),
      WalletModel.aggregate([
        { $group: { _id: null, totalBalance: { $sum: "$balance" } } },
      ]),
      WalletModel.countDocuments({ isFrozen: true }),
      TransactionModel.aggregate([
        { $match: { status: "success" } },
        {
          $group: {
            _id: "$type",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
      UserModel.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("username email firstName lastName createdAt"),
      TransactionModel.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("user", "username email"),
    ]);

    const credit = transactionAgg.find((t) => t._id === "credit") || {
      totalAmount: 0,
      count: 0,
    };
    const debit = transactionAgg.find((t) => t._id === "debit") || {
      totalAmount: 0,
      count: 0,
    };

    return res.status(200).json({
      users: {
        total: totalUsers,
        suspended: suspendedUsers,
        active: totalUsers - suspendedUsers,
      },
      wallets: {
        totalBalance: walletAgg[0]?.totalBalance || 0,
        frozen: frozenWallets,
      },
      transactions: {
        totalCredited: credit.totalAmount,
        totalDebited: debit.totalAmount,
        creditCount: credit.count,
        debitCount: debit.count,
      },
      virtualAccounts: {
        total: totalVirtualAccounts,
      },
      recent: {
        users: recentUsers,
        transactions: recentTransactions,
      },
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);

    return res.status(500).json({
      message: "Unable to retrieve dashboard stats",
    });
  }
};

module.exports = { getStats };
