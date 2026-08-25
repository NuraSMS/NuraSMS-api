const axios = require("axios");

const fivesimApi = axios.create({
  baseURL: "https://5sim.net/v1",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${process.env.FIVESIM_API_TOKEN}`,
  },
});

module.exports = fivesimApi;