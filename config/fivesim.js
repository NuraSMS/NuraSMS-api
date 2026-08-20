const { default: axios } = require("axios");
const fivesimBaseUrl = "https://5sim.net/v1";


const fivesimApi = axios.create({
  baseURL: `${fivesimBaseUrl}`,
  headers: {
    "Content-Type": "application/json",
  },
});

fivesimApi.interceptors.request.use((config) => {
  config.data = {
    ...config.data,
    key: process.env.FIVESIM_API_TOKEN,
  };

  return config;
});

module.exports = fivesimApi;