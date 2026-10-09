const client = require("../config/fivesim");
const getSettings = require("./admin/getSettings");
require("dotenv").config();

// admin - change later to only allow admin users to access this service
async function getUserProfile() {
  const response = await client.get("/user/profile");

  return response.data; 
}

async function getCountries() {
  const response = await client.get("/guest/countries");

  return response.data;
}

async function getProducts(country, operator) {
  const settings = await getSettings();
  const resolvedOperator = operator || settings.fivesimOperator;

  const response = await client.get(
    `/guest/products/${country}/${resolvedOperator}`
  );

  const exchangeRate = settings.usdNgnRate;
  const markupAmount = settings.markupAmount;

  if (!exchangeRate || exchangeRate <= 0) {
    throw new Error("Invalid USD to NGN exchange rate");
  }

  const products = response.data;

  for (const product of Object.values(products)) {
    const priceUSD = Number(product.Price);

    const priceNGN = priceUSD * exchangeRate;

    const customerPrice = priceNGN + markupAmount;

    product.cost = Math.round(customerPrice / 100) * 100;
    product.currency = "NGN";
  }

  return products;
}

async function buyActivationNumber(country, product, operator) {
  const resolvedOperator = operator || (await getSettings()).fivesimOperator;

  const response = await client.get(
    `/user/buy/activation/${country}/${resolvedOperator}/${product}`
  );

  return response.data;
}

async function buyHostingNumber(country, product, operator) {
  const resolvedOperator = operator || (await getSettings()).fivesimOperator;

  const response = await client.get(
    `/user/buy/hosting/${country}/${resolvedOperator}/${product}`
  );

  return response.data;
}

async function checkOrder(orderId) {
  const response = await client.get(
    `/user/check/${orderId}`
  );

  return response.data;
}

async function finishOrder(orderId) {
  const response = await client.get(
    `/user/finish/${orderId}`
  );

  return response.data;
}

async function cancelOrder(orderId) {
  const response = await client.get(
    `/user/cancel/${orderId}`
  );

  return response.data;
}

async function banOrder(orderId) {
  const response = await client.get(
    `/user/ban/${orderId}`
  );

  return response.data;
}

async function getSmsInbox(orderId) {
  const response = await client.get(
    `/user/sms/inbox/${orderId}`
  );

  return response.data;
}

async function getBalance() {
  const response = await client.get("/user/profile");

  return response.data;
}

async function checkOrder(orderId) {
  const response = await client.get(`/user/check/${orderId}`);

  return response.data;
}



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