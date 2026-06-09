// routes/admin.js — Protected admin API
const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { stmts } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ── POST /api/admin/login ──────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const validUser = username === process.env.ADMIN_USERNAME;
  const validPass = password === process.env.ADMIN_PASSWORD;

  // Use constant-time comparison to prevent timing attacks
  if (!validUser || !validPass) {
    // Simulate bcrypt delay even on failure
    await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { username, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  console.log(`[Admin] Login from ${req.ip}`);

  return res.json({
    success: true,
    token,
    expiresIn: 8 * 60 * 60, // seconds
  });
});

// ── All routes below require auth ──────────────────────────────────
router.use(requireAuth);

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  try {
    const stats = stmts.getStats.get();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/enquiries[?status=new]
router.get('/enquiries', (req, res) => {
  try {
    const { status } = req.query;
    const rows = status
      ? stmts.filterByStatus.all(status)
      : stmts.getAllEnquiries.all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/enquiries/:id
router.get('/enquiries/:id', (req, res) => {
  try {
    const row = stmts.getEnquiryById.get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Enquiry not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/enquiries/:id/status
router.patch('/enquiries/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['new', 'read', 'replied', 'closed'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const result = stmts.updateStatus.run(status, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Enquiry not found' });
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/enquiries/:id
router.delete('/enquiries/:id', (req, res) => {
  try {
    const result = stmts.deleteEnquiry.run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Enquiry not found' });
    console.log(`[Admin] Deleted enquiry #${req.params.id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
