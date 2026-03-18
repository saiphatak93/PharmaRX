import { useState } from "react";
import { createPortal } from "react-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

// ─── DATA ────────────────────────────────────────────────────────────────────
const INITIAL_INVENTORY = [
  { id: 1, name: "Paracetamol 500mg", category: "Analgesics", type: "Tablet", stock: 1200, price: 2.5, expiry: "2026-08-01", supplier: "MedCorp" },
  { id: 2, name: "Amoxicillin 250mg", category: "Antibiotics", type: "Capsule", stock: 340, price: 8.0, expiry: "2025-12-15", supplier: "PharmGen" },
  { id: 3, name: "Omeprazole 20mg", category: "Antacids", type: "Capsule", stock: 580, price: 5.5, expiry: "2026-03-20", supplier: "BioPharm" },
  { id: 4, name: "Cetirizine 10mg", category: "Antihistamines", type: "Tablet", stock: 900, price: 3.0, expiry: "2027-01-10", supplier: "MedCorp" },
  { id: 5, name: "Metformin 500mg", category: "Antidiabetics", type: "Tablet", stock: 420, price: 6.0, expiry: "2026-06-30", supplier: "PharmGen" },
  { id: 6, name: "Atorvastatin 10mg", category: "Statins", type: "Tablet", stock: 150, price: 12.0, expiry: "2025-11-01", supplier: "LifeMed" },
  { id: 7, name: "Azithromycin 500mg", category: "Antibiotics", type: "Tablet", stock: 80, price: 18.0, expiry: "2025-10-05", supplier: "BioPharm" },
  { id: 8, name: "Cough Syrup 100ml", category: "Cough & Cold", type: "Syrup", stock: 230, price: 45.0, expiry: "2026-05-15", supplier: "MedCorp" },
  { id: 9, name: "Vitamin D3 1000IU", category: "Vitamins", type: "Softgel", stock: 600, price: 9.0, expiry: "2027-08-20", supplier: "LifeMed" },
  { id: 10, name: "Insulin Glargine", category: "Antidiabetics", type: "Injection", stock: 45, price: 350.0, expiry: "2025-09-30", supplier: "PharmGen" },
];

