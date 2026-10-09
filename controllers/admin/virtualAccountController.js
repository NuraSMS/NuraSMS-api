const VirtualAccountModel = require("../../models/VirtualAccounts");

const getVirtualAccounts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [accounts, total] = await Promise.all([
      VirtualAccountModel.find()
        .populate("user", "username email firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      VirtualAccountModel.countDocuments(),
    ]);

    return res.status(200).json({
      data: accounts,
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
    console.error("Admin get virtual accounts error:", error);

    return res.status(500).json({ message: "Unable to retrieve virtual accounts" });
  }
};

const getVirtualAccountByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const account = await VirtualAccountModel.findOne({ user: userId }).populate(
      "user",
      "username email firstName lastName",
    );

    if (!account) {
      return res.status(404).json({ message: "No virtual account found for this user" });
    }

    return res.status(200).json({ account });
  } catch (error) {
    console.error("Admin get virtual account error:", error);

    return res.status(500).json({ message: "Unable to retrieve virtual account" });
  }
};

module.exports = { getVirtualAccounts, getVirtualAccountByUser };
