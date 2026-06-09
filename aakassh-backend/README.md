# Aakassh.Creates — Backend

Full backend for the Aakassh.Creates portfolio site.

## Features
- 📬 Contact form API with validation + rate limiting
- 📧 Email notifications via Gmail (Nodemailer)
- 💬 WhatsApp + SMS notifications via Twilio
- 🗄️ SQLite database (zero setup, file-based)
- 🔒 JWT-secured admin dashboard
- 📊 Stats: total, today, new, replied
- 🛡️ Helmet security headers, CORS, rate limiting

---

## Quick Start (Local)

### 1. Install dependencies
```bash
cd aakassh-backend
npm install
```

### 2. Set up environment
```bash
cp .env.example .env
# Edit .env with your real values (see below)
```

### 3. Run the server
```bash
npm run dev      # development (auto-restart)
npm start        # production
```

Server starts at: http://localhost:3001  
Admin dashboard: http://localhost:3001/admin

---

## .env Setup Guide

### Email (Gmail)
1. Enable 2-Step Verification on your Google account  
2. Go to: Google Account → Security → 2-Step Verification → App passwords  
3. Create an App Password for "Mail"  
4. Use that 16-char password as `SMTP_PASS`

### Twilio (WhatsApp + SMS)
1. Sign up at https://twilio.com (free trial available)
2. Get your Account SID and Auth Token from the dashboard
3. For WhatsApp: join the Twilio Sandbox (twilio.com/console/messaging/whatsapp/sandbox)
   - The sandbox number is: `whatsapp:+14155238886`
   - Send the join code from your WhatsApp first
4. For SMS: buy a Twilio number (~$1/month)
5. Fill in `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `NOTIFY_PHONE`

### Admin credentials
Change `ADMIN_USERNAME` and `ADMIN_PASSWORD` before deploying.  
Set `JWT_SECRET` to a long random string (32+ characters).

---

## Wiring the Frontend

Open your `index.html` and:
1. Replace the `submitForm()` function with the code in `FRONTEND_SNIPPET.js`
2. Set `API_BASE` to your backend URL

---

## Deployment (Free options)

### Render (recommended — free tier)
1. Push this folder to a GitHub repo
2. Create a new **Web Service** on render.com
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add all your `.env` values under **Environment**
6. The SQLite file persists on Render's disk

### Railway
1. `railway init` then `railway up`
2. Add env vars in the Railway dashboard

### VPS (DigitalOcean / Hostinger)
```bash
npm install -g pm2
pm2 start server.js --name aakassh-backend
pm2 save && pm2 startup
```
Put nginx in front as a reverse proxy on port 80/443.

---

## API Reference

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/contact` | Submit contact form |
| GET | `/api/health` | Health check |

### Admin (requires Bearer token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Get JWT token |
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/enquiries` | All enquiries |
| GET | `/api/admin/enquiries?status=new` | Filter by status |
| GET | `/api/admin/enquiries/:id` | Single enquiry |
| PATCH | `/api/admin/enquiries/:id/status` | Update status |
| DELETE | `/api/admin/enquiries/:id` | Delete enquiry |

---

## Project Structure
```
aakassh-backend/
├── server.js              # Express app entry point
├── db.js                  # SQLite database + prepared statements
├── notifications.js       # Email + WhatsApp + SMS
├── routes/
│   ├── contact.js         # Public contact form API
│   └── admin.js           # Protected admin API
├── middleware/
│   └── auth.js            # JWT auth middleware
├── public/
│   └── admin/
│       └── index.html     # Admin dashboard UI
├── data/                  # SQLite DB file (auto-created)
├── .env.example           # Config template
├── FRONTEND_SNIPPET.js    # Drop-in frontend patch
└── package.json
```
