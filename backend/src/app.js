const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const receptionRoutes = require("./routes/reception.routes");
const inquiryRoutes = require("./routes/inquiry.routes");
const instructorRoutes = require("./routes/instructor.routes");
const paymentRoutes = require("./routes/payment.routes");
const parentRoutes = require("./routes/parent.routes");
const parentBookingsRoutes = require("./routes/parentBookings.routes");
const publicRoutes = require("./routes/public.routes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  res.send("API running");
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reception", receptionRoutes);
app.use("/api/inquiry", inquiryRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/instructor", instructorRoutes);

app.use("/api/parent", paymentRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/parent", parentBookingsRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

module.exports = app;