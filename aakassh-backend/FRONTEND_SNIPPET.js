/* ── UPDATED CONTACT FORM — replaces the submitForm() function in your index.html ──
   Paste this to replace the existing submitForm() function in the <script> block.
   Also set API_BASE to wherever your backend is deployed.
────────────────────────────────────────────────────────────────────────────────── */

// 👇 Change this to your deployed backend URL (e.g. https://aakassh-api.onrender.com)
const API_BASE = 'http://localhost:3001';

async function submitForm() {
  const name    = document.getElementById('f-name').value.trim();
  const email   = document.getElementById('f-email').value.trim();
  const service = document.getElementById('f-service').value;
  const budget  = document.getElementById('f-budget').value;
  const msg     = document.getElementById('f-msg').value.trim();
  const msgEl   = document.getElementById('form-msg');
  const btn     = document.querySelector('.form-submit');

  // Basic client-side check
  if (!name || !email || !service || !msg) {
    alert('Please fill in all required fields.');
    return;
  }

  // Loading state
  btn.disabled = true;
  btn.textContent = 'Sending…';
  msgEl.style.display = 'none';

  try {
    const res = await fetch(`${API_BASE}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, service, budget: budget || undefined, message: msg }),
    });

    const data = await res.json();

    if (res.ok) {
      // Success
      msgEl.style.color   = '#5bc8f5';
      msgEl.style.display = 'block';
      msgEl.textContent   = '✅ ' + data.message;
      // Clear fields
      ['f-name','f-email','f-service','f-budget','f-msg'].forEach(id => {
        document.getElementById(id).value = '';
      });
      setTimeout(() => { msgEl.style.display = 'none'; }, 6000);

    } else {
      // Validation / server error
      let errText = data.error || 'Something went wrong.';
      if (data.details && data.details.length) {
        errText = data.details.map(d => d.message).join(' · ');
      }
      msgEl.style.color   = '#ef4444';
      msgEl.style.display = 'block';
      msgEl.textContent   = '⚠️ ' + errText;
    }

  } catch (err) {
    msgEl.style.color   = '#ef4444';
    msgEl.style.display = 'block';
    msgEl.textContent   = '⚠️ Could not reach the server. Please try again.';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Send Message 🚀';
  }
}
