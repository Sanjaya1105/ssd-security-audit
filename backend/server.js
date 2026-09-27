require('dotenv').config(); // Load environment variables from .env
const mysql = require('mysql2');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { execFile } = require('child_process');
const path = require('path');

const cron = require('node-cron');
const { authenticateUser, authorizeRole } = require('./middleware/AuthMiddleware');
const { sanitizeResponses, notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const managersOnly = [authenticateUser, authorizeRole(['admin', 'manager'])];

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function isSafeIsoDate(value) {
  if (typeof value !== 'string' || !DATE_ONLY.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function runPythonScript(scriptName, args = []) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'AI_MODEL_REAL_ONE', scriptName);
    execFile(
      'python',
      [scriptPath, ...args],
      { cwd: __dirname, timeout: 120000, windowsHide: true },
      (err, stdout) => {
        if (err) {
          return reject(err);
        }
        resolve(stdout);
      }
    );
  });
}



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

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET must be at least 32 random characters. Set it in backend/.env");
  process.exit(1);
}

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Other middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeResponses);

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
app.get('/train-model', ...managersOnly, async (req, res) => {
  try {
    const stdout = await runPythonScript('train_model.py');
    console.log(stdout);
    res.json({ message: 'Model trained successfully!' });
  } catch (err) {
    console.error('Model training failed:', err);
    res.status(500).json({ error: 'Model training failed' });
  }
});

app.get('/predict', ...managersOnly, async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: "Date is required" });
  if (!isSafeIsoDate(date)) {
    return res.status(400).json({ error: "Date must be a valid YYYY-MM-DD value" });
  }

  try {
    const stdout = await runPythonScript('predict.py', [date]);
    const predictions = JSON.parse(stdout);
    res.json(predictions);
  } catch (err) {
    console.error('Prediction failed:', err);
    res.status(500).json({ error: "Failed to generate prediction" });
  }
});

// Daily model training at 02:00 — run the script locally, do not call the public HTTP route
cron.schedule('0 2 * * *', async () => {
  try {
    console.log('Running scheduled model training...');
    const stdout = await runPythonScript('train_model.py');
    console.log('Scheduled model training finished:', stdout);
  } catch (error) {
    console.error('Scheduled model training failed:', error.message);
  }
});





















app.use(notFoundHandler);
app.use(errorHandler);

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