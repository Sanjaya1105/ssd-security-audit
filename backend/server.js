require('dotenv').config(); // Load environment variables from .env
const mysql = require('mysql2');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { exec } = require('child_process');

const cron = require('node-cron');
const axios = require('axios');



const userRoutes = require("./route/UserRoutes");
const feedbackRoutes = require("./route/FeedbackRoutes");
const inventoryItemRoutes = require("./route/InventoryItemRoutes");
const purchaseRoutes = require("./route/PurchaseRoutes");
const inventoryStockRoutes = require("./route/InventoryStockRoutes");
const productRoutes = require("./route/ProductRoutes");
const InventoryReleaseRoutes = require("./route/InventoryReleaseRoutes");
const OrderRoutes = require("./route/OrderRoutes");
const productLogRoutes = require("./route/ProductLogRoutes");
const recipeRoutes = require("./route/recipeRoutes");
const paymentRoutes = require("./route/paymentRoutes");
const saleRoutes = require("./route/saleRoutes");
const productInventoryReleaseRoutes = require("./route/ProductInventoryReleaseRoutes");
const predictSalesRoute = require('./route/predictSales');

const app = express();

// Other middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// CORS configuration - Must be before other middleware
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }));

// Create MySQL Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

const PORT = process.env.PORT || 3000;

// Connect to MySQL
db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL Database');
});

// Pass `db` to routes
app.use((req, res, next) => {
    req.db = db;
    next();
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/inventory-items", inventoryItemRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/inventory-stocks", inventoryStockRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory-releases", InventoryReleaseRoutes);
app.use("/api/orders", OrderRoutes);
app.use("/api/production-logs", productLogRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/production-inventory-releases", productInventoryReleaseRoutes);
app.use('/api', predictSalesRoute);


// ✅ TRAIN MODEL API
app.get('/train-model', (req, res) => {
  exec(
    `python AI_MODEL_REAL_ONE/train_model.py`,
    (err, stdout, stderr) => {
      if (err) {
        return res.status(500).json({ error: stderr || err.message });
      }
      console.log(stdout);
      res.json({ message: '✅ Model trained successfully!' });
    }
  );
});

app.get('/predict', (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: "Date is required" });

  const scriptPath = `python AI_MODEL_REAL_ONE/predict.py ${date}`;

  exec(scriptPath, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ error: stderr || err.message });
    }

    try {
      const predictions = JSON.parse(stdout);
      res.json(predictions);
    } catch (e) {
      res.status(500).json({ error: "Failed to parse model response" });
    }
  });
});

// 🧠 Schedule job to run daily at 2:00 AM
cron.schedule('* * * * *', async () => {  // runs every minute
  try {
    console.log("🕑 Running daily model training...");

    const response = await axios.get('http://localhost:3000/train-model');

    console.log("✅ Daily model training response:", response.data);
  } catch (error) {
    console.error("❌ Error in daily model training:", error.message);
  }
});





















// Start Express Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// Close the connection when the app exits
process.on("SIGINT", () => {
    db.end((err) => {
        if (err) console.log("Error closing MySQL connection:", err);
        console.log("MySQL connection closed.");
        process.exit();
    });
});