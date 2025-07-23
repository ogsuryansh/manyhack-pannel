require("dotenv").config();
console.log("Loaded MONGO_URI:", process.env.MONGO_URI);

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectToDatabase = require("./utils/db");
const serverless = require('serverless-http');

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB at the top level
connectToDatabase().then(() => {
  console.log("MongoDB connected (serverless)");
}).catch((err) => {
  console.error("MongoDB connection error:", err);
  process.exit(1);
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/adminAuth"));
app.use("/api/admin/users", require("./routes/adminUser"));
app.use("/api/admin/stats", require("./routes/adminStats"));
app.use("/api/products", require("./routes/product"));
app.use("/api/keys", require("./routes/key"));
app.use("/api/payments", require("./routes/payment"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/notice", require("./routes/notice"));
require("./models/TopUpPlan");

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ message: "API route not found" });
  }
  next();
});

app.use((err, req, res, next) => {
  res.status(500).json({ message: "Internal server error" });
});

// Export for Vercel serverless
module.exports = app;
module.exports.handler = serverless(app);

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}