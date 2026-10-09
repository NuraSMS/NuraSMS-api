const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/dbConfig");

require("dotenv").config();

const app = express();

// DB
connectDB();

// Middleware
// app.use(
//   cors({
//     origin: [
//       "http://127.0.0.1:5501",
//       "http://localhost:5173",
//       "http://localhost:5174",
//       "https://nurais.netlify.app",
//     ],
//     credentials: true,
//   }),
// );

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api", require("./routes/auth/AuthRoute"));
app.use("/api", require("./routes/fivesim/fivesimRoutes"));
app.use("/api", require("./routes/wallet/virtualAccountRoute"));
app.use("/api", require("./routes/wallet/walletRoute"));
app.use("/api", require("./routes/wallet/transactionRoute"));
app.use("/api", require("./routes/wallet/webhookRoute"));

// Admin routes
app.use("/api/admin/auth", require("./routes/admin/adminAuthRoute"));
app.use("/api/admin/dashboard", require("./routes/admin/adminDashboardRoute"));
app.use("/api/admin/users", require("./routes/admin/adminUserRoute"));
app.use("/api/admin/wallets", require("./routes/admin/adminWalletRoute"));
app.use("/api/admin/transactions", require("./routes/admin/adminTransactionRoute"));
app.use("/api/admin/virtual-accounts", require("./routes/admin/adminVirtualAccountRoute"));
app.use("/api/admin/fivesim", require("./routes/admin/adminFivesimRoute"));
app.use("/api/admin/settings", require("./routes/admin/adminSettingsRoute"));


// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Server is working",
  });
});

// Run server
const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
