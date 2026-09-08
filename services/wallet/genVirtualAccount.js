const axios = require("axios");

const formatNigerianPhone = (phone) => {
  if (!phone) return null;

  phone = String(phone).trim();

  if (phone.startsWith("+234")) {
    return phone;
  }

  if (phone.startsWith("234")) {
    return `+${phone}`;
  }

  if (phone.startsWith("0")) {
    return `+234${phone.slice(1)}`;
  }

  return phone;
};

const genVirtualAccount = async (user) => {
  try {
    const phone = formatNigerianPhone(user.phoneNumber);

    if (!user.email) {
      throw new Error("User email is missing");
    }

    if (!user.firstName) {
      throw new Error("User first name is missing");
    }

    if (!user.lastName) {
      throw new Error("User last name is missing");
    }

    if (!phone) {
      throw new Error("User phone number is missing");
    }

    console.log("Creating virtual account for:", {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone,
      userId: user._id,
    });

    const response = await axios.post(
      "https://api.paystack.co/dedicated_account/assign",
      {
        email: user.email.trim().toLowerCase(),
        first_name: user.firstName,
        last_name: user.lastName,
        phone,
        preferred_bank:
          process.env.NODE_ENV === "production"
            ? "titan-paystack"
            : "test-bank",
        country: "NG",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("Paystack response:", response.data);

    return response.data;
  } catch (err) {
    console.error(
      "Paystack virtual account error:",
      err.response?.data || err.message,
    );

    throw err;
  }
};

module.exports = genVirtualAccount;
