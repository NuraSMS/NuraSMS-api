const fivesimService = require("../../services/fivesim/fivesimService");

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

    const order = await fivesimService.buyActivationNumber(
      country,
      product,
      operator
    );

    return res.status(200).json({
      message: "Activation number purchased successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Buy activation number error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message: "Unable to purchase activation number",
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

    const order = await fivesimService.cancelOrder(orderId);

    return res.status(200).json({
      message: "Order cancelled successfully",
      order,
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