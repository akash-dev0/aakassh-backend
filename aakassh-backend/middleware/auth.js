// middleware/auth.js — JWT authentication for admin routes
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.cookies?.admin_token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorised — no token provided' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorised — invalid or expired token' });
  }
}

module.exports = { requireAuth };
