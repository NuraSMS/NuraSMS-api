const TransactionModel = require("../../models/Transactions");

const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { user, type, status, from, to } = req.query;

    const filter = {};
    if (user) filter.user = user;
    if (type) filter.type = type;
    if (status) filter.status = status;

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const [transactions, total] = await Promise.all([
      TransactionModel.find(filter)
        .populate("user", "username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      TransactionModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      data: transactions,
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
    console.error("Admin get transactions error:", error);

    return res.status(500).json({ message: "Unable to retrieve transactions" });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await TransactionModel.findById(id).populate(
      "user",
      "username email",
    );

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    return res.status(200).json({ transaction });
  } catch (error) {
    console.error("Admin get transaction error:", error);

    return res.status(500).json({ message: "Unable to retrieve transaction" });
  }
};

const updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "success", "failed"].includes(status)) {
      return res.status(400).json({
        message: "Status must be 'pending', 'success', or 'failed'",
      });
    }

    const transaction = await TransactionModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    return res.status(200).json({ message: "Transaction updated", transaction });
  } catch (error) {
    console.error("Admin update transaction error:", error);

    return res.status(500).json({ message: "Unable to update transaction" });
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  updateTransactionStatus,
};
