const colors = require('colors');
const path = require('path');
const express = require('express');
const cors = require("cors");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv').config();
const connectDB = require('./config/db');
const http = require('http');
const cron = require('node-cron');
const { cleanupOldProducts } = require('./utils/cleanupOldProducts');

// API Routes
const userRoutes = require('./routes/userRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');
const mainCategoryRoutes = require('./routes/mainCategoryRoutes');
const subCategoryRoutes = require('./routes/subCategoryRoutes');
const subSubCategoryRoutes = require('./routes/subSubCategoryRoutes');
const saleRoutes = require('./routes/saleRoutes');
const brandRoutes = require('./routes/brandRoutes');
const couponRoutes = require('./routes/couponCodeRoutes');
const stripePaymentRoutes = require('./routes/stripePaymentRoutes');
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const siteSettingRoutes = require("./routes/siteSettingRoutes");
const contactRoutes = require('./routes/contactRoutes');
const healthRouter = require('./routes/healthRoutes'); 
const { isAdmin } = require('./middleware/authMiddleware');

// Initialize database connection
connectDB();

// Create Express app
const app = express();
const server = http.createServer(app); // Create HTTP server

// Middleware setup
app.use(cookieParser()); // Parse cookies
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://menn-store-aidarous.azurewebsites.net',
  'https://menn-admin-aidarous.azurewebsites.net',
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
];

app.set('trust proxy', 1); // good when setting Secure cookies behind a proxy

app.use(
  cors({
    origin(origin, cb) {
      // allow SSR/cURL (no Origin) and allowed sites
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      // decline without throwing (avoids 500s)
      return cb(null, false);
    },
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

// respond to preflight
app.options('*', cors());

app.use(bodyParser.json({ limit: '10mb' })); // Parse JSON requests
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded requests
app.use('/uploads', express.static(path.join(__dirname, '/uploads'))); // Serve uploaded files

// API routes
app.use('/api/users', userRoutes);
app.use('/api/vendors', vendorRoutes);
app.use("/api/orders", orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', mainCategoryRoutes);
app.use('/api/subcategories', subCategoryRoutes);
app.use('/api/sub-subcategories', subSubCategoryRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payment', stripePaymentRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/settings", siteSettingRoutes);
app.use('/api/support', contactRoutes);
app.use('/api/health', healthRouter);
// in server.js (after routes) — temporary, keep behind an admin check if you have one
app.post('/api/admin/maintenance/cleanup', isAdmin, async (req, res) => {
  try {
    const days   = Number(req.body?.days) || 90;
    const dryRun = Boolean(req.body?.dryRun);
    const out = await cleanupOldProducts({ days, dryRun });
    return res.json(out);
  } catch (e) {
    console.error('[cleanup endpoint] error:', e);
    return res.status(500).json({ ok:false, error: e.message });
  }
});


// (optional) verify at startup
(async () => {
  try {
    const res = await cleanupOldProducts({ dryRun: true });
    console.log('[startup] cleanupOldProducts dry-run ->', res);
  } catch (e) {
    console.error('[startup] cleanupOldProducts dry-run error:', e);
  }
})();

// run every day at 02:15 server time
cron.schedule('15 2 * * *', async () => {
  try {
    const res = await cleanupOldProducts();
    console.log('[cron] cleanupOldProducts ->', res);
  } catch (e) {
    console.error('[cron] cleanupOldProducts error:', e);
  }
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`.cyan.bold);
});
