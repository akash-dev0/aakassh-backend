const express   = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit  = require('express-rate-limit');
const { stmts }  = require('../db');
const { notifyAll } = require('../notifications');

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many submissions from this IP. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const validateContact = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('service').trim().isIn(['Video Editing', 'Web Development', 'Graphic Design', 'Motion Graphics', 'E-Commerce', 'SEO & Performance', 'Full package']).withMessage('Please select a valid service'),
  body('budget').optional({ nullable: true, checkFalsy: true }).trim().isIn(['Under ₹5,000', '₹5,000 – ₹15,000', '₹15,000 – ₹30,000', '₹30,000+']),
  body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be between 10 and 2000 characters'),
];

router.post('/', contactLimiter, validateContact, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }

  const { name, email, service, budget, message } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

  try {
    const result = await stmts.insertEnquiry({ name, email, service, budget: budget || null, message, ip });
    const enquiryId = result.lastInsertRowid;

    notifyAll({ name, email, service, budget, message }).catch(err =>
      console.error('[Notifications] Error:', err.message)
    );

    console.log(`[Contact] New enquiry #${enquiryId} from ${name} <${email}> — ${service}`);

    return res.status(201).json({
      success: true,
      message: "Thanks! I'll get back to you within 24 hours.",
      id: enquiryId,
    });

  } catch (err) {
    console.error('[Contact] DB error:', err.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;