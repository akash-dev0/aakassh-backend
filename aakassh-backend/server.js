// server.js — Aakassh.Creates Backend
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const path       = require('path');
const rateLimit  = require('express-rate-limit');

const contactRouter = require('./routes/contact');
const adminRouter   = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Trust proxy (for correct IP when behind nginx/Render/Railway) ──
app.set('trust proxy', 1);

// ── Security headers ───────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // relax for admin dashboard
}));

// ── CORS ───────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (Postman, curl, same-origin)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── Body parsing ───────────────────────────────────────────────────
app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: true, limit: '32kb' }));

// ── Global rate limit ──────────────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
}));

// ── API Routes ─────────────────────────────────────────────────────
app.use('/api/contact', contactRouter);
app.use('/api/admin',   adminRouter);

// ── Health check ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Aakassh.Creates API',
    timestamp: new Date().toISOString(),
  });
});

// ── Serve admin dashboard ──────────────────────────────────────────
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));
app.get('/admin*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// ── 404 ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Error handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   Aakassh.Creates — Backend Server   ║
  ║   http://localhost:${PORT}              ║
  ║   Admin: http://localhost:${PORT}/admin ║
  ╚══════════════════════════════════════╝
  `);
});

module.exports = app;
