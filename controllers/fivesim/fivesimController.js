const fivesimService = require("../../services/fivesimService");
const debitWallet = require("../../services/wallet/debitWallet");
const creditWallet = require("../../services/wallet/creditWallet");
const TransactionModel = require("../../models/Transactions");

const getUserProfile = async (req, res) => {
  try {
    const profile = await fivesimService.getUserProfile();

    return res.status(200).json({
      profile,
    });
  } catch (error) {
    console.error(
      "Get user profile error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message: "Unable to retrieve user profile",
    });
  }
};

const getCountries = async (req, res) => {
  try {
    const countries = await fivesimService.getCountries();

    return res.status(200).json({
      countries,
    });
  } catch (error) {
    console.error(
      "Get countries error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message: "Unable to retrieve countries",
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const { country } = req.params;
    const { operator = "any" } = req.query;

    if (!country) {
      return res.status(400).json({
        message: "Country is required",
      });
    }

    const products = await fivesimService.getProducts(
      country,
      operator
    );

    return res.status(200).json({
      products,
    });
  } catch (error) {
    console.error(
      "Get products error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message: "Unable to retrieve products",
    });
  }
};

const buyActivationNumber = async (req, res) => {
  try {
    const {
      country,
      product,
      operator = "any",
    } = req.body;

    if (!country || !product) {
      return res.status(400).json({
        message: "Country and product are required",
      });
    }

    if (!req.user?.id) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const userId = req.user.id;

    // Get 5sim prices
    const products = await fivesimService.getProducts(
      country,
      operator
    );

    const productData = products[product];

    if (!productData) {
      return res.status(404).json({
        message: "Product is not available",
      });
    }

    const productPrice = Number(productData.cost);

    if (!productPrice || productPrice <= 0) {
      return res.status(400).json({
        message: "Invalid product price",
      });
    }

    // Calculate your markup
    // const markupPercent = Number(
    //   process.env.NURASMS_MARKUP_PERCENT || 0
    // );

    // const markup = fiveSimPrice * (markupPercent / 100);

    // Final amount charged to customer
    // const customerPrice = fiveSimPrice + markup;
    console.log(`Customer price: ${productPrice}, 5sim price: ${productPrice})`
    );

    const reference = `5SIM-ACT-${userId}-${Date.now()}`;

    // Debit customer price
    await debitWallet(
      userId,
      productPrice,
      reference, 
      {
        service: "5sim_activation",
        country,
        product,
        operator,
        productPrice,
        // markup,
        // markupPercent,
      }
    );

    try {
      const order =
        await fivesimService.buyActivationNumber(
          country,
          product,
          operator
        );

      await TransactionModel.updateOne(
        { reference },
        {
          $set: {
            "meta.orderId": String(order.id),
            "meta.orderStatus": order.status,
          },
        }
      );

      return res.status(200).json({
        message: "Activation number purchased successfully",
        order,
        amount: productPrice,
      });
    } catch (error) {
      // Refund the FULL amount charged to the customer
      await creditWallet({
        userId,
        amount: productPrice,
        reference: `${reference}-REFUND`,
        source: "SYSTEM",
        meta: {
          service: "5sim_activation_refund",
          originalReference: reference,
          country,
          product,
          operator,
          productPrice,
          // markup,
          // markupPercent,
        },
      });

      throw error;
    }
  } catch (error) {
    console.error(
      "Buy activation number error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message:
        error.message ||
        "Unable to purchase activation number",
    });
  }
};

const buyHostingNumber = async (req, res) => {
  try {
    const {
      country,
      product,
      operator = "any",
    } = req.body;

    if (!country || !product) {
      return res.status(400).json({
        message: "Country and product are required",
      });
    }

    const order = await fivesimService.buyHostingNumber(
      country,
      product,
      operator
    );

    return res.status(200).json({
      message: "Hosting number purchased successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Buy hosting number error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message: "Unable to purchase hosting number",
    });
  }
};

const checkOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required",
      });
    }

    const order = await fivesimService.checkOrder(orderId);

    return res.status(200).json({
      order,
    });
  } catch (error) {
    console.error(
      "Check order error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message: "Unable to check order",
    });
  }
};

const finishOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required",
      });
    }

    const order = await fivesimService.finishOrder(orderId);

    return res.status(200).json({
      message: "Order finished successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Finish order error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message: "Unable to finish order",
    });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required",
      });
    }

    if (!req.user?.id) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const userId = req.user.id;

    const purchaseTransaction = await TransactionModel.findOne({
      user: userId,
      type: "debit",
      "meta.orderId": String(orderId),
    });

    if (!purchaseTransaction) {
      return res.status(404).json({
        message: "No matching purchase found for this order",
      });
    }

    const order = await fivesimService.cancelOrder(orderId);

    try {
      await creditWallet({
        userId,
        amount: purchaseTransaction.amount,
        reference: `${purchaseTransaction.reference}-CANCEL-REFUND`,
        source: "SYSTEM",
        meta: {
          service: "5sim_activation_cancel_refund",
          originalReference: purchaseTransaction.reference,
          orderId,
        },
      });
    } catch (refundError) {
      if (refundError.message !== "Duplicate transaction") {
        throw refundError;
      }
    }

    return res.status(200).json({
      message: "Order cancelled and amount refunded successfully",
      order,
      amount: purchaseTransaction.amount,
    });
  } catch (error) {
    console.error(
      "Cancel order error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message: "Unable to cancel order",
    });
  }
};

const banOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required",
      });
    }

    const order = await fivesimService.banOrder(orderId);

    return res.status(200).json({
      message: "Order banned successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Ban order error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message: "Unable to ban order",
    });
  }
};

const getSmsInbox = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required",
      });
    }

    const inbox = await fivesimService.getSmsInbox(orderId);

    return res.status(200).json({
      inbox,
    });
  } catch (error) {
    console.error(
      "Get SMS inbox error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message: "Unable to retrieve SMS inbox",
    });
  }
};

const getBalance = async (req, res) => {
  try {
    const balance = await fivesimService.getBalance();

    return res.status(200).json({
      balance,
    });
  } catch (error) {
    console.error(
      "Get balance error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message: "Unable to retrieve 5sim balance",
    });
  }
};

module.exports = {
  getUserProfile,
  getCountries,
  getProducts,
  buyActivationNumber,
  buyHostingNumber,
  checkOrder,
  finishOrder,
  cancelOrder,
  banOrder,
  getSmsInbox,
  getBalance,
};