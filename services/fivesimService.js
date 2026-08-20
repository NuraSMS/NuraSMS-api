const client = require("../config/fivesim");

async function getCountries() {
  const response = await client.get("/guest/countries");

  return response.data;
}

async function getProducts(country, operator = "any") {
  const response = await client.get(
    `/guest/products/${country}/${operator}`
  );

  return response.data;
}

async function buyActivationNumber(
  country,
  product,
  operator = "any"
) {
  const response = await client.get(
    `/user/buy/activation/${country}/${operator}/${product}`
  );

  return response.data;
}

async function buyHostingNumber(
  country,
  product,
  operator = "any"
) {
  const response = await client.get(
    `/user/buy/hosting/${country}/${operator}/${product}`
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