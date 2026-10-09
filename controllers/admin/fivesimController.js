const fivesimService = require("../../services/fivesimService");
const TransactionModel = require("../../models/Transactions");

const getProviderBalance = async (req, res) => {
  try {
    const balance = await fivesimService.getBalance();

    return res.status(200).json({ balance });
  } catch (error) {
    console.error("Admin get 5sim balance error:", error.response?.data || error.message);

    return res.status(500).json({ message: "Unable to retrieve 5sim balance" });
  }
};

const getProviderProfile = async (req, res) => {
  try {
    const profile = await fivesimService.getUserProfile();

    return res.status(200).json({ profile });
  } catch (error) {
    console.error("Admin get 5sim profile error:", error.response?.data || error.message);

    return res.status(500).json({ message: "Unable to retrieve 5sim profile" });
  }
};

// Orders aren't a separate collection — they're reconstructed from the
// debit transactions created when a user buys a number.
const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { user, country, product } = req.query;

    const filter = {
      type: "debit",
      "meta.service": "5sim_activation",
    };

    if (user) filter.user = user;
    if (country) filter["meta.country"] = country;
    if (product) filter["meta.product"] = product;

    const [orders, total] = await Promise.all([
      TransactionModel.find(filter)
        .populate("user", "username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      TransactionModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      data: orders,
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
    console.error("Admin get orders error:", error);

    return res.status(500).json({ message: "Unable to retrieve orders" });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await fivesimService.checkOrder(orderId);

    return res.status(200).json({ order });
  } catch (error) {
    console.error("Admin get order error:", error.response?.data || error.message);

    return res.status(500).json({ message: "Unable to retrieve order" });
  }
};

const finishOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await fivesimService.finishOrder(orderId);

    return res.status(200).json({ message: "Order finished", order });
  } catch (error) {
    console.error("Admin finish order error:", error.response?.data || error.message);

    return res.status(500).json({ message: "Unable to finish order" });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await fivesimService.cancelOrder(orderId);

    return res.status(200).json({ message: "Order cancelled", order });
  } catch (error) {
    console.error("Admin cancel order error:", error.response?.data || error.message);

    return res.status(500).json({ message: "Unable to cancel order" });
  }
};

const banOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await fivesimService.banOrder(orderId);

    return res.status(200).json({ message: "Order banned", order });
  } catch (error) {
    console.error("Admin ban order error:", error.response?.data || error.message);

    return res.status(500).json({ message: "Unable to ban order" });
  }
};

module.exports = {
  getProviderBalance,
  getProviderProfile,
  getOrders,
  getOrderById,
  finishOrder,
  cancelOrder,
  banOrder,
};
