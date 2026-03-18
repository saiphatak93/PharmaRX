import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

// ─── EmailJS ──────────────────────────────────────────────────────────────────
// Setup steps (free):
//  1. Go to https://www.emailjs.com and create a free account
//  2. Add an Email Service (Gmail recommended) → copy SERVICE_ID
//  3. Create an Email Template with these variables:
//       {{to_email}}  {{user_name}}  {{login_time}}  {{login_date}}
//  4. Copy your PUBLIC_KEY from Account → API Keys
//  5. Replace the three constants below with your real values

const EMAILJS_SERVICE_ID  = "YOUR_SERVICE_ID";   // e.g. "service_abc123"
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";  // e.g. "template_xyz456"
const EMAILJS_PUBLIC_KEY  = "YOUR_PUBLIC_KEY";    // e.g. "aBcDeFgHiJkLmNoP"

async function sendLoginEmail(userEmail, userName) {
  // Skip if not configured
  if (
    EMAILJS_SERVICE_ID  === "YOUR_SERVICE_ID" ||
    EMAILJS_TEMPLATE_ID === "YOUR_TEMPLATE_ID" ||
    EMAILJS_PUBLIC_KEY  === "YOUR_PUBLIC_KEY"
  ) {
    console.info("EmailJS not configured — skipping login email.");
    return;
  }
  try {
    const now  = new Date();
    const time = now.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", hour12:true });
    const date = now.toLocaleDateString("en-IN",  { weekday:"long", day:"numeric", month:"long", year:"numeric" });

    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id:  EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id:     EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email:   userEmail,
          user_name:  userName || userEmail.split("@")[0],
          login_time: time,
          login_date: date,
          app_name:   "PharmaRx",
        },
      }),
    });
    if (!res.ok) console.warn("EmailJS response:", res.status);
  } catch (err) {
    console.warn("Login email failed:", err.message);
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Nunito:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { overflow-x: hidden; -webkit-text-size-adjust: 100%; }

  .rx-auth-page {
    min-height: 100vh;
    display: flex;
    font-family: 'Nunito', sans-serif;
    background: #0f172a;
    overflow-x: hidden;
    width: 100%;
  }

  /* Left panel */
  .rx-auth-left {
    flex: 1;
    background: linear-gradient(145deg, #0f172a 0%, #1e3a8a 50%, #1e1b4b 100%);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 48px 40px;
    position: relative; overflow: hidden;
    box-sizing: border-box;
  }
  .rx-auth-left::before {
    content: '';
    position: absolute; top: -100px; right: -100px;
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(67,97,238,0.25) 0%, transparent 65%);
    pointer-events: none;
  }
  .rx-auth-left::after {
    content: '';
    position: absolute; bottom: -80px; left: -60px;
    width: 300px; height: 300px;
    background: radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 65%);
    pointer-events: none;
  }
  .rx-auth-brand {
    display: flex; align-items: center; gap: 14px;
    margin-bottom: 48px; position: relative; z-index: 1;
  }
  .rx-auth-brand-icon {
    width: 52px; height: 52px;
    background: linear-gradient(135deg, #4361ee, #7c3aed);
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 26px;
    box-shadow: 0 6px 20px rgba(67,97,238,0.45);
  }
  .rx-auth-brand-name { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
  .rx-auth-brand-sub  { color: rgba(255,255,255,0.45); font-size: 12px; margin-top: 2px; }

  .rx-auth-hero { position: relative; z-index: 1; text-align: center; max-width: 380px; }
  .rx-auth-hero h1 {
    font-family: 'Syne', sans-serif; font-size: 34px; font-weight: 800;
    color: #fff; line-height: 1.2; margin-bottom: 16px; letter-spacing: -0.5px;
  }
  .rx-auth-hero p { color: rgba(255,255,255,0.55); font-size: 15px; line-height: 1.6; }

  .rx-auth-features { margin-top: 44px; position: relative; z-index: 1; width: 100%; max-width: 360px; }
  .rx-auth-feat {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 18px; border-radius: 12px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    margin-bottom: 10px;
    backdrop-filter: blur(8px);
  }
  .rx-auth-feat-icon { font-size: 22px; flex-shrink: 0; }
  .rx-auth-feat-text { font-size: 13.5px; color: rgba(255,255,255,0.75); font-weight: 500; }

  /* Right panel */
  .rx-auth-right {
    width: 480px; flex-shrink: 0;
    background: #f8fafc;
    display: flex; align-items: center; justify-content: center;
    padding: 40px 48px;
  }
  .rx-auth-form-wrap { width: 100%; }

  .rx-auth-form-title {
    font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800;
    color: #0f172a; margin-bottom: 6px; letter-spacing: -0.4px;
  }
  .rx-auth-form-sub { color: #64748b; font-size: 14px; margin-bottom: 32px; }

  .rx-auth-label {
    display: block; font-size: 11px; font-weight: 700;
    color: #64748b; margin-bottom: 6px;
    text-transform: uppercase; letter-spacing: 0.6px;
  }
  .rx-auth-input {
    width: 100%; padding: 11px 14px;
    border: 1.5px solid #e2e8f0; border-radius: 10px;
    font-size: 14px; font-family: 'Nunito', sans-serif;
    color: #0f172a; background: #fff; outline: none;
    transition: all 0.2s; box-sizing: border-box;
  }
  .rx-auth-input:focus {
    border-color: #4361ee;
    box-shadow: 0 0 0 3px rgba(67,97,238,0.12);
  }
  .rx-auth-input::placeholder { color: #94a3b8; }
  .rx-auth-group { margin-bottom: 18px; }

  .rx-auth-input-wrap { position: relative; display: block; }

  .rx-auth-eye {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    font-size: 16px; color: #94a3b8; padding: 4px;
    line-height: 1; z-index: 2;
  }

  .rx-auth-btn {
    width: 100%; padding: 13px;
    background: linear-gradient(135deg, #4361ee, #6d28d9);
    color: #fff; border: none; border-radius: 10px;
    font-size: 15px; font-weight: 700;
    font-family: 'Nunito', sans-serif;
    cursor: pointer; transition: all 0.2s; margin-top: 6px;
    box-shadow: 0 4px 16px rgba(67,97,238,0.35);
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .rx-auth-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 22px rgba(67,97,238,0.45);
  }
  .rx-auth-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

  .rx-auth-error {
    display: flex; align-items: center; gap: 8px;
    color: #dc2626; font-size: 13px; font-weight: 500;
    padding: 10px 14px; background: #fef2f2;
    border: 1px solid #fecaca; border-radius: 8px;
    margin-bottom: 16px;
  }
  .rx-auth-success {
    display: flex; align-items: center; gap: 8px;
    color: #059669; font-size: 13px; font-weight: 500;
    padding: 10px 14px; background: #ecfdf5;
    border: 1px solid #6ee7b7; border-radius: 8px;
    margin-bottom: 16px;
  }

  .rx-auth-divider {
    display: flex; align-items: center; gap: 12px;
    margin: 22px 0; color: #94a3b8; font-size: 12px;
  }
  .rx-auth-divider::before, .rx-auth-divider::after {
    content: ''; flex: 1; height: 1px; background: #e2e8f0;
  }

  .rx-auth-footer { text-align: center; color: #64748b; font-size: 13.5px; margin-top: 20px; }
  .rx-auth-footer a { color: #4361ee; font-weight: 700; text-decoration: none; }
  .rx-auth-footer a:hover { text-decoration: underline; }

  .rx-auth-notify-badge {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 11.5px; color: #059669; font-weight: 600;
    background: #ecfdf5; border: 1px solid #6ee7b7;
    padding: 4px 10px; border-radius: 99px; margin-bottom: 24px;
  }

  /* Spinner */
  .rx-spinner {
    width: 18px; height: 18px;
    border: 2.5px solid rgba(255,255,255,0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: rx-spin 0.7s linear infinite;
    flex-shrink: 0;
  }
  @keyframes rx-spin { to { transform: rotate(360deg); } }

  /* ══════════════════════════════════════
     RESPONSIVE — Mobile & Tablet
     ══════════════════════════════════════ */

  /* ── Tablet (≤ 900px) — stack vertically ── */
  @media (max-width: 900px) {
    .rx-auth-page {
      flex-direction: column;
      background: linear-gradient(145deg, #0f172a 0%, #1e3a8a 50%, #1e1b4b 100%);
      min-height: 100vh;
    }

    /* Left panel becomes a top banner */
    .rx-auth-left {
      flex: none;
      width: 100%;
      padding: 32px 28px 28px;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 0;
    }
    .rx-auth-left::before { width: 180px; height: 180px; top: -50px; right: -30px; }
    .rx-auth-left::after  { width: 140px; height: 140px; bottom: -40px; left: 20%; }

    /* Brand centered */
    .rx-auth-brand {
      flex-direction: column;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
    }
    .rx-auth-brand-name { font-size: 24px; text-align: center; }
    .rx-auth-brand-sub  { text-align: center; }

    /* Hero centered and compact */
    .rx-auth-hero {
      text-align: center;
      max-width: 480px;
      width: 100%;
    }
    .rx-auth-hero h1 {
      font-size: 26px;
      margin-bottom: 10px;
      line-height: 1.25;
    }
    .rx-auth-hero p { font-size: 13.5px; }

    /* Features — horizontal scroll row */
    .rx-auth-features {
      display: flex;
      flex-direction: row;
      overflow-x: auto;
      gap: 10px;
      margin-top: 20px;
      max-width: 100%;
      padding-bottom: 4px;
      -webkit-overflow-scrolling: touch;
    }
    .rx-auth-features::-webkit-scrollbar { display: none; }
    .rx-auth-feat {
      flex-shrink: 0;
      min-width: 200px;
      max-width: 220px;
      padding: 12px 14px;
      margin-bottom: 0;
    }
    .rx-auth-feat-text { font-size: 12px; }

    /* Form panel — white card below */
    .rx-auth-right {
      width: 100%;
      background: #f8fafc;
      border-radius: 24px 24px 0 0;
      padding: 32px 28px 48px;
      box-shadow: 0 -8px 32px rgba(0,0,0,0.2);
    }
  }

  /* ── Mobile (≤ 600px) ── */
  @media (max-width: 600px) {
    .rx-auth-left { padding: 24px 20px 22px; }

    .rx-auth-brand-icon { width: 48px; height: 48px; font-size: 22px; }
    .rx-auth-brand-name { font-size: 22px; }

    .rx-auth-hero h1 { font-size: 22px; }
    .rx-auth-hero p  { font-size: 13px; }

    /* Features — hide on small screen to save vertical space */
    .rx-auth-features { display: none; }

    .rx-auth-right { padding: 28px 20px 44px; border-radius: 20px 20px 0 0; }
    .rx-auth-form-title { font-size: 22px; }
    .rx-auth-form-sub   { font-size: 13px; margin-bottom: 22px; }
    .rx-auth-notify-badge { font-size: 11px; margin-bottom: 16px; }
  }

  /* ── Small Mobile (≤ 400px) ── */
  @media (max-width: 400px) {
    .rx-auth-left { padding: 18px 14px 16px; }
    .rx-auth-brand-icon { width: 42px; height: 42px; font-size: 20px; }
    .rx-auth-brand-name { font-size: 19px; }
    .rx-auth-hero h1 { font-size: 19px; }

    .rx-auth-right { padding: 22px 14px 40px; }
    .rx-auth-form-title { font-size: 20px; }
    .rx-auth-input { padding: 10px 12px; font-size: 13.5px; }
    .rx-auth-btn   { padding: 12px; font-size: 14px; }
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminLogin() {
  const navigate = useNavigate();
  const [values,  setValues]  = useState({ email: "", password: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => { if (user) navigate("/"); });
    // Ensure viewport is set for mobile
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0';
    return () => unsub();
  }, [navigate]);

  const handleLogin = async () => {
    if (!values.email || !values.password)
      return setError("Please fill in all fields.");
    setError("");
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, values.email, values.password);
      // Send login notification email (non-blocking)
      sendLoginEmail(
        res.user.email,
        res.user.displayName || res.user.email.split("@")[0]
      );
      navigate("/");
    } catch (err) {
      const msg = err.code === "auth/invalid-credential" || err.code === "auth/wrong-password"
        ? "Incorrect email or password."
        : err.code === "auth/user-not-found"
        ? "No account found with this email."
        : err.code === "auth/too-many-requests"
        ? "Too many attempts. Please try again later."
        : err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="rx-auth-page">

        {/* ── Left panel ── */}
        <div className="rx-auth-left">
          <div className="rx-auth-brand">
            <div className="rx-auth-brand-icon">💊</div>
            <div>
              <div className="rx-auth-brand-name">PharmaRx</div>
              <div className="rx-auth-brand-sub">Management System</div>
            </div>
          </div>

          <div className="rx-auth-hero">
            <h1>Smart Pharmacy Management</h1>
            <p>Track inventory, manage stock movements, and keep your pharmacy running smoothly — all in one place.</p>
          </div>

          <div className="rx-auth-features">
            {[
              { icon:"📦", text:"Real-time inventory tracking with low-stock alerts" },
              { icon:"📊", text:"Daily stock in/out reports with full audit trail"   },
              { icon:"🔒", text:"Secure login with email activity notifications"      },
            ].map(f => (
              <div key={f.text} className="rx-auth-feat">
                <span className="rx-auth-feat-icon">{f.icon}</span>
                <span className="rx-auth-feat-text">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="rx-auth-right">
          <div className="rx-auth-form-wrap">

            <div className="rx-auth-notify-badge">
              🔔 Login activity notification will be sent to your email
            </div>

            <div className="rx-auth-form-title">Welcome back</div>
            <div className="rx-auth-form-sub">Sign in to your PharmaRx account</div>

            {/* Email */}
            <div className="rx-auth-group">
              <label className="rx-auth-label">Email Address</label>
              <input
                type="email"
                className="rx-auth-input"
                placeholder="admin@pharma.com"
                value={values.email}
                onChange={e => setValues(p => ({ ...p, email: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
            </div>

            {/* Password */}
            <div className="rx-auth-group">
              <label className="rx-auth-label">Password</label>
              <div className="rx-auth-input-wrap">
                <input
                  type={showPwd ? "text" : "password"}
                  className="rx-auth-input"
                  placeholder="••••••••"
                  style={{ paddingRight: 40 }}
                  value={values.password}
                  onChange={e => setValues(p => ({ ...p, password: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                />
                <button className="rx-auth-eye" type="button"
                  onClick={() => setShowPwd(v => !v)}
                  title={showPwd ? "Hide password" : "Show password"}>
                  {showPwd ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && (
              <div className="rx-auth-error">⚠️ {error}</div>
            )}

            <button className="rx-auth-btn" onClick={handleLogin} disabled={loading}>
              {loading ? <><div className="rx-spinner" /> Signing in…</> : "Sign In →"}
            </button>

            <div className="rx-auth-divider">or</div>

            <div className="rx-auth-footer">
              Don't have an account? <Link to="/register">Create one here</Link>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}