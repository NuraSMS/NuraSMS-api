const TransactionModel = require("../../models/Transactions");

const getTransactions = async (req, res) => {
  const user = req.user._id;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const skip = (page - 1) * limit;

  try {
    const [transactions, total] = await Promise.all([
      TransactionModel
        .find({ user })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      TransactionModel.countDocuments({ user }),
    ]);

    res.status(200).json({
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
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error getting user transactions",
    });
  }
};

module.exports = { getTransactions };