const MEDICINE_CATEGORIES = ["Analgesics", "Antibiotics", "Antacids", "Antihistamines", "Antidiabetics", "Statins", "Cough & Cold", "Vitamins"];
const MEDICINE_TYPES = ["Tablet", "Capsule", "Syrup", "Injection", "Softgel", "Ointment", "Drops", "Powder"];

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #f0f4f8;
    --sidebar: #0a1628;
    --sidebar-hover: #1a2d4a;
    --sidebar-active: #1e6fff;
    --primary: #1e6fff;
    --primary-light: #e8f0ff;
    --accent: #00d4a1;
    --danger: #ff4757;
    --warning: #ffa502;
    --success: #2ed573;
    --card: #ffffff;
    --text: #1a2332;
    --text-muted: #6b7a90;
    --border: #e2e8f0;
    --shadow: 0 2px 12px rgba(0,0,0,0.07);
    --shadow-lg: 0 8px 32px rgba(0,0,0,0.12);
    --font-head: 'Space Grotesk', sans-serif;
    --font-body: 'DM Sans', sans-serif;
    --radius: 12px;
    --sidebar-w: 240px;
  }

  body { font-family: var(--font-body); background: var(--bg); color: var(--text); }

  .app { display: flex; min-height: 100vh; }

  /* SIDEBAR */
  .sidebar {
    width: var(--sidebar-w); background: var(--sidebar); position: fixed;
    top: 0; left: 0; height: 100vh; display: flex; flex-direction: column;
    z-index: 100; box-shadow: 4px 0 24px rgba(0,0,0,0.15);
  }
  .sidebar-logo {
    padding: 24px 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  .logo-mark {
    display: flex; align-items: center; gap: 10px;
  }
  .logo-icon {
    width: 36px; height: 36px; background: var(--primary);
    border-radius: 10px; display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  }
  .logo-text { font-family: var(--font-head); color: #fff; font-size: 16px; font-weight: 700; }
  .logo-sub { color: rgba(255,255,255,0.4); font-size: 11px; margin-top: 1px; }

  .sidebar-nav { flex: 1; padding: 16px 12px; overflow-y: auto; }
  .nav-section-label {
    color: rgba(255,255,255,0.3); font-size: 10px; font-weight: 600;
    letter-spacing: 1.5px; text-transform: uppercase; padding: 12px 8px 6px;
  }
  .nav-item {
    display: flex; align-items: center; gap: 12px; padding: 10px 12px;
    border-radius: 8px; cursor: pointer; transition: all 0.2s;
    color: rgba(255,255,255,0.55); font-size: 14px; font-weight: 400; margin-bottom: 2px;
    border: none; background: none; width: 100%; text-align: left;
  }
  .nav-item:hover { background: var(--sidebar-hover); color: #fff; }
  .nav-item.active { background: var(--sidebar-active); color: #fff; font-weight: 500; }
  .nav-item .icon { font-size: 17px; width: 20px; text-align: center; flex-shrink: 0; }
  .nav-badge {
    margin-left: auto; background: var(--danger); color: #fff;
    font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 20px;
  }

  .sidebar-footer {
    padding: 16px; border-top: 1px solid rgba(255,255,255,0.07);
  }
  .sidebar-profile {
    display: flex; align-items: center; gap: 10px; padding: 8px;
    border-radius: 8px; cursor: pointer; transition: background 0.2s;
  }
  .sidebar-profile:hover { background: var(--sidebar-hover); }
  .avatar-sm {
    width: 34px; height: 34px; border-radius: 50%; background: var(--primary);
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 13px; font-weight: 700; flex-shrink: 0;
  }
  .profile-name { color: #fff; font-size: 13px; font-weight: 500; }
  .profile-role { color: rgba(255,255,255,0.4); font-size: 11px; }

  /* MAIN */
  .main { margin-left: var(--sidebar-w); flex: 1; display: flex; flex-direction: column; }

  /* TOPBAR */
  .topbar {
    background: var(--card); border-bottom: 1px solid var(--border);
    padding: 14px 28px; display: flex; align-items: center; gap: 16px;
    position: sticky; top: 0; z-index: 50; box-shadow: var(--shadow);
  }
  .topbar-title { font-family: var(--font-head); font-size: 18px; font-weight: 700; flex: 1; }
  .topbar-search {
    display: flex; align-items: center; gap: 8px; background: var(--bg);
    border: 1px solid var(--border); border-radius: 8px; padding: 8px 14px;
    font-size: 13px; color: var(--text-muted); width: 220px;
  }
  .topbar-search input {
    border: none; background: none; outline: none; font-size: 13px;
    font-family: var(--font-body); color: var(--text); width: 100%;
  }
  .topbar-actions { display: flex; align-items: center; gap: 10px; }
  .icon-btn {
    width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--border);
    background: var(--card); cursor: pointer; display: flex; align-items: center;
    justify-content: center; font-size: 15px; color: var(--text-muted);
    transition: all 0.2s; position: relative;
  }
  .icon-btn:hover { background: var(--primary-light); border-color: var(--primary); color: var(--primary); }
  .notif-dot {
    position: absolute; top: 5px; right: 5px; width: 7px; height: 7px;
    background: var(--danger); border-radius: 50%; border: 1.5px solid #fff;
  }

  /* PAGE CONTENT */
  .page { padding: 24px 28px; flex: 1; }

  /* STAT CARDS */
  .stats-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;
  }
  .stat-card {
    background: var(--card); border-radius: var(--radius); padding: 20px;
    box-shadow: var(--shadow); border: 1px solid var(--border);
    display: flex; flex-direction: column; gap: 12px; transition: transform 0.2s, box-shadow 0.2s;
  }
  .stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
  .stat-top { display: flex; align-items: center; justify-content: space-between; }
  .stat-icon {
    width: 44px; height: 44px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; font-size: 20px;
  }
  .stat-icon.blue { background: #e8f0ff; }
  .stat-icon.green { background: #e6faf5; }
  .stat-icon.orange { background: #fff4e6; }
  .stat-icon.red { background: #ffe8e8; }
  .stat-change {
    font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 20px;
  }
  .stat-change.up { background: #e6faf5; color: var(--accent); }
  .stat-change.down { background: #ffe8e8; color: var(--danger); }
  .stat-value { font-family: var(--font-head); font-size: 26px; font-weight: 700; line-height: 1; }
  .stat-label { color: var(--text-muted); font-size: 13px; }

  /* CARDS */
  .card {
    background: var(--card); border-radius: var(--radius); border: 1px solid var(--border);
    box-shadow: var(--shadow);
  }
  .card-header {
    padding: 18px 20px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .card-title { font-family: var(--font-head); font-size: 15px; font-weight: 700; }
  .card-body { padding: 20px; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-bottom: 20px; }

  /* TABLE */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  th {
    text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 600;
    color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px;
    border-bottom: 1px solid var(--border); background: var(--bg);
  }
  td { padding: 12px 14px; font-size: 13.5px; border-bottom: 1px solid var(--border); }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #fafbff; }

  /* BADGES */
  .badge {
    display: inline-flex; align-items: center; padding: 3px 10px;
    border-radius: 20px; font-size: 11px; font-weight: 600;
  }
  .badge-success { background: #e6faf5; color: #00a67d; }
  .badge-danger { background: #ffe8e8; color: var(--danger); }
  .badge-warning { background: #fff4e6; color: #e68a00; }
  .badge-info { background: #e8f0ff; color: var(--primary); }
  .badge-gray { background: #f0f4f8; color: var(--text-muted); }

  /* BUTTONS */
  .btn {
    display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px;
    border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer;
    border: none; font-family: var(--font-body); transition: all 0.2s;
  }
  .btn-primary { background: var(--primary); color: #fff; }
  .btn-primary:hover { background: #1558d6; }
  .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text); }
  .btn-outline:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }
  .btn-danger { background: var(--danger); color: #fff; }
  .btn-danger:hover { background: #e03030; }
  .btn-sm { padding: 5px 12px; font-size: 12px; border-radius: 6px; }
  .btn-icon { padding: 7px 9px; border-radius: 7px; border: 1px solid var(--border); background: var(--card); cursor: pointer; font-size: 14px; color: var(--text-muted); transition: all 0.2s; }
  .btn-icon:hover { border-color: var(--primary); color: var(--primary); }

  /* FORMS */
  .form-group { margin-bottom: 16px; }
  .form-label { display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  .form-control {
    width: 100%; padding: 9px 12px; border: 1px solid var(--border); border-radius: 8px;
    font-size: 13.5px; font-family: var(--font-body); color: var(--text);
    background: var(--card); outline: none; transition: border-color 0.2s;
  }
  .form-control:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(30,111,255,0.1); }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }

  /* MODAL */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(10,22,40,0.55); z-index: 200;
    display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.15s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .modal {
    background: var(--card); border-radius: 16px; width: 540px; max-width: 95vw;
    max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-lg);
    animation: slideUp 0.2s ease;
  }
  @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  .modal-header {
    padding: 20px 24px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .modal-title { font-family: var(--font-head); font-size: 16px; font-weight: 700; }
  .modal-body { padding: 24px; }
  .modal-footer { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 10px; }

  /* LOW STOCK ALERT BAR */
  .alert-bar {
    display: flex; align-items: center; gap: 10px; padding: 10px 16px;
    background: #fff4e6; border: 1px solid #ffd591; border-radius: 8px;
    font-size: 13px; color: #a05e00; margin-bottom: 20px;
  }

  /* PROGRESS BAR */
  .progress { background: #e2e8f0; border-radius: 99px; overflow: hidden; }
  .progress-bar { height: 100%; border-radius: 99px; }

  /* CATEGORY GRID */
  .cat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
  .cat-card {
    background: var(--card); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 20px 16px; text-align: center; cursor: pointer; transition: all 0.2s;
  }
  .cat-card:hover { border-color: var(--primary); box-shadow: 0 4px 16px rgba(30,111,255,0.1); transform: translateY(-2px); }
  .cat-icon { font-size: 28px; margin-bottom: 8px; }
  .cat-name { font-weight: 600; font-size: 13px; margin-bottom: 3px; }
  .cat-count { color: var(--text-muted); font-size: 12px; }

  /* TYPE GRID */
  .type-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
  .type-card {
    background: var(--card); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 18px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 12px;
  }
  .type-card:hover { border-color: var(--primary); box-shadow: 0 4px 16px rgba(30,111,255,0.1); }
  .type-dot { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }

  /* LOGIN */
  .login-page {
    min-height: 100vh; background: linear-gradient(135deg, #0a1628 0%, #0d2347 50%, #0a1628 100%);
    display: flex; align-items: center; justify-content: center;
  }
  .login-box {
    background: var(--card); border-radius: 20px; padding: 44px 40px;
    width: 420px; max-width: 95vw; box-shadow: var(--shadow-lg);
  }
  .login-logo { text-align: center; margin-bottom: 32px; }
  .login-logo-icon {
    width: 60px; height: 60px; background: var(--primary); border-radius: 16px;
    display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 12px;
  }

  /* PROFILE */
  .profile-header {
    background: linear-gradient(135deg, var(--primary) 0%, #0d3d8c 100%);
    border-radius: var(--radius); padding: 28px; color: #fff; margin-bottom: 20px;
    display: flex; align-items: center; gap: 20px;
  }
  .avatar-lg {
    width: 70px; height: 70px; border-radius: 50%; background: rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 26px; font-weight: 700; color: #fff; border: 3px solid rgba(255,255,255,0.3);
    flex-shrink: 0;
  }

  /* RECENT SALES */
  .sale-item {
    display: flex; align-items: center; gap: 12px; padding: 10px 0;
    border-bottom: 1px solid var(--border);
  }
  .sale-item:last-child { border-bottom: none; }
  .sale-icon { width: 36px; height: 36px; background: var(--primary-light); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }

  /* DONUT CHART PLACEHOLDER */
  .donut-wrap { display: flex; align-items: center; justify-content: center; padding: 16px 0; }
  .donut-legend { margin-top: 12px; }
  .legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; margin-bottom: 7px; }
  .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

  .empty-state { text-align: center; padding: 40px; color: var(--text-muted); }
  .empty-icon { font-size: 40px; margin-bottom: 12px; }

  .search-filter-bar {
    display: flex; gap: 10px; margin-bottom: 18px; align-items: center; flex-wrap: wrap;
  }
  .search-filter-bar .form-control { max-width: 240px; }
  select.form-control { cursor: pointer; }

  .tag { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 500; background: var(--primary-light); color: var(--primary); }

  .scroll-y { overflow-y: auto; max-height: 360px; }
`;


const CAT_ICONS = {
  Analgesics: "🔴", Antibiotics: "🟢", Antacids: "🔵", Antihistamines: "🟡",
  Antidiabetics: "🩺", Statins: "💛", "Cough & Cold": "🤧", Vitamins: "🟣",
};
const TYPE_ICONS = {
  Tablet: "⬜", Capsule: "💊", Syrup: "🍶", Injection: "💉",
  Softgel: "🔵", Ointment: "🧴", Drops: "💧", Powder: "⬜",
};
const TYPE_COLORS = {
  Tablet: "#e8f0ff", Capsule: "#e6faf5", Syrup: "#fff4e6", Injection: "#ffe8e8",
  Softgel: "#f0e6ff", Ointment: "#e6f7ff", Drops: "#e6faf5", Powder: "#f0f0f0",
};

function Modal({ title, onClose, children, footer }) {
  return createPortal(
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,22,40,0.6)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          width: 560,
          maxWidth: "95vw",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
        }}
      >
        {/* HEADER */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 700, color: "#1a2332" }}>
            {title}
          </span>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "#6b7a90" }}>✖️</button>
        </div>

        {/* BODY */}
        <div style={{ padding: 24 }}>
          {/* inject scoped styles for form elements */}
          <style>{`
            .pm-form-group { margin-bottom: 16px; }
            .pm-form-label { display: block; font-size: 11px; font-weight: 600; color: #6b7a90; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
            .pm-form-control { width: 100%; padding: 9px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13.5px; font-family: 'DM Sans',sans-serif; color: #1a2332; background: #fff; outline: none; box-sizing: border-box; }
            .pm-form-control:focus { border-color: #1e6fff; box-shadow: 0 0 0 3px rgba(30,111,255,0.1); }
            .pm-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .pm-form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
            .pm-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; font-family: 'DM Sans',sans-serif; }
            .pm-btn-primary { background: #1e6fff; color: #fff; }
            .pm-btn-primary:hover { background: #1558d6; }
            .pm-btn-outline { background: transparent; border: 1px solid #e2e8f0; color: #1a2332; }
            .pm-btn-outline:hover { border-color: #1e6fff; color: #1e6fff; }
          `}</style>
          {children}
        </div>

        {/* FOOTER */}
        {footer && (
          <div style={{
            padding: "16px 24px",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function StockBar({ stock }) {
  const pct = Math.min(100, (stock / 1200) * 100);
  const color = stock < 100 ? "#ff4757" : stock < 300 ? "#ffa502" : "#2ed573";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div className="progress" style={{ height: 6, width: 70, flex: 1 }}>
        <div className="progress-bar" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span style={{ fontSize: 12, color: stock < 100 ? "#ff4757" : stock < 300 ? "#ffa502" : "#6b7a90", minWidth: 32 }}>{stock}</span>
    </div>
  );
}


// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ inventory, setPage }) {
  const lowStock = inventory.filter(i => i.stock < 150).length;
  const expiringSoon = inventory.filter(i => new Date(i.expiry) < new Date(Date.now() + 90 * 86400000)).length;
  const totalValue = inventory.reduce((s, i) => s + i.stock * i.price, 0);

  const recentSales = [
    { med: "Paracetamol 500mg", qty: 24, amt: 60, time: "10 min ago" },
    { med: "Amoxicillin 250mg", qty: 8, amt: 64, time: "32 min ago" },
    { med: "Vitamin D3 1000IU", qty: 15, amt: 135, time: "1 hr ago" },
    { med: "Omeprazole 20mg", qty: 12, amt: 66, time: "2 hrs ago" },
    { med: "Cetirizine 10mg", qty: 20, amt: 60, time: "3 hrs ago" },
  ];

  const catCounts = {};
  MEDICINE_CATEGORIES.forEach(c => { catCounts[c] = inventory.filter(i => i.category === c).length; });

  return (
    <div className="page">
      {lowStock > 0 && (
        <div className="alert-bar">
          ⚠️ <strong>{lowStock} medicines</strong> have low stock and need immediate restocking.
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon blue">💊</div>
            <span className="stat-change up">↑ 2.4%</span>
          </div>
          <div>
            <div className="stat-value">{inventory.length}</div>
            <div className="stat-label">Total Medicines</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon green">💰</div>
            <span className="stat-change up">↑ 8.1%</span>
          </div>
          <div>
            <div className="stat-value">₹{(totalValue / 1000).toFixed(1)}K</div>
            <div className="stat-label">Inventory Value</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon orange">⚠️</div>
            <span className="stat-change down">↓ Need action</span>
          </div>
          <div>
            <div className="stat-value" style={{ color: lowStock > 0 ? "var(--danger)" : "inherit" }}>{lowStock}</div>
            <div className="stat-label">Low Stock Alerts</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon red">📅</div>
            <span className="stat-change down">↓ Check soon</span>
          </div>
          <div>
            <div className="stat-value" style={{ color: expiringSoon > 0 ? "var(--warning)" : "inherit" }}>{expiringSoon}</div>
            <div className="stat-label">Expiring in 90 Days</div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">📊 Stock by Category</span>
          </div>
          <div className="card-body">
            {MEDICINE_CATEGORIES.slice(0, 6).map(cat => {

              const totalStock = inventory.filter(i => i.category === cat).reduce((s, i) => s + i.stock, 0);
              const pct = Math.min(100, (totalStock / 2000) * 100);
              return (
                <div key={cat} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span>{CAT_ICONS[cat]} {cat}</span>
                    <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{totalStock} units</span>
                  </div>
                  <div className="progress" style={{ height: 7 }}>
                    <div className="progress-bar" style={{ width: `${pct}%`, background: "var(--primary)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">🛒 Recent Sales</span>
            <button className="btn btn-outline btn-sm" onClick={() => setPage("inventory")}>
              View All
            </button>
          </div>
          <div className="card-body" style={{ padding: "12px 20px" }}>
            {recentSales.map((s, i) => (
              <div className="sale-item" key={i}>
                <div className="sale-icon">💊</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{s.med}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Qty: {s.qty} · {s.time}</div>
                </div>
                <div style={{ fontWeight: 700, color: "var(--accent)" }}>₹{s.amt}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">⚠️ Low Stock & Expiry Alert</span>
          <span className="badge badge-danger">{lowStock + expiringSoon} Alerts</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Medicine</th><th>Category</th><th>Stock</th><th>Expiry</th><th>Status</th></tr></thead>
            <tbody>
              {inventory.filter(i => i.stock < 200 || new Date(i.expiry) < new Date(Date.now() + 90 * 86400000))
                .slice(0, 6)
                .map(item => {
                  const expDate = new Date(item.expiry);
                  const daysLeft = Math.ceil((expDate - Date.now()) / 86400000);
                  return (
                    <tr key={item.id}>
                      <td><strong>{item.name}</strong></td>
                      <td><span className="tag">{item.category}</span></td>
                      <td><StockBar stock={item.stock} /></td>
                      <td style={{ fontSize: 13 }}>{item.expiry}</td>
                      <td>
                        {item.stock < 100 ? <span className="badge badge-danger">Critical</span>
                          : item.stock < 200 ? <span className="badge badge-warning">Low Stock</span>
                            : daysLeft < 30 ? <span className="badge badge-danger">Expiring</span>
                              : <span className="badge badge-warning">Check Soon</span>}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

//----Inventory--------------
function Inventory({ inventory, setInventory }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: "", category: "", type: "", stock: "", price: "", expiry: "", supplier: "" });

  const filtered = inventory.filter(i =>
    (i.name.toLowerCase().includes(search.toLowerCase()) || i.supplier.toLowerCase().includes(search.toLowerCase())) &&
    (!filterCat || i.category === filterCat) &&
    (!filterType || i.type === filterType)
  );

  const openAdd = () => { console.log("openAdd clicked!"); setEditItem(null); setForm({ name: "", category: "", type: "", stock: "", price: "", expiry: "", supplier: "" }); setShowModal(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ ...item, stock: String(item.stock), price: String(item.price) }); setShowModal(true); };
  const handleDelete = (id) => { if (window.confirm("Delete this medicine?")) setInventory(prev => prev.filter(i => i.id !== id)); };
  const handleSave = () => {
    if (!form.name || !form.category || !form.type || !form.stock || !form.price || !form.expiry) return alert("Fill all fields");
    if (editItem) {
      setInventory(prev => prev.map(i => i.id === editItem.id ? { ...form, id: editItem.id, stock: +form.stock, price: +form.price } : i));
    } else {
      setInventory(prev => [...prev, { ...form, id: Date.now(), stock: +form.stock, price: +form.price }]);
    }
    setShowModal(false);
  };

  // ── ADD THIS FUNCTION ──
  const handlePrint = () => {
    const printContent = `
      <html>
      <head>
        <title>PharmaRx - Medicine Inventory</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #1a2332; }
          h2 { color: #1e6fff; margin-bottom: 4px; }
          p { color: #6b7a90; font-size: 13px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { background: #f0f4f8; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7a90; border-bottom: 2px solid #e2e8f0; }
          td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
          tr:last-child td { border-bottom: none; }
          .badge { padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
          .good { background: #e6faf5; color: #00a67d; }
          .low { background: #fff4e6; color: #e68a00; }
          .critical { background: #ffe8e8; color: #ff4757; }
          .footer { margin-top: 24px; font-size: 12px; color: #6b7a90; text-align: right; }
        </style>
      </head>
      <body>
        <h2>💊 PharmaRx — Medicine Inventory</h2>
        <p>Generated on: ${new Date().toLocaleString()} &nbsp;|&nbsp; Total: ${filtered.length} medicines</p>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Medicine Name</th>
              <th>Category</th>
              <th>Type</th>
              <th>Stock</th>
              <th>Price (₹)</th>
              <th>Expiry</th>
              <th>Supplier</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((item, idx) => {
      const status = item.stock < 100 ? `<span class="badge critical">Critical</span>`
        : item.stock < 300 ? `<span class="badge low">Low</span>`
          : `<span class="badge good">Good</span>`;
      return `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${item.name}</strong></td>
                  <td>${item.category}</td>
                  <td>${item.type}</td>
                  <td>${item.stock}</td>
                  <td>₹${item.price}</td>
                  <td>${item.expiry}</td>
                  <td>${item.supplier}</td>
                  <td>${status}</td>
                </tr>`;
    }).join("")}
          </tbody>
        </table>
        <div class="footer">PharmaRx Pharmacy Management System</div>
      </body>
      </html>
    `;
    const win = window.open("", "_blank");
    win.document.write(printContent);
    win.document.close();
    win.print();
  };

  return (
    <div className="page">
      <div className="search-filter-bar">
        <input className="form-control" placeholder="🔍 Search medicine or supplier..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, maxWidth: 280 }} />
        <select className="form-control" value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ width: 160 }}>
          <option value="">All Categories</option>
          {MEDICINE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="form-control" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 140 }}>
          <option value="">All Types</option>
          {MEDICINE_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>

        {/* ── ADD THESE TWO BUTTONS ── */}
        <button className="btn btn-outline" onClick={handlePrint}>
          🖨️ Print
        </button>
        <button className="btn btn-primary" onClick={openAdd}>
          ➕ Add Medicine
        </button>
      </div>

      {/* rest of your JSX stays exactly the same below... */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">📦 Medicine Inventory ({filtered.length})</span>
          <span className="badge badge-info">{inventory.length} Total Items</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Medicine Name</th><th>Category</th><th>Type</th>
                <th>Stock</th><th>Price</th><th>Expiry</th><th>Supplier</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10}><div className="empty-state"><div className="empty-icon">📭</div><div>No medicines found</div></div></td></tr>
              ) : filtered.map((item, idx) => {
                const daysLeft = Math.ceil((new Date(item.expiry) - Date.now()) / 86400000);
                return (
                  <tr key={item.id}>
                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{idx + 1}</td>
                    <td><strong>{item.name}</strong></td>
                    <td><span className="tag">{item.category}</span></td>
                    <td>{TYPE_ICONS[item.type]} {item.type}</td>
                    <td><StockBar stock={item.stock} /></td>
                    <td style={{ fontWeight: 600 }}>₹{item.price}</td>
                    <td style={{ fontSize: 12, color: daysLeft < 60 ? "var(--danger)" : "var(--text-muted)" }}>{item.expiry}{daysLeft < 60 ? " ⚠️" : ""}</td>
                    <td style={{ fontSize: 12 }}>{item.supplier}</td>
                    <td>
                      {item.stock < 100 ? <span className="badge badge-danger">Critical</span>
                        : item.stock < 300 ? <span className="badge badge-warning">Low</span>
                          : <span className="badge badge-success">Good</span>}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn-icon" onClick={() => openEdit(item)} title="Edit">✏️</button>
                        <button className="btn-icon" onClick={() => handleDelete(item.id)} title="Delete" style={{ color: "var(--danger)" }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title={editItem ? "Edit Medicine" : "Add New Medicine"} onClose={() => setShowModal(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save Medicine</button></>}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Medicine Name</label><input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Paracetamol 500mg" /></div>
            <div className="form-group"><label className="form-label">Supplier</label><input className="form-control" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} placeholder="Supplier name" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Category</label>
              <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="">Select category</option>{MEDICINE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Type</label>
              <select className="form-control" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="">Select type</option>{MEDICINE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row-3">
            <div className="form-group"><label className="form-label">Stock (units)</label><input className="form-control" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Price (₹)</label><input className="form-control" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Expiry Date</label><input className="form-control" type="date" value={form.expiry} onChange={e => setForm({ ...form, expiry: e.target.value })} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── MEDICINE CATEGORY ────────────────────────────────────────────────────────
function MedicineCategory({ inventory }) {
  const [showModal, setShowModal] = useState(false);
  const [cats, setCats] = useState(MEDICINE_CATEGORIES);
  const [newCat, setNewCat] = useState("");
  const [selected, setSelected] = useState(null);

  const addCat = () => { if (newCat.trim() && !cats.includes(newCat.trim())) { setCats([...cats, newCat.trim()]); setNewCat(""); } };
  const delCat = (c) => { if (inventory.some(i => i.category === c)) { alert("Cannot delete: medicines exist in this category."); return; } setCats(cats.filter(x => x !== c)); };

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-head)", fontSize: 20, fontWeight: 700 }}>Medicine Categories</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 3 }}>Manage all medicine categories in your pharmacy</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add Category</button>
      </div>

      <div className="cat-grid">
        {cats.map(cat => {
          const count = inventory.filter(i => i.category === cat).length;
          const totalStock = inventory.filter(i => i.category === cat).reduce((s, i) => s + i.stock, 0);
          return (
            <div key={cat} className="cat-card" onClick={() => setSelected(cat === selected ? null : cat)}>
              <div className="cat-icon">{CAT_ICONS[cat] || "💊"}</div>
              <div className="cat-name">{cat}</div>
              <div className="cat-count">{count} medicines · {totalStock} units</div>
              {selected === cat && (
                <div style={{ marginTop: 10, display: "flex", gap: 6, justifyContent: "center" }}>
                  <button className="btn btn-outline btn-sm" onClick={e => { e.stopPropagation(); setSelected(null); }}>Close</button>
                  <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); delCat(cat); }}>Delete</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <span className="card-title">{CAT_ICONS[selected] || "💊"} {selected} — Medicines</span>
            <span className="badge badge-info">{inventory.filter(i => i.category === selected).length} items</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Medicine</th><th>Type</th><th>Stock</th><th>Price</th><th>Expiry</th></tr></thead>
              <tbody>
                {inventory.filter(i => i.category === selected).map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong></td>
                    <td>{TYPE_ICONS[item.type]} {item.type}</td>
                    <td><StockBar stock={item.stock} /></td>
                    <td>₹{item.price}</td>
                    <td style={{ fontSize: 12 }}>{item.expiry}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <Modal title="Add New Category" onClose={() => setShowModal(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={() => { addCat(); setShowModal(false); }}>Add Category</button></>}>
          <div className="form-group">
            <label className="form-label">Category Name</label>
            <input className="form-control" value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="e.g. Antivirals" />
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>This category will be available when adding medicines.</p>
        </Modal>
      )}
    </div>
  );
}

// ─── MEDICINE TYPE ────────────────────────────────────────────────────────────
function MedicineType({ inventory }) {
  const [showModal, setShowModal] = useState(false);
  const [types, setTypes] = useState(MEDICINE_TYPES);
  const [newType, setNewType] = useState("");
  const [selected, setSelected] = useState(null);

  const addType = () => { if (newType.trim() && !types.includes(newType.trim())) { setTypes([...types, newType.trim()]); setNewType(""); } };
  const delType = (t) => { if (inventory.some(i => i.type === t)) { alert("Cannot delete: medicines exist with this type."); return; } setTypes(types.filter(x => x !== t)); };

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-head)", fontSize: 20, fontWeight: 700 }}>Medicine Types</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 3 }}>Manage dosage forms and formulation types</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add Type</button>
      </div>

      <div className="type-grid">
        {types.map(type => {
          const count = inventory.filter(i => i.type === type).length;
          return (
            <div key={type} className="type-card" onClick={() => setSelected(type === selected ? null : type)}>
              <div className="type-dot" style={{ background: TYPE_COLORS[type] || "#f0f0f0" }}>{TYPE_ICONS[type] || "💊"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{type}</div>
                <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{count} medicines</div>
              </div>
              {selected === type && <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); delType(type); }}>Del</button>}
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <span className="card-title">{TYPE_ICONS[selected] || "💊"} {selected} Medicines</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Medicine</th><th>Category</th><th>Stock</th><th>Price</th><th>Expiry</th></tr></thead>
              <tbody>
                {inventory.filter(i => i.type === selected).map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong></td>
                    <td><span className="tag">{item.category}</span></td>
                    <td><StockBar stock={item.stock} /></td>
                    <td>₹{item.price}</td>
                    <td style={{ fontSize: 12 }}>{item.expiry}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <Modal title="Add Medicine Type" onClose={() => setShowModal(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={() => { addType(); setShowModal(false); }}>Add Type</button></>}>
          <div className="form-group">
            <label className="form-label">Type / Dosage Form</label>
            <input className="form-control" value={newType} onChange={e => setNewType(e.target.value)} placeholder="e.g. Lotion, Suppository..." />
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
// ─── PROFILE ──────────────────────────────────────────────────────────────────

function Profile({ onLogout }) {

  // ── Get Firebase logged-in user ──
  const firebaseUser = auth.currentUser;
  const firebaseName = firebaseUser?.displayName || "Admin User";
  const firebaseEmail = firebaseUser?.email || "admin@pharma.com";

  const [profile, setProfile] = useState({
    name: firebaseName,           // ← from Firebase
    email: firebaseEmail,         // ← from Firebase
    phone: "",
    role: "Admin Pharmacist",
    license: "",
    pharmacy: "PharmaRx Healthcare",
    address: "",
  });
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ ...profile });

  const handleSave = () => { setProfile(form); setEdit(false); };

  return (
    <div className="page">
      <div className="profile-header">
        <div className="avatar-lg">
          {profile.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h2 style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 700 }}>{profile.name}</h2>
          <div style={{ opacity: 0.8, fontSize: 14, marginTop: 4 }}>{profile.role} · {profile.pharmacy}</div>
          <div style={{ opacity: 0.6, fontSize: 13, marginTop: 4 }}>{profile.email}</div>
          {profile.license && <div style={{ opacity: 0.6, fontSize: 13, marginTop: 2 }}>License: {profile.license}</div>}
        </div>
        <button className="btn" style={{ marginLeft: "auto", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }} onClick={() => setEdit(true)}>
          ✏️ Edit Profile
        </button>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">👤 Personal Information</span></div>
          <div className="card-body">
            {[["Full Name", profile.name], ["Email", profile.email], ["Phone", profile.phone || "Not set"], ["Address", profile.address || "Not set"]].map(([label, val]) => (
              <div key={label} style={{ display: "flex", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-muted)", fontSize: 13, width: 120, flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">🏥 Pharmacy Details</span></div>
          <div className="card-body">
            {[["Role", profile.role], ["License No.", profile.license || "Not set"], ["Pharmacy", profile.pharmacy]].map(([label, val]) => (
              <div key={label} style={{ display: "flex", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-muted)", fontSize: 13, width: 120, flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{val}</span>
              </div>
            ))}
            <div style={{ marginTop: 20 }}>
              <button className="btn btn-danger" onClick={onLogout} style={{ width: "100%", justifyContent: "center" }}>🚪 Sign Out</button>
            </div>
          </div>
        </div>
      </div>

      {edit && (
        <Modal title="Edit Profile" onClose={() => setEdit(false)}
          footer={
            <>
              <button className="pm-btn pm-btn-outline" onClick={() => setEdit(false)}>Cancel</button>
              <button className="pm-btn pm-btn-primary" onClick={handleSave}>Save Changes</button>
            </>
          }>
          <div className="pm-form-row">
            <div className="pm-form-group"><label className="pm-form-label">Full Name</label><input className="pm-form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="pm-form-group"><label className="pm-form-label">Email</label><input className="pm-form-control" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div className="pm-form-row">
            <div className="pm-form-group"><label className="pm-form-label">Phone</label><input className="pm-form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="pm-form-group"><label className="pm-form-label">Role</label><input className="pm-form-control" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
          </div>
          <div className="pm-form-row">
            <div className="pm-form-group"><label className="pm-form-label">License No.</label><input className="pm-form-control" value={form.license} onChange={e => setForm({ ...form, license: e.target.value })} /></div>
            <div className="pm-form-group"><label className="pm-form-label">Pharmacy Name</label><input className="pm-form-control" value={form.pharmacy} onChange={e => setForm({ ...form, pharmacy: e.target.value })} /></div>
          </div>
          <div className="pm-form-group"><label className="pm-form-label">Address</label><input className="pm-form-control" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
        </Modal>
      )}
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function PharmacyApp() {
  const navigate = useNavigate();
  const [page, setPage] = useState("dashboard");
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const lowCount = inventory.filter(i => i.stock < 150).length;
  const [topSearch, setTopSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const handleLogout = () => {                  // ← fix errors 2 & 3
    signOut(auth).then(() => navigate("/login"));
  };
  // ── Search handler ──
  const handleTopSearch = (val) => {
    setTopSearch(val);
    if (val.trim().length < 2) { setSearchResults([]); setShowResults(false); return; }
    const results = inventory.filter(i =>
      i.name.toLowerCase().includes(val.toLowerCase()) ||
      i.category.toLowerCase().includes(val.toLowerCase()) ||
      i.supplier.toLowerCase().includes(val.toLowerCase()) ||
      i.type.toLowerCase().includes(val.toLowerCase())
    );
    setSearchResults(results);
    setShowResults(true);
  };

  const handleResultClick = (item) => {
    setPage("inventory");
    setTopSearch("");
    setShowResults(false);
  };
  const firebaseUser = auth.currentUser;
  const userName = firebaseUser?.displayName || firebaseUser?.email || "Admin";
  const userInitials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const pages = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "inventory", label: "Inventory", icon: "📦" },
    { id: "category", label: "Med. Category", icon: "🏷️" },
    { id: "type", label: "Med. Type", icon: "💊" },
  ];


  const pageTitles = { dashboard: "Dashboard", inventory: "Inventory", category: "Medicine Categories", type: "Medicine Types", profile: "My Profile" };

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-mark">
              <div className="logo-icon">💊</div>
              <div>
                <div className="logo-text">PharmaRx</div>
                <div className="logo-sub">Management System</div>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section-label">Main Menu</div>
            {pages.map(p => (
              <button key={p.id} className={`nav-item${page === p.id ? " active" : ""}`} onClick={() => setPage(p.id)}>
                <span className="icon">{p.icon}</span>
                <span>{p.label}</span>
                {p.id === "inventory" && lowCount > 0 && <span className="nav-badge">{lowCount}</span>}
              </button>
            ))}

            <div className="nav-section-label" style={{ marginTop: 12 }}>Account</div>
            <button className={`nav-item${page === "profile" ? " active" : ""}`} onClick={() => setPage("profile")}>
              <span className="icon">👤</span><span>Profile</span>
            </button>
            <button className="nav-item" onClick={handleLogout}>
              <span className="icon">🚪</span><span>Logout</span>
            </button>
          </nav>


          <div className="sidebar-footer">
            <div className="sidebar-profile" onClick={() => setPage("profile")}>
              <div className="avatar-sm">{userInitials}</div>
              <div>
                <div className="profile-name">{userName}</div>
                <div className="profile-role">Admin Pharmacist</div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN */}
        <div className="main">
          <div className="topbar">
            <span className="topbar-title">{pageTitles[page]}</span>

            {/* ── SEARCH BAR ── */}
            <div style={{ position: "relative" }}>
              <div className="topbar-search">
                <span>🔍</span>
                <input
                  placeholder="Search medicines, categories..."
                  value={topSearch}
                  onChange={e => handleTopSearch(e.target.value)}
                  onFocus={() => topSearch.length >= 2 && setShowResults(true)}
                  onBlur={() => setTimeout(() => setShowResults(false), 200)}
                />
                {topSearch && (
                  <span
                    onClick={() => { setTopSearch(""); setShowResults(false); }}
                    style={{ cursor: "pointer", color: "#6b7a90", fontSize: 12 }}
                  >
                    ✖
                  </span>
                )}
              </div>

              {/* DROPDOWN RESULTS */}
              {showResults && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                  background: "#fff", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  border: "1px solid #e2e8f0", zIndex: 9999, maxHeight: 300, overflowY: "auto",
                  minWidth: 320,
                }}>
                  {searchResults.length === 0 ? (
                    <div style={{ padding: "16px", textAlign: "center", color: "#6b7a90", fontSize: 13 }}>
                      😕 No medicines found for "{topSearch}"
                    </div>
                  ) : (
                    <>
                      <div style={{ padding: "8px 14px 4px", fontSize: 11, fontWeight: 600, color: "#6b7a90", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {searchResults.length} result{searchResults.length > 1 ? "s" : ""} found
                      </div>
                      {searchResults.map(item => (
                        <div
                          key={item.id}
                          onClick={() => handleResultClick(item)}
                          style={{
                            padding: "10px 14px", cursor: "pointer", display: "flex",
                            alignItems: "center", gap: 10, borderBottom: "1px solid #f0f4f8",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "#f8faff"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <div style={{
                            width: 34, height: 34, borderRadius: 8,
                            background: "#e8f0ff", display: "flex", alignItems: "center",
                            justifyContent: "center", fontSize: 16, flexShrink: 0,
                          }}>
                            💊
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2332" }}>{item.name}</div>
                            <div style={{ fontSize: 11, color: "#6b7a90" }}>
                              {item.category} · {item.type} · Stock: {item.stock}
                            </div>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#1e6fff" }}>₹{item.price}</div>
                          <div>
                            {item.stock < 100
                              ? <span style={{ fontSize: 10, background: "#ffe8e8", color: "#ff4757", padding: "2px 6px", borderRadius: 20, fontWeight: 600 }}>Critical</span>
                              : item.stock < 300
                                ? <span style={{ fontSize: 10, background: "#fff4e6", color: "#e68a00", padding: "2px 6px", borderRadius: 20, fontWeight: 600 }}>Low</span>
                                : <span style={{ fontSize: 10, background: "#e6faf5", color: "#00a67d", padding: "2px 6px", borderRadius: 20, fontWeight: 600 }}>Good</span>
                            }
                          </div>
                        </div>
                      ))}
                      <div
                        onClick={() => { setPage("inventory"); setTopSearch(""); setShowResults(false); }}
                        style={{
                          padding: "10px 14px", textAlign: "center", fontSize: 13,
                          color: "#1e6fff", fontWeight: 600, cursor: "pointer",
                          borderTop: "1px solid #e2e8f0",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f0f7ff"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        View all in Inventory →
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="topbar-actions">
              <button className="icon-btn" title="Notifications">
                🔔
                {lowCount > 0 && <span className="notif-dot" />}
              </button>
              <button className="icon-btn" title="Settings">⚙️</button>
            </div>
          </div>

          {page === "dashboard" && <Dashboard inventory={inventory} setPage={setPage} />}
          {page === "inventory" && <Inventory inventory={inventory} setInventory={setInventory} />}
          {page === "category" && <MedicineCategory inventory={inventory} />}
          {page === "type" && <MedicineType inventory={inventory} />}
          {page === "profile" && <Profile onLogout={handleLogout} />}
        </div>
      </div>
    </>
  );
}