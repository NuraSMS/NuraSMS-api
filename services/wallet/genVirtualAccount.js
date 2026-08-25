const { default: axios } = require("axios");

const genVirtualAccount = async (user) => {
  // console.log("user from gen VDA", user)
  try {
    const response = await axios.post(
      "https://api.paystack.co/dedicated_account/assign",
      {
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        phone: user.phoneNumber,
        preferred_bank: "titan-paystack",
        country: "NG",
        metadata: {userId: user._id }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (err) {
    console.error(err.response || err.message);
    throw err;
  }
};

module.exports = genVirtualAccount;