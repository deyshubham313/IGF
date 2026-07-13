require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();

// ── Security & Logging ──────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan('dev'));

// ── CORS ─────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow non-browser requests, Vercel subdomains, and configured origins
      if (
        !origin || 
        allowedOrigins.includes(origin) || 
        origin.endsWith('.vercel.app') || 
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1')
      ) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// ── Body Parsing ──────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── Static Files ─────────────────────────────────────────────────
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ────────────────────────────────────────────────────
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/inquiries', require('./routes/inquiries'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/settings', require('./routes/settings'));

// ── Health Check ─────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Indian Game Factory API is running',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ── 404 Handler ───────────────────────────────────────────────────
app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// ── Global Error Handler ──────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ── Connect & Start ───────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/indian-game-factory';

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    // Auto-seed admin user
    try {
      const User = require('./models/User');
      const adminUsername = (process.env.ADMIN_USERNAME || 'igfadmin').toLowerCase();
      const adminPassword = process.env.ADMIN_PASSWORD || 'IGF@Admin2026';

      const adminExists = await User.findOne({ username: adminUsername });
      if (!adminExists) {
        await User.create({
          name: 'Admin',
          username: adminUsername,
          email: 'admin@indiangamefactory.com',
          password: adminPassword,
          role: 'admin'
        });
        console.log(`🚀 Seeded default admin user: ${adminUsername}`);
      }

      // Legacy/Secondary admin seed
      const legacyUsername = 'sd';
      const legacyPassword = 'indian factory by sd';
      const legacyExists = await User.findOne({ username: legacyUsername });
      if (!legacyExists) {
        await User.create({
          name: 'Sd',
          username: legacyUsername,
          email: 'sd@indiangamefactory.com',
          password: legacyPassword,
          role: 'admin'
        });
        console.log(`🚀 Seeded secondary admin user: ${legacyUsername}`);
      }
    } catch (err) {
      console.error('⚠️ Admin seeding failed:', err.message);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('   Please ensure MongoDB is running and MONGODB_URI is correct.');
    process.exit(1);
  });
