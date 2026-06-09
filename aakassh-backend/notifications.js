// notifications.js — Email + WhatsApp/SMS alerts
require('dotenv').config();
const nodemailer = require('nodemailer');
const twilio     = require('twilio');

// ── Email transporter ──────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── Twilio client ──────────────────────────────────────────────────
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN &&
    !process.env.TWILIO_ACCOUNT_SID.includes('xxxx')) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// ── Send email notification ────────────────────────────────────────
async function sendEmailNotification(enquiry) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('[Email] Skipped — SMTP not configured');
    return;
  }

  console.log('[Email] Attempting — user:', process.env.SMTP_USER, 'host:', process.env.SMTP_HOST || 'smtp.gmail.com');

  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #f4f7fb; margin: 0; padding: 20px; }
          .card { background: #fff; max-width: 520px; margin: 0 auto; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #0ea5e9, #0284c7); padding: 28px 32px; color: white; }
          .header h1 { margin: 0; font-size: 20px; }
          .header p  { margin: 4px 0 0; opacity: 0.8; font-size: 13px; }
          .body { padding: 28px 32px; }
          .row { margin-bottom: 16px; }
          .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 4px; }
          .value { font-size: 15px; color: #1a2636; font-weight: 500; }
          .message-box { background: #f0f8ff; border-left: 3px solid #0ea5e9; padding: 14px 16px; border-radius: 0 8px 8px 0; font-size: 14px; color: #334155; line-height: 1.6; }
          .badge { display: inline-block; padding: 3px 10px; border-radius: 100px; font-size: 12px; font-weight: 600; }
          .badge-new { background: #dbeafe; color: #1d4ed8; }
          .footer { text-align: center; padding: 18px; font-size: 12px; color: #aaa; border-top: 1px solid #f0f0f0; }
          .btn { display: inline-block; margin-top: 20px; padding: 10px 24px; background: #0ea5e9; color: white; border-radius: 100px; text-decoration: none; font-weight: 600; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>🚀 New Project Enquiry</h1>
            <p>Aakassh.Creates — ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
          </div>
          <div class="body">
            <div class="row">
              <div class="label">Status</div>
              <div class="value"><span class="badge badge-new">New</span></div>
            </div>
            <div class="row">
              <div class="label">Name</div>
              <div class="value">${enquiry.name}</div>
            </div>
            <div class="row">
              <div class="label">Email</div>
              <div class="value"><a href="mailto:${enquiry.email}">${enquiry.email}</a></div>
            </div>
            <div class="row">
              <div class="label">Service Needed</div>
              <div class="value">${enquiry.service}</div>
            </div>
            ${enquiry.budget ? `
            <div class="row">
              <div class="label">Budget</div>
              <div class="value">${enquiry.budget}</div>
            </div>` : ''}
            <div class="row">
              <div class="label">Message</div>
              <div class="message-box">${enquiry.message.replace(/\n/g, '<br>')}</div>
            </div>
            <a href="mailto:${enquiry.email}?subject=Re: Your enquiry — Aakassh.Creates" class="btn">Reply to ${enquiry.name} →</a>
          </div>
          <div class="footer">Aakassh.Creates · India · Available globally</div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from:    `"Aakassh.Creates" <${process.env.SMTP_USER}>`,
      to:      process.env.NOTIFY_EMAIL,
      subject: `🚀 New enquiry from ${enquiry.name} — ${enquiry.service}`,
      html,
    });

    console.log(`[Email] Notification sent for enquiry from ${enquiry.name}`);
  } catch (e) {
    console.error('[Email] FAILED:', e.message);
    throw e;
  }
}

// ── Send WhatsApp notification ─────────────────────────────────────
async function sendWhatsAppNotification(enquiry) {
  if (!twilioClient) {
    console.log('[WhatsApp] Skipped — Twilio not configured');
    return;
  }

  const body =
    `🚀 *New Enquiry — Aakassh.Creates*\n\n` +
    `👤 *Name:* ${enquiry.name}\n` +
    `📧 *Email:* ${enquiry.email}\n` +
    `🎯 *Service:* ${enquiry.service}\n` +
    `💰 *Budget:* ${enquiry.budget || 'Not specified'}\n\n` +
    `💬 *Message:*\n${enquiry.message}\n\n` +
    `_Reply within 24 hours for best results!_`;

  await twilioClient.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to:   `whatsapp:${process.env.NOTIFY_PHONE}`,
    body,
  });

  console.log(`[WhatsApp] Notification sent for enquiry from ${enquiry.name}`);
}

// ── Send SMS notification ──────────────────────────────────────────
async function sendSMSNotification(enquiry) {
  if (!twilioClient) {
    console.log('[SMS] Skipped — Twilio not configured');
    return;
  }

  await twilioClient.messages.create({
    from: process.env.TWILIO_FROM_NUMBER,
    to:   process.env.NOTIFY_PHONE,
    body: `Aakassh.Creates: New enquiry from ${enquiry.name} (${enquiry.service}). Check email for details.`,
  });

  console.log(`[SMS] Notification sent for enquiry from ${enquiry.name}`);
}

// ── Send all notifications (non-blocking) ─────────────────────────
async function notifyAll(enquiry) {
  const results = await Promise.allSettled([
    sendEmailNotification(enquiry),
    sendWhatsAppNotification(enquiry),
    sendSMSNotification(enquiry),
  ]);

  results.forEach((r, i) => {
    const label = ['Email', 'WhatsApp', 'SMS'][i];
    if (r.status === 'rejected') {
      console.error(`[${label}] Failed:`, r.reason?.message);
    }
  });
}

module.exports = { notifyAll, sendEmailNotification, sendWhatsAppNotification, sendSMSNotification };