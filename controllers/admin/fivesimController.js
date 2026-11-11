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

// An order's live status/OTP only exist on 5sim's side — this merges that
// with the customer + purchase details we hold locally on the transaction.
const buildOrderDetails = async (transaction) => {
  const orderId = transaction?.meta?.orderId;

  let liveOrder = null;
  if (orderId) {
    try {
      liveOrder = await fivesimService.checkOrder(orderId);
    } catch (error) {
      liveOrder = null;
    }
  }

  const user = transaction?.user;

  return {
    orderId: orderId || (liveOrder ? String(liveOrder.id) : null),
    transactionId: transaction?._id || null,
    reference: transaction?.reference || null,
    customer: user
      ? {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          username: user.username,
          email: user.email,
        }
      : null,
    service: transaction?.meta?.product || liveOrder?.product || null,
    country: transaction?.meta?.country || liveOrder?.country || null,
    operator: transaction?.meta?.operator || liveOrder?.operator || null,
    phone: liveOrder?.phone || null,
    amount: transaction?.amount ?? null,
    purchasedAt: transaction?.createdAt || liveOrder?.created_at || null,
    expiresAt: liveOrder?.expires || null,
    status: liveOrder?.status || transaction?.meta?.orderStatus || "unknown",
    otp: liveOrder?.sms?.[0]?.code || null,
    sms: liveOrder?.sms || [],
  };
};

// Orders aren't a separate collection — they're reconstructed from the
// debit transactions created when a user buys a number, enriched live
// with 5sim's current status/OTP for each one.
const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { user, country, product, search } = req.query;

    const filter = {
      type: "debit",
      "meta.service": "5sim_activation",
    };

    if (user) filter.user = user;
    if (country) filter["meta.country"] = country;
    if (product) filter["meta.product"] = product;

    let transactions = await TransactionModel.find(filter)
      .populate("user", "username email firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await TransactionModel.countDocuments(filter);

    let orders = await Promise.all(transactions.map(buildOrderDetails));

    if (search) {
      const needle = search.trim().toLowerCase();
      orders = orders.filter((order) =>
        order.customer?.name?.toLowerCase().includes(needle) ||
        order.customer?.username?.toLowerCase().includes(needle) ||
        order.customer?.email?.toLowerCase().includes(needle)
      );
    }

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

    const transaction = await TransactionModel.findOne({
      type: "debit",
      "meta.service": "5sim_activation",
      "meta.orderId": String(orderId),
    }).populate("user", "username email firstName lastName");

    const details = await buildOrderDetails(
      transaction || { meta: { orderId: String(orderId) } },
    );

    if (!details.status || details.status === "unknown") {
      if (!transaction) {
        return res.status(404).json({ message: "Order not found" });
      }
    }

    return res.status(200).json({ order: details });
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
