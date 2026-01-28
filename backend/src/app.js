const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const inquiryRoutes = require("./routes/inquiry.routes");
console.log("✅ inquiry routes loaded");
const paymentRoutes = require("./routes/payment.routes");
const parentRoutes = require("./routes/parent.routes");
const parentBookingsRoutes = require("./routes/parentBookings.routes");


const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("API running");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/inquiry", inquiryRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/parent", parentRoutes);
console.log("✅ parent routes loaded");
app.use("/api/parent", parentBookingsRoutes);


// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

module.exports = app;
