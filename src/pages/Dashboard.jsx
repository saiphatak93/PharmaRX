import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc,
} from "firebase/firestore";

// ─── DATA ─────────────────────────────────────────────────────────────────────
const INITIAL_INVENTORY = [
  { name: "Paracetamol 500mg", category: "Analgesics", type: "Tablet", stock: 1200, price: 2.5, expiry: "2026-08-01", supplier: "MedCorp" },
  { name: "Amoxicillin 250mg", category: "Antibiotics", type: "Capsule", stock: 340, price: 8.0, expiry: "2025-12-15", supplier: "PharmGen" },
  { name: "Omeprazole 20mg", category: "Antacids", type: "Capsule", stock: 580, price: 5.5, expiry: "2026-03-20", supplier: "BioPharm" },
  { name: "Cetirizine 10mg", category: "Antihistamines", type: "Tablet", stock: 900, price: 3.0, expiry: "2027-01-10", supplier: "MedCorp" },
  { name: "Metformin 500mg", category: "Antidiabetics", type: "Tablet", stock: 420, price: 6.0, expiry: "2026-06-30", supplier: "PharmGen" },
  { name: "Atorvastatin 10mg", category: "Statins", type: "Tablet", stock: 150, price: 12.0, expiry: "2025-11-01", supplier: "LifeMed" },
  { name: "Azithromycin 500mg", category: "Antibiotics", type: "Tablet", stock: 80, price: 18.0, expiry: "2025-10-05", supplier: "BioPharm" },
  { name: "Cough Syrup 100ml", category: "Cough & Cold", type: "Syrup", stock: 230, price: 45.0, expiry: "2026-05-15", supplier: "MedCorp" },
  { name: "Vitamin D3 1000IU", category: "Vitamins", type: "Softgel", stock: 600, price: 9.0, expiry: "2027-08-20", supplier: "LifeMed" },
  { name: "Insulin Glargine", category: "Antidiabetics", type: "Injection", stock: 45, price: 350.0, expiry: "2025-09-30", supplier: "PharmGen" },
];

const MEDICINE_CATEGORIES = ["Analgesics", "Antibiotics", "Antacids", "Antihistamines", "Antidiabetics", "Statins", "Cough & Cold", "Vitamins"];
const MEDICINE_TYPES = ["Tablet", "Capsule", "Syrup", "Injection", "Softgel", "Ointment", "Drops", "Powder"];

const CAT_META = {
  Analgesics:     { icon: "💊", color: "#e74c3c", bg: "#fdf0f0" },
  Antibiotics:    { icon: "🧬", color: "#27ae60", bg: "#f0fdf4" },
  Antacids:       { icon: "🫧", color: "#2980b9", bg: "#eff8ff" },
  Antihistamines: { icon: "🌿", color: "#f39c12", bg: "#fffbf0" },
  Antidiabetics:  { icon: "🩺", color: "#8e44ad", bg: "#f9f0ff" },
  Statins:        { icon: "❤️", color: "#e91e63", bg: "#fff0f5" },
  "Cough & Cold": { icon: "🤧", color: "#00acc1", bg: "#f0fdff" },
  Vitamins:       { icon: "✨", color: "#ff6d00", bg: "#fff8f0" },
};
const TYPE_META = {
  Tablet:    { icon: "⬜", color: "#3f51b5", bg: "#eef0ff" },
  Capsule:   { icon: "💊", color: "#009688", bg: "#e8f7f5" },
  Syrup:     { icon: "🍶", color: "#ff9800", bg: "#fff4e6" },
  Injection: { icon: "💉", color: "#f44336", bg: "#fff0f0" },
  Softgel:   { icon: "🔵", color: "#673ab7", bg: "#f3e8ff" },
  Ointment:  { icon: "🧴", color: "#795548", bg: "#f5f0eb" },
  Drops:     { icon: "💧", color: "#03a9f4", bg: "#e8f7ff" },
  Powder:    { icon: "🌫️", color: "#607d8b", bg: "#f0f4f5" },
};

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Nunito:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Prevent horizontal overflow on ALL screens ── */
  html, body { overflow-x: hidden; max-width: 100vw; }
  img, video, iframe, table { max-width: 100%; }

  :root {
    --sidebar-w: 260px;
    --topbar-h: 64px;
    /* Mobile safe area support */
    --safe-bottom: env(safe-area-inset-bottom, 0px);

    /* Core palette */
    --bg:       #f4f6fb;
    --surface:  #ffffff;
    --border:   #e8edf5;
    --border2:  #d0d9ec;

    /* Brand */
    --brand:        #4361ee;
    --brand-light:  #eef0ff;
    --brand-dark:   #2d46c7;
    --brand-glow:   rgba(67,97,238,0.18);

    /* Sidebar */
    --sb-bg:    #0f172a;
    --sb-hover: #1e293b;
    --sb-active:#4361ee;
    --sb-text:  rgba(255,255,255,0.5);
    --sb-text-active: #ffffff;

    /* Status */
    --danger:   #ef4444;
    --warning:  #f59e0b;
    --success:  #10b981;
    --info:     #3b82f6;

    /* Text */
    --text-1: #0f172a;
    --text-2: #475569;
    --text-3: #94a3b8;

    /* Shadows */
    --shadow-sm: 0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04);
    --shadow-md: 0 4px 16px rgba(15,23,42,0.08), 0 2px 6px rgba(15,23,42,0.05);
    --shadow-lg: 0 12px 40px rgba(15,23,42,0.12), 0 4px 12px rgba(15,23,42,0.07);
    --shadow-brand: 0 4px 20px rgba(67,97,238,0.3);

    --radius-sm: 8px;
    --radius:    12px;
    --radius-lg: 16px;
    --radius-xl: 20px;

    --font-head: 'Syne', sans-serif;
    --font-body: 'Nunito', sans-serif;

    --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  html {
    font-size: 14px;
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }
  body {
    font-family: var(--font-body); background: var(--bg); color: var(--text-1);
    line-height: 1.5; -webkit-font-smoothing: antialiased;
    min-width: 0; overflow-x: hidden;
    touch-action: manipulation;
  }

  /* ── Layout ── */
  .rx-app   { display: flex; min-height: 100vh; overflow-x: hidden; width: 100%; }
  .rx-main  { margin-left: var(--sidebar-w); flex: 1; display: flex; flex-direction: column; min-height: 100vh; overflow-x: hidden; min-width: 0; width: 100%; max-width: 100%; }
  .rx-page  { padding: 28px 32px; flex: 1; min-width: 0; width: 100%; box-sizing: border-box; }

  /* ── Sidebar ── */
  .rx-sidebar {
    width: var(--sidebar-w);
    background: var(--sb-bg);
    position: fixed; top: 0; left: 0; height: 100vh;
    display: flex; flex-direction: column;
    z-index: 200;
    box-shadow: 4px 0 32px rgba(0,0,0,0.2);
    overflow: hidden;
  }
  .rx-sidebar::before {
    content: '';
    position: absolute; top: -80px; left: -80px;
    width: 200px; height: 200px;
    background: radial-gradient(circle, rgba(67,97,238,0.25) 0%, transparent 70%);
    pointer-events: none;
  }
  .rx-sidebar-logo {
    padding: 24px 20px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    display: flex; align-items: center; gap: 12px;
    position: relative;
  }
  .rx-logo-icon {
    width: 40px; height: 40px;
    background: linear-gradient(135deg, var(--brand) 0%, #7c3aed 100%);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
    box-shadow: 0 4px 14px rgba(67,97,238,0.4);
    flex-shrink: 0;
  }
  .rx-logo-text { font-family: var(--font-head); color: #fff; font-size: 17px; font-weight: 800; letter-spacing: -0.3px; }
  .rx-logo-sub  { color: rgba(255,255,255,0.35); font-size: 10.5px; font-weight: 500; letter-spacing: 0.5px; margin-top: 1px; }

  .rx-nav { flex: 1; padding: 16px 12px; overflow-y: auto; }
  .rx-nav::-webkit-scrollbar { width: 4px; }
  .rx-nav::-webkit-scrollbar-track { background: transparent; }
  .rx-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

  .rx-nav-label {
    color: rgba(255,255,255,0.25); font-size: 9.5px; font-weight: 700;
    letter-spacing: 2px; text-transform: uppercase;
    padding: 14px 10px 6px;
  }
  .rx-nav-item {
    display: flex; align-items: center; gap: 11px;
    padding: 10px 12px; border-radius: 10px;
    cursor: pointer; transition: var(--transition);
    color: var(--sb-text); font-size: 13.5px; font-weight: 500;
    margin-bottom: 1px; border: none; background: none;
    width: 100%; text-align: left; position: relative;
    font-family: var(--font-body);
  }
  .rx-nav-item:hover  { background: var(--sb-hover); color: rgba(255,255,255,0.85); }
  .rx-nav-item.active { background: var(--sb-active); color: #fff; font-weight: 600; box-shadow: 0 4px 14px rgba(67,97,238,0.4); }
  .rx-nav-item.active::before {
    content: '';
    position: absolute; right: -12px; top: 50%; transform: translateY(-50%);
    width: 4px; height: 20px;
    background: var(--brand); border-radius: 4px 0 0 4px;
  }
  .rx-nav-icon { font-size: 16px; width: 22px; text-align: center; flex-shrink: 0; }
  .rx-nav-badge {
    margin-left: auto; background: var(--danger);
    color: #fff; font-size: 10px; font-weight: 700;
    padding: 2px 7px; border-radius: 99px; line-height: 1.4;
  }

  .rx-sidebar-footer {
    padding: 14px 12px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  .rx-profile-btn {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 10px;
    cursor: pointer; transition: var(--transition);
    border: none; background: rgba(255,255,255,0.04); width: 100%;
    text-align: left;
  }
  .rx-profile-btn:hover { background: var(--sb-hover); }
  .rx-avatar {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, var(--brand) 0%, #7c3aed 100%);
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 13px; font-weight: 700; flex-shrink: 0;
    border: 2px solid rgba(255,255,255,0.15);
  }
  .rx-avatar-lg {
    width: 72px; height: 72px; border-radius: 18px;
    background: linear-gradient(135deg, var(--brand) 0%, #7c3aed 100%);
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 26px; font-weight: 800;
    box-shadow: 0 8px 24px rgba(67,97,238,0.35);
    flex-shrink: 0;
  }
  .rx-pname { color: #fff; font-size: 13px; font-weight: 600; font-family: var(--font-body); }
  .rx-prole { color: rgba(255,255,255,0.38); font-size: 11px; margin-top: 1px; }

  /* ── Topbar ── */
  .rx-topbar {
    height: var(--topbar-h);
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 0 32px;
    display: flex; align-items: center; gap: 16px;
    position: sticky; top: 0; z-index: 100;
    box-shadow: var(--shadow-sm);
  }
  .rx-topbar-title {
    font-family: var(--font-head); font-size: 18px; font-weight: 700;
    color: var(--text-1); flex: 1; letter-spacing: -0.3px;
  }
  .rx-search-wrap { position: relative; }
  .rx-search-box {
    display: flex; align-items: center; gap: 8px;
    background: var(--bg); border: 1.5px solid var(--border);
    border-radius: 10px; padding: 8px 14px;
    width: 280px; transition: var(--transition);
  }
  .rx-search-box:focus-within {
    border-color: var(--brand); background: #fff;
    box-shadow: 0 0 0 3px var(--brand-glow);
  }
  .rx-search-box input {
    border: none; background: none; outline: none;
    font-size: 13px; font-family: var(--font-body); color: var(--text-1); width: 100%;
  }
  .rx-search-box input::placeholder { color: var(--text-3); }
  .rx-search-icon { color: var(--text-3); font-size: 14px; flex-shrink: 0; }
  .rx-search-clear {
    cursor: pointer; color: var(--text-3); font-size: 11px;
    padding: 2px 5px; border-radius: 4px;
    transition: var(--transition); border: none; background: none;
  }
  .rx-search-clear:hover { background: var(--bg); color: var(--text-2); }

  .rx-search-dropdown {
    position: absolute; top: calc(100% + 8px); left: 0;
    width: 360px; background: var(--surface);
    border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
    border: 1px solid var(--border); z-index: 9999;
    max-height: 320px; overflow-y: auto;
    animation: dropDown 0.15s ease;
  }
  @keyframes dropDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
  .rx-search-header { padding: 10px 14px 6px; font-size: 10px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 1px; }
  .rx-search-item {
    padding: 10px 14px; cursor: pointer;
    display: flex; align-items: center; gap: 10px;
    border-bottom: 1px solid var(--border); transition: var(--transition);
  }
  .rx-search-item:last-child { border-bottom: none; }
  .rx-search-item:hover { background: var(--bg); }
  .rx-search-thumb {
    width: 36px; height: 36px; border-radius: 9px;
    background: var(--brand-light);
    display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;
  }
  .rx-search-empty { padding: 24px; text-align: center; color: var(--text-3); font-size: 13px; }
  .rx-search-footer {
    padding: 10px 14px; text-align: center;
    font-size: 12.5px; color: var(--brand); font-weight: 600;
    cursor: pointer; transition: var(--transition);
    border-top: 1px solid var(--border);
  }
  .rx-search-footer:hover { background: var(--brand-light); }

  .rx-topbar-actions { display: flex; align-items: center; gap: 8px; }
  .rx-icon-btn {
    width: 38px; height: 38px; border-radius: 10px;
    border: 1.5px solid var(--border); background: var(--surface);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    font-size: 16px; color: var(--text-2); transition: var(--transition);
    position: relative;
  }
  .rx-icon-btn:hover { background: var(--brand-light); border-color: var(--brand); color: var(--brand); }
  .rx-notif-dot {
    position: absolute; top: 6px; right: 6px;
    width: 7px; height: 7px; background: var(--danger);
    border-radius: 50%; border: 1.5px solid #fff;
  }

  /* ── Cards ── */
  .rx-card {
    background: var(--surface); border-radius: var(--radius-lg);
    border: 1px solid var(--border); box-shadow: var(--shadow-sm);
    overflow: hidden; transition: var(--transition);
    width: 100%; box-sizing: border-box; min-width: 0;
  }
  .rx-card-head {
    padding: 18px 22px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .rx-card-title {
    font-family: var(--font-head); font-size: 14.5px; font-weight: 700; color: var(--text-1);
    display: flex; align-items: center; gap: 8px;
  }
  .rx-card-body { padding: 22px; }

  /* ── Stat cards ── */
  .rx-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 18px; margin-bottom: 26px; }
  .rx-stat {
    background: var(--surface); border-radius: var(--radius-lg);
    padding: 22px; border: 1px solid var(--border);
    box-shadow: var(--shadow-sm); position: relative; overflow: hidden;
    transition: var(--transition); cursor: default;
  }
  .rx-stat:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
  .rx-stat::after {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
  }
  .rx-stat.blue::after   { background: linear-gradient(90deg, var(--brand), #7c3aed); }
  .rx-stat.green::after  { background: linear-gradient(90deg, var(--success), #34d399); }
  .rx-stat.orange::after { background: linear-gradient(90deg, var(--warning), #fb923c); }
  .rx-stat.red::after    { background: linear-gradient(90deg, var(--danger), #f97316); }

  .rx-stat-top  { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
  .rx-stat-icon {
    width: 46px; height: 46px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; font-size: 22px;
  }
  .rx-stat-icon.blue   { background: #eef0ff; }
  .rx-stat-icon.green  { background: #ecfdf5; }
  .rx-stat-icon.orange { background: #fffbeb; }
  .rx-stat-icon.red    { background: #fef2f2; }

  .rx-stat-badge {
    font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 99px;
  }
  .rx-stat-badge.up   { background: #ecfdf5; color: #059669; }
  .rx-stat-badge.down { background: #fef2f2; color: var(--danger); }
  .rx-stat-badge.warn { background: #fffbeb; color: #d97706; }

  .rx-stat-val   { font-family: var(--font-head); font-size: 30px; font-weight: 800; color: var(--text-1); line-height: 1; }
  .rx-stat-label { color: var(--text-2); font-size: 13px; margin-top: 6px; font-weight: 500; }

  /* ── Badges ── */
  .rx-badge {
    display: inline-flex; align-items: center; padding: 3px 10px;
    border-radius: 99px; font-size: 11px; font-weight: 700; white-space: nowrap;
  }
  .rx-badge.success { background: #ecfdf5; color: #059669; }
  .rx-badge.danger  { background: #fef2f2; color: var(--danger); }
  .rx-badge.warning { background: #fffbeb; color: #d97706; }
  .rx-badge.info    { background: var(--brand-light); color: var(--brand); }
  .rx-badge.neutral { background: var(--bg); color: var(--text-2); }

  /* ── Tags ── */
  .rx-tag {
    display: inline-block; padding: 2px 9px; border-radius: 6px;
    font-size: 11px; font-weight: 600;
    background: var(--brand-light); color: var(--brand);
  }

  /* ── Buttons ── */
  .rx-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 18px; border-radius: var(--radius-sm);
    font-size: 13px; font-weight: 600; cursor: pointer;
    border: none; font-family: var(--font-body); transition: var(--transition);
    white-space: nowrap;
  }
  .rx-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .rx-btn.primary { background: var(--brand); color: #fff; box-shadow: 0 2px 8px rgba(67,97,238,0.3); }
  .rx-btn.primary:hover:not(:disabled) { background: var(--brand-dark); box-shadow: var(--shadow-brand); }
  .rx-btn.outline { background: transparent; border: 1.5px solid var(--border); color: var(--text-1); }
  .rx-btn.outline:hover:not(:disabled) { border-color: var(--brand); color: var(--brand); background: var(--brand-light); }
  .rx-btn.danger-btn { background: var(--danger); color: #fff; }
  .rx-btn.danger-btn:hover:not(:disabled) { background: #dc2626; box-shadow: 0 2px 8px rgba(239,68,68,0.3); }
  .rx-btn.sm { padding: 6px 12px; font-size: 12px; border-radius: 7px; }
  .rx-btn.ghost { background: transparent; border: none; color: var(--text-2); padding: 7px 10px; }
  .rx-btn.ghost:hover { background: var(--bg); color: var(--text-1); }

  .rx-btn-icon {
    width: 34px; height: 34px; border-radius: 8px;
    border: 1.5px solid var(--border); background: var(--surface);
    cursor: pointer; font-size: 14px; color: var(--text-2);
    display: inline-flex; align-items: center; justify-content: center;
    transition: var(--transition);
  }
  .rx-btn-icon:hover { border-color: var(--brand); color: var(--brand); background: var(--brand-light); }
  .rx-btn-icon.danger:hover { border-color: var(--danger); color: var(--danger); background: #fef2f2; }

  /* ── Table ── */
  .rx-table-wrap { overflow-x: auto; width: 100%; max-width: 100%; -webkit-overflow-scrolling: touch; }
  .rx-table { width: 100%; border-collapse: collapse; }
  .rx-table th {
    text-align: left; padding: 10px 16px; font-size: 11px; font-weight: 700;
    color: var(--text-3); text-transform: uppercase; letter-spacing: 0.8px;
    border-bottom: 1px solid var(--border); background: var(--bg); white-space: nowrap;
  }
  .rx-table td {
    padding: 13px 16px; font-size: 13.5px; border-bottom: 1px solid var(--border);
    vertical-align: middle;
  }
  .rx-table tbody tr:last-child td { border-bottom: none; }
  .rx-table tbody tr { transition: var(--transition); }
  .rx-table tbody tr:hover td { background: #f8faff; }

  /* ── Progress ── */
  .rx-progress { background: var(--border); border-radius: 99px; overflow: hidden; }
  .rx-progress-bar { height: 100%; border-radius: 99px; transition: width 0.5s ease; }

  /* ── Alert ── */
  .rx-alert {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; border-radius: var(--radius);
    font-size: 13px; font-weight: 500; margin-bottom: 22px;
  }
  .rx-alert.warning { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }

  /* ── Grid ── */
  .rx-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }
  .rx-grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 18px; }
  .rx-grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }

  /* ── Filters bar ── */
  .rx-filters {
    display: flex; gap: 10px; align-items: center;
    margin-bottom: 20px; flex-wrap: wrap;
  }
  .rx-input {
    padding: 9px 13px; border: 1.5px solid var(--border); border-radius: var(--radius-sm);
    font-size: 13px; font-family: var(--font-body); color: var(--text-1);
    background: var(--surface); outline: none; transition: var(--transition);
  }
  .rx-input:focus { border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-glow); }
  .rx-input::placeholder { color: var(--text-3); }
  .rx-select {
    padding: 9px 13px; border: 1.5px solid var(--border); border-radius: var(--radius-sm);
    font-size: 13px; font-family: var(--font-body); color: var(--text-1);
    background: var(--surface); outline: none; cursor: pointer; transition: var(--transition);
  }
  .rx-select:focus { border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-glow); }

  /* ── Modal ── */
  .rx-modal-overlay {
    position: fixed; inset: 0; background: rgba(15,23,42,0.55);
    z-index: 99999; display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(4px);
    animation: fadeIn 0.15s ease;
  }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  .rx-modal {
    background: var(--surface); border-radius: var(--radius-xl);
    width: 560px; max-width: 95vw; max-height: 90vh;
    overflow-y: auto; box-shadow: var(--shadow-lg);
    border: 1px solid var(--border);
    animation: slideUp 0.2s ease;
  }
  @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  .rx-modal-head {
    padding: 22px 26px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; background: var(--surface); z-index: 1;
  }
  .rx-modal-title { font-family: var(--font-head); font-size: 16px; font-weight: 700; color: var(--text-1); }
  .rx-modal-close {
    width: 30px; height: 30px; border-radius: 8px;
    border: 1.5px solid var(--border); background: none; cursor: pointer;
    font-size: 16px; color: var(--text-2); display: flex;
    align-items: center; justify-content: center; transition: var(--transition);
  }
  .rx-modal-close:hover { background: #fef2f2; border-color: var(--danger); color: var(--danger); }
  .rx-modal-body { padding: 24px 26px; }
  .rx-modal-foot {
    padding: 16px 26px; border-top: 1px solid var(--border);
    display: flex; justify-content: flex-end; gap: 10px;
    background: var(--bg); border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  }

  /* ── Form ── */
  .rx-form-row   { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .rx-form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
  .rx-form-group { margin-bottom: 16px; }
  .rx-form-label {
    display: block; font-size: 11px; font-weight: 700; color: var(--text-3);
    margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.6px;
  }
  .rx-form-control {
    width: 100%; padding: 10px 13px; border: 1.5px solid var(--border);
    border-radius: var(--radius-sm); font-size: 13.5px; font-family: var(--font-body);
    color: var(--text-1); background: #fff; outline: none; transition: var(--transition);
    box-sizing: border-box; display: block;
  }
  .rx-form-control:focus { border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-glow); }

  /* ── Category Cards ── */
  .rx-cat-card {
    background: var(--surface); border: 1.5px solid var(--border);
    border-radius: var(--radius-lg); padding: 22px 18px; text-align: center;
    cursor: pointer; transition: var(--transition); position: relative; overflow: hidden;
  }
  .rx-cat-card:hover { border-color: var(--brand); box-shadow: 0 6px 24px rgba(67,97,238,0.1); transform: translateY(-3px); }
  .rx-cat-card.selected { border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-glow); }
  .rx-cat-icon { font-size: 30px; margin-bottom: 10px; line-height: 1; }
  .rx-cat-name { font-weight: 700; font-size: 13.5px; color: var(--text-1); margin-bottom: 4px; font-family: var(--font-head); }
  .rx-cat-count { color: var(--text-3); font-size: 12px; }

  /* ── Type Cards ── */
  .rx-type-card {
    background: var(--surface); border: 1.5px solid var(--border);
    border-radius: var(--radius-lg); padding: 18px;
    cursor: pointer; transition: var(--transition);
    display: flex; align-items: center; gap: 14px;
  }
  .rx-type-card:hover { border-color: var(--brand); box-shadow: 0 4px 16px rgba(67,97,238,0.1); }
  .rx-type-card.selected { border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-glow); }
  .rx-type-dot {
    width: 44px; height: 44px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; flex-shrink: 0;
  }

  /* ── Profile header ── */
  .rx-profile-header {
    background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1e1b4b 100%);
    border-radius: var(--radius-xl); padding: 32px;
    color: #fff; margin-bottom: 24px;
    display: flex; align-items: center; gap: 22px;
    position: relative; overflow: hidden;
    box-shadow: var(--shadow-lg);
  }
  .rx-profile-header::before {
    content: '';
    position: absolute; top: -60px; right: -60px;
    width: 220px; height: 220px;
    background: radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%);
    pointer-events: none;
  }
  .rx-profile-header::after {
    content: '';
    position: absolute; bottom: -40px; left: 40%;
    width: 160px; height: 160px;
    background: radial-gradient(circle, rgba(67,97,238,0.2) 0%, transparent 70%);
    pointer-events: none;
  }

  /* ── Sale items ── */
  .rx-sale-item {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 0; border-bottom: 1px solid var(--border);
  }
  .rx-sale-item:last-child { border-bottom: none; }
  .rx-sale-icon {
    width: 38px; height: 38px; background: var(--brand-light);
    border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0;
  }

  /* ── Empty state ── */
  .rx-empty { text-align: center; padding: 48px 24px; color: var(--text-3); }
  .rx-empty-icon { font-size: 44px; margin-bottom: 12px; opacity: 0.6; }
  .rx-empty-title { font-size: 15px; font-weight: 600; color: var(--text-2); margin-bottom: 4px; }
  .rx-empty-sub { font-size: 13px; }

  /* ── Info rows (profile) ── */
  .rx-info-row {
    display: flex; padding: 12px 0; border-bottom: 1px solid var(--border);
    align-items: flex-start; gap: 8px;
  }
  .rx-info-row:last-child { border-bottom: none; }
  .rx-info-label { color: var(--text-3); font-size: 12.5px; width: 130px; flex-shrink: 0; font-weight: 600; }
  .rx-info-val { color: var(--text-1); font-size: 13.5px; font-weight: 500; }

  /* ── Divider ── */
  .rx-divider { height: 1px; background: var(--border); margin: 4px 0; }

  /* ── Loading ── */
  .rx-loading {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: var(--bg); flex-direction: column; gap: 16px;
    font-family: var(--font-body);
  }
  .rx-loading-icon { font-size: 52px; animation: pulse 1.5s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{transform:scale(1);opacity:1;} 50%{transform:scale(0.92);opacity:0.7;} }
  .rx-loading-text { font-size: 15px; color: var(--text-2); font-weight: 600; }
  .rx-loading-sub  { font-size: 12.5px; color: var(--text-3); }

  /* ── Mobile nav ── */
  .rx-mobile-nav { display: none; }

  /* ══════════════════════════════════════════
     RESPONSIVE — Tablet, Mobile, Small screens
     ══════════════════════════════════════════ */

  /* ── Tablet (≤ 1024px) ── */
  @media (max-width: 1024px) {
    :root { --sidebar-w: 220px; }
    .rx-stats { grid-template-columns: repeat(2,1fr); gap: 14px; }
    .rx-grid-4 { grid-template-columns: repeat(2,1fr); gap: 14px; }
    .rx-page   { padding: 20px 22px; }
  }

  /* ── Tablet / Large Mobile (≤ 768px) ── */
  @media (max-width: 768px) {
    :root { --sidebar-w: 0px; }

    /* Sidebar hidden — bottom nav takes over */
    .rx-sidebar { display: none; }
    .rx-main    { margin-left: 0; padding-bottom: 76px; }

    /* Topbar */
    .rx-topbar       { padding: 0 14px; gap: 10px; height: 56px; }
    .rx-topbar-title { font-size: 15px; }
    .rx-search-box   { width: 150px; padding: 7px 12px; }

    /* Page */
    .rx-page { padding: 14px 14px; }

    /* Stats — 2 columns */
    .rx-stats    { grid-template-columns: repeat(2,1fr); gap: 10px; margin-bottom: 16px; }
    .rx-stat     { padding: 16px; }
    .rx-stat-val { font-size: 24px; }
    .rx-stat-icon{ width: 38px; height: 38px; font-size: 18px; }

    /* Grids — single column */
    .rx-grid-2 { grid-template-columns: 1fr; gap: 14px; }
    .rx-grid-3 { grid-template-columns: repeat(2,1fr); gap: 12px; }
    .rx-grid-4 { grid-template-columns: repeat(2,1fr); gap: 10px; }

    /* Cards */
    .rx-card-head  { padding: 14px 16px; flex-wrap: wrap; gap: 8px; }
    .rx-card-body  { padding: 16px; }
    .rx-card-title { font-size: 13.5px; }

    /* Filters bar — wrap and stack */
    .rx-filters { gap: 8px; flex-wrap: wrap; }
    .rx-filters .rx-input  { flex: 1; min-width: 0; max-width: 100% !important; }
    .rx-filters .rx-select { flex: 1; min-width: 120px; }
    .rx-filters > div:last-child { width: 100%; display: flex; gap: 8px; flex-wrap: wrap; }
    .rx-filters > div:last-child .rx-btn { flex: 1; justify-content: center; min-width: 100px; }

    /* Tables — horizontal scroll */
    .rx-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .rx-table      { min-width: 600px; }
    .rx-table th, .rx-table td { padding: 10px 12px; font-size: 12.5px; }

    /* Modals — full width on mobile */
    .rx-modal { width: 96vw; max-width: 96vw; border-radius: 14px; }
    .rx-modal-head { padding: 16px 18px; }
    .rx-modal-body { padding: 16px 18px; }
    .rx-modal-foot { padding: 12px 18px; }
    .rx-form-row   { grid-template-columns: 1fr; gap: 0; }
    .rx-form-row-3 { grid-template-columns: 1fr; gap: 0; }

    /* Badges — smaller */
    .rx-badge { font-size: 10px; padding: 2px 8px; }

    /* Profile */
    .rx-profile-header { flex-direction: column; text-align: center; padding: 20px 16px; gap: 14px; }
    .rx-profile-header > button { width: 100% !important; justify-content: center; margin-left: 0 !important; }
    .rx-avatar-lg { width: 60px; height: 60px; font-size: 22px; }
    .rx-info-label { width: 100px; }

    /* Category & Type grids */
    .rx-cat-card  { padding: 16px 12px; }
    .rx-cat-icon  { font-size: 24px; }
    .rx-cat-name  { font-size: 12.5px; }
    .rx-type-card { padding: 14px; }

    /* Daily Report banner */
    .rx-report-header { flex-direction: column; gap: 14px; align-items: flex-start; padding: 18px 16px; }
    .rx-report-header > div:last-child { width: 100%; flex-direction: row !important; align-items: center; }
    .rx-report-header input[type=date] { flex: 1; }
    .rx-report-date-pill { font-size: 11px; padding: 4px 10px; }

    /* Daily Report entry form */
    .rx-sale-form { padding: 14px; }
    .rx-entry-form-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
    .rx-entry-form-grid > div:last-child { grid-column: 1 / -1; }
    .rx-entry-form-grid > div:last-child button { width: 100%; height: 42px !important; }

    /* Action bar in Daily Report */
    .rx-action-bar { flex-wrap: wrap; }
    .rx-action-bar > button { flex: 1; justify-content: center; min-width: 140px; }
    .rx-action-bar > div:last-child { width: 100%; justify-content: center; }

    /* Net summary cards */
    .rx-net-summary-grid { grid-template-columns: 1fr !important; gap: 10px !important; }

    /* Bottom mobile navigation */
    .rx-mobile-nav {
      display: flex !important;
      position: fixed; bottom: 0; left: 0; right: 0; width: 100%;
      background: var(--sb-bg);
      border-top: 1px solid rgba(255,255,255,0.08);
      z-index: 9999;
      padding: 5px 0 env(safe-area-inset-bottom, 6px);
      justify-content: space-around; align-items: center;
      box-shadow: 0 -4px 24px rgba(0,0,0,0.25);
    }
    .rx-mn-item {
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      cursor: pointer; padding: 5px 8px; border-radius: 10px;
      color: rgba(255,255,255,0.4); font-size: 9.5px; font-weight: 600;
      border: none; background: none; transition: var(--transition);
      font-family: var(--font-body); min-width: 48px; flex: 1;
    }
    .rx-mn-item.active { color: var(--brand); background: rgba(67,97,238,0.14); }
    .rx-mn-icon  { font-size: 20px; line-height: 1; }
    .rx-mn-badge {
      position: absolute; top: -3px; right: -5px;
      background: var(--danger); color: #fff; font-size: 8px; font-weight: 700;
      padding: 1px 4px; border-radius: 99px; border: 1.5px solid var(--sb-bg);
    }
    .rx-mn-wrap { position: relative; display: inline-flex; }
  }

  /* ── Small Mobile (≤ 480px) ── */
  @media (max-width: 480px) {
    html { font-size: 13px; }
    /* Hide search bar — use inventory search instead */
    .rx-search-box { display: none; }

    .rx-page     { padding: 10px; }
    .rx-topbar   { padding: 0 10px; height: 52px; }
    .rx-topbar-title { font-size: 14px; }

    /* Stats */
    .rx-stats    { grid-template-columns: repeat(2,1fr); gap: 8px; margin-bottom: 12px; }
    .rx-stat     { padding: 12px; }
    .rx-stat-val { font-size: 20px; }
    .rx-stat-label { font-size: 11px; }
    .rx-stat::after { height: 2px; }

    /* Grids */
    .rx-grid-3 { grid-template-columns: 1fr; }
    .rx-grid-4 { grid-template-columns: repeat(2,1fr); gap: 8px; }

    /* Cards */
    .rx-card-head  { padding: 12px 14px; }
    .rx-card-body  { padding: 14px; }
    .rx-card-title { font-size: 13px; }

    /* Table — tighter */
    .rx-table      { min-width: 520px; }
    .rx-table th, .rx-table td { padding: 8px 10px; font-size: 12px; }

    /* Buttons */
    .rx-btn { padding: 8px 14px; font-size: 12.5px; }
    .rx-btn.sm { padding: 5px 10px; font-size: 11.5px; }

    /* Report header pills — stack vertically */
    .rx-report-header h2 { font-size: 18px; }
    .rx-report-header > div:first-child > div:last-child { flex-direction: column; align-items: flex-start; gap: 6px; }
    .rx-report-date-pill { font-size: 10.5px; }

    /* Daily Report banner actions */
    .rx-report-header > div:last-child { flex-direction: column !important; gap: 8px; }
    .rx-report-header > div:last-child input[type=date],
    .rx-report-header > div:last-child button { width: 100%; }

    /* Entry form - single column on small mobile */
    .rx-entry-form-grid { grid-template-columns: 1fr !important; }

    /* Form */
    .rx-form-group { margin-bottom: 12px; }
    .rx-form-control { padding: 9px 11px; font-size: 13px; }
    .rx-form-label { font-size: 10px; }

    /* Profile */
    .rx-info-row { flex-direction: column; gap: 2px; }
    .rx-info-label { width: 100%; }

    /* Category cards */
    .rx-cat-card { padding: 14px 10px; }
    .rx-cat-name { font-size: 12px; }
    .rx-cat-count { font-size: 11px; }

    /* Alert bar */
    .rx-alert { padding: 10px 12px; font-size: 12px; }

    /* Modal */
    .rx-modal { width: 100vw; max-width: 100vw; border-radius: 14px 14px 0 0; margin-top: auto; }
    .rx-modal-overlay { align-items: flex-end; }

    /* Topbar icons */
    .rx-icon-btn { width: 34px; height: 34px; font-size: 14px; }
  }

  /* ── Very small (≤ 360px) — older Android phones ── */
  @media (max-width: 360px) {
    .rx-stats    { gap: 6px; }
    .rx-stat-val { font-size: 18px; }
    .rx-grid-4   { grid-template-columns: 1fr 1fr; gap: 6px; }
    .rx-page     { padding: 8px; }
    .rx-mn-item  { min-width: 40px; padding: 4px 4px; font-size: 8.5px; }
    .rx-mn-icon  { font-size: 18px; }
    .rx-table    { min-width: 480px; }
    .rx-card-head { flex-direction: column; align-items: flex-start; gap: 6px; }
  }

  /* ── Daily Report ── */
  .rx-report-header {
    background: linear-gradient(135deg, #0f172a 0%, #1a3a5c 50%, #0f2d4a 100%);
    border-radius: var(--radius-xl); padding: 28px 32px;
    color: #fff; margin-bottom: 24px;
    display: flex; align-items: center; justify-content: space-between;
    position: relative; overflow: hidden; box-shadow: var(--shadow-lg);
  }
  .rx-report-header::before {
    content:''; position:absolute; top:-60px; right:-40px;
    width:220px; height:220px;
    background: radial-gradient(circle, rgba(67,97,238,0.3) 0%, transparent 70%);
    pointer-events:none;
  }
  .rx-report-header::after {
    content:''; position:absolute; bottom:-50px; left:30%;
    width:180px; height:180px;
    background: radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%);
    pointer-events:none;
  }
  .rx-report-date-pill {
    background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
    color:#fff; padding: 6px 14px; border-radius: 99px;
    font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;
  }
  .rx-tabs {
    display: flex; gap: 4px; background: var(--bg);
    border-radius: 10px; padding: 4px; margin-bottom: 22px;
    border: 1px solid var(--border);
  }
  .rx-tab {
    flex: 1; padding: 8px 14px; border-radius: 8px;
    font-size: 13px; font-weight: 600; cursor: pointer;
    border: none; background: none; font-family: var(--font-body);
    color: var(--text-2); transition: var(--transition); text-align: center;
  }
  .rx-tab.active { background: var(--surface); color: var(--brand); box-shadow: var(--shadow-sm); }
  .rx-tab:hover:not(.active) { color: var(--text-1); }

  .rx-log-item {
    display: flex; align-items: center; gap: 14px;
    padding: 13px 0; border-bottom: 1px solid var(--border);
    transition: var(--transition);
  }
  .rx-log-item:last-child { border-bottom: none; }
  .rx-log-icon {
    width: 40px; height: 40px; border-radius: 11px;
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; flex-shrink: 0;
  }
  .rx-log-icon.add    { background: #ecfdf5; }
  .rx-log-icon.edit   { background: #eef0ff; }
  .rx-log-icon.delete { background: #fef2f2; }
  .rx-log-icon.sale   { background: #fff8f0; }
  .rx-log-time {
    font-size: 11px; color: var(--text-3); font-weight: 600;
    white-space: nowrap; margin-left: auto; padding-left: 12px;
  }

  .rx-sale-form {
    background: var(--bg); border-radius: var(--radius);
    padding: 18px; border: 1.5px solid var(--border);
    margin-bottom: 18px;
  }
  .rx-sale-form-row { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 10px; align-items: end; }

  .rx-summary-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 11px 0; border-bottom: 1px solid var(--border);
    font-size: 13.5px;
  }
  .rx-summary-row:last-child { border-bottom: none; }
  .rx-summary-key   { color: var(--text-2); font-weight: 500; display: flex; align-items: center; gap: 8px; }
  .rx-summary-val   { font-weight: 800; color: var(--text-1); font-family: var(--font-head); }
  .rx-summary-val.green  { color: var(--success); }
  .rx-summary-val.red    { color: var(--danger); }
  .rx-summary-val.orange { color: var(--warning); }
  .rx-summary-val.blue   { color: var(--brand); }

  @media (max-width: 768px) {
    .rx-report-header { flex-direction: column; gap: 14px; align-items: flex-start; padding: 20px; }
    .rx-sale-form-row { grid-template-columns: 1fr 1fr; gap: 8px; }
  }
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function StockBar({ stock }) {
  const pct = Math.min(100, (stock / 1200) * 100);
  const color = stock < 100 ? "var(--danger)" : stock < 300 ? "var(--warning)" : "var(--success)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 100 }}>
      <div className="rx-progress" style={{ height: 6, flex: 1 }}>
        <div className="rx-progress-bar" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span style={{ fontSize: 12, color, fontWeight: 700, minWidth: 34 }}>{stock}</span>
    </div>
  );
}

function StatusBadge({ stock }) {
  if (stock < 100) return <span className="rx-badge danger">Critical</span>;
  if (stock < 300) return <span className="rx-badge warning">Low</span>;
  return <span className="rx-badge success">In Stock</span>;
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, footer }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return createPortal(
    <div className="rx-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="rx-modal">
        <div className="rx-modal-head">
          <span className="rx-modal-title">{title}</span>
          <button className="rx-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="rx-modal-body">{children}</div>
        {footer && <div className="rx-modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return createPortal(
    <div className="rx-modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="rx-modal" style={{ width: 380 }}>
        <div className="rx-modal-head">
          <span className="rx-modal-title">⚠️ Confirm Delete</span>
          <button className="rx-modal-close" onClick={onCancel}>✕</button>
        </div>
        <div className="rx-modal-body">
          <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="rx-modal-foot">
          <button className="rx-btn outline" onClick={onCancel}>Cancel</button>
          <button className="rx-btn danger-btn" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ inventory, setPage }) {
  const lowStock     = inventory.filter(i => i.stock < 150).length;
  const critical     = inventory.filter(i => i.stock < 100).length;
  const expiringSoon = inventory.filter(i => new Date(i.expiry) < new Date(Date.now() + 90*86400000)).length;
  const totalValue   = inventory.reduce((s, i) => s + i.stock * i.price, 0);

  const recentSales = [
    { med: "Paracetamol 500mg", qty: 24, amt: 60,  time: "10 min ago" },
    { med: "Amoxicillin 250mg", qty: 8,  amt: 64,  time: "32 min ago" },
    { med: "Vitamin D3 1000IU", qty: 15, amt: 135, time: "1 hr ago" },
    { med: "Omeprazole 20mg",   qty: 12, amt: 66,  time: "2 hrs ago" },
    { med: "Cetirizine 10mg",   qty: 20, amt: 60,  time: "3 hrs ago" },
  ];

  const alerts = inventory.filter(i =>
    i.stock < 200 || new Date(i.expiry) < new Date(Date.now() + 90*86400000)
  ).slice(0, 7);

  return (
    <div className="rx-page">
      {lowStock > 0 && (
        <div className="rx-alert warning">
          <span style={{ fontSize: 18 }}>⚠️</span>
          <span><strong>{lowStock} medicines</strong> are running low on stock — {critical > 0 ? `${critical} critical!` : "please restock soon."}</span>
        </div>
      )}

      {/* Stats */}
      <div className="rx-stats">
        <div className="rx-stat blue">
          <div className="rx-stat-top">
            <div className="rx-stat-icon blue">💊</div>
            <span className="rx-stat-badge up">↑ 2.4%</span>
          </div>
          <div className="rx-stat-val">{inventory.length}</div>
          <div className="rx-stat-label">Total Medicines</div>
        </div>
        <div className="rx-stat green">
          <div className="rx-stat-top">
            <div className="rx-stat-icon green">💰</div>
            <span className="rx-stat-badge up">↑ 8.1%</span>
          </div>
          <div className="rx-stat-val">₹{(totalValue / 1000).toFixed(1)}K</div>
          <div className="rx-stat-label">Inventory Value</div>
        </div>
        <div className="rx-stat orange">
          <div className="rx-stat-top">
            <div className="rx-stat-icon orange">⚠️</div>
            <span className="rx-stat-badge warn">Needs Action</span>
          </div>
          <div className="rx-stat-val" style={{ color: lowStock > 0 ? "var(--danger)" : "inherit" }}>{lowStock}</div>
          <div className="rx-stat-label">Low Stock Alerts</div>
        </div>
        <div className="rx-stat red">
          <div className="rx-stat-top">
            <div className="rx-stat-icon red">📅</div>
            <span className="rx-stat-badge down">Check Soon</span>
          </div>
          <div className="rx-stat-val" style={{ color: expiringSoon > 0 ? "var(--warning)" : "inherit" }}>{expiringSoon}</div>
          <div className="rx-stat-label">Expiring in 90 Days</div>
        </div>
      </div>

      {/* Charts + Recent Sales */}
      <div className="rx-grid-2" style={{ marginBottom: 22 }}>
        <div className="rx-card">
          <div className="rx-card-head">
            <span className="rx-card-title">📊 Stock by Category</span>
          </div>
          <div className="rx-card-body">
            {MEDICINE_CATEGORIES.slice(0, 6).map(cat => {
              const total = inventory.filter(i => i.category === cat).reduce((s,i) => s+i.stock, 0);
              const pct = Math.min(100, (total / 2000) * 100);
              const meta = CAT_META[cat] || { color: "var(--brand)", icon: "💊" };
              return (
                <div key={cat} style={{ marginBottom: 14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:5 }}>
                    <span style={{ fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
                      <span>{meta.icon}</span> {cat}
                    </span>
                    <span style={{ color:"var(--text-3)", fontSize:12, fontWeight:600 }}>{total.toLocaleString()} units</span>
                  </div>
                  <div className="rx-progress" style={{ height: 8 }}>
                    <div className="rx-progress-bar" style={{ width:`${pct}%`, background: meta.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rx-card">
          <div className="rx-card-head">
            <span className="rx-card-title">🛒 Recent Sales</span>
            <button className="rx-btn outline sm" onClick={() => setPage("inventory")}>View All →</button>
          </div>
          <div style={{ padding: "8px 22px 16px" }}>
            {recentSales.map((s, i) => (
              <div className="rx-sale-item" key={i}>
                <div className="rx-sale-icon">💊</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"var(--text-1)" }}>{s.med}</div>
                  <div style={{ fontSize:12, color:"var(--text-3)", marginTop:2 }}>Qty: {s.qty} · {s.time}</div>
                </div>
                <div style={{ fontWeight:800, color:"var(--success)", fontSize:13 }}>+₹{s.amt}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="rx-card">
        <div className="rx-card-head">
          <span className="rx-card-title">🚨 Stock & Expiry Alerts</span>
          <span className="rx-badge danger">{lowStock + expiringSoon} Alerts</span>
        </div>
        <div className="rx-table-wrap">
          <table className="rx-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Category</th>
                <th>Stock Level</th>
                <th>Expiry Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 ? (
                <tr><td colSpan={5}>
                  <div className="rx-empty">
                    <div className="rx-empty-icon">✅</div>
                    <div className="rx-empty-title">All Clear!</div>
                    <div className="rx-empty-sub">No stock or expiry alerts.</div>
                  </div>
                </td></tr>
              ) : alerts.map(item => {
                const daysLeft = Math.ceil((new Date(item.expiry) - Date.now()) / 86400000);
                return (
                  <tr key={item.id}>
                    <td><strong style={{ color:"var(--text-1)" }}>{item.name}</strong></td>
                    <td>
                      <span style={{ display:"inline-flex", alignItems:"center", gap:5 }}>
                        <span>{CAT_META[item.category]?.icon}</span>
                        <span className="rx-tag">{item.category}</span>
                      </span>
                    </td>
                    <td><StockBar stock={item.stock} /></td>
                    <td>
                      <span style={{ fontSize:12.5, color: daysLeft < 30 ? "var(--danger)" : daysLeft < 90 ? "var(--warning)" : "var(--text-2)", fontWeight:600 }}>
                        {item.expiry} {daysLeft < 60 ? "⚠️" : ""}
                      </span>
                    </td>
                    <td>
                      {item.stock < 100
                        ? <span className="rx-badge danger">Critical</span>
                        : item.stock < 200
                        ? <span className="rx-badge warning">Low Stock</span>
                        : daysLeft < 30
                        ? <span className="rx-badge danger">Expiring Soon</span>
                        : <span className="rx-badge warning">Monitor</span>}
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

// ─── INVENTORY ────────────────────────────────────────────────────────────────
const EMPTY_FORM = { name:"", category:"", type:"", stock:"", price:"", expiry:"", supplier:"" };

function Inventory({ inventory, setInventory }) {
  const [search,    setSearch]    = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterType,setFilterType]= useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem,  setEditItem]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [deleteId,  setDeleteId]  = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);

  const filtered = inventory.filter(i =>
    (i.name.toLowerCase().includes(search.toLowerCase()) ||
     (i.supplier || "").toLowerCase().includes(search.toLowerCase())) &&
    (!filterCat  || i.category === filterCat) &&
    (!filterType || i.type     === filterType)
  );

  const openAdd  = () => { setEditItem(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = item => { setEditItem(item); setForm({ ...item, stock: String(item.stock), price: String(item.price) }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditItem(null); setLoading(false); setForm(EMPTY_FORM); };

  const handleDelete = async () => {
    try {
      const item = inventory.find(i => i.id === deleteId);
      await deleteDoc(doc(db, "inventory", deleteId));
      setInventory(prev => prev.filter(i => i.id !== deleteId));
      if (item) logActivity("delete", item.name, `Deleted from inventory`);
    } catch (err) { alert("Error deleting: " + err.message); }
    setDeleteId(null);
  };

  const handleSave = async () => {
    if (!form.name || !form.category || !form.type || !form.stock || !form.price || !form.expiry)
      return alert("Please fill all required fields.");

    const data = { ...form, stock: +form.stock, price: +form.price, updatedAt: new Date().toISOString() };

    // ── STEP 1: Update UI immediately — never blocks on Firestore ──
    if (editItem) {
      setInventory(prev => prev.map(i => i.id === editItem.id ? { ...data, id: editItem.id } : i));
    } else {
      // Use a temp id so the row appears instantly
      const tempId = "temp_" + Date.now();
      setInventory(prev => [...prev, { ...data, id: tempId }]);
    }
    setShowModal(false);
    setEditItem(null);
    setForm(EMPTY_FORM);
    setLoading(false);

    // ── STEP 2: Sync to Firestore in background (non-blocking) ──
    const showToast = (msg, color = "#ef4444") => {
      const t = document.createElement("div");
      t.textContent = msg;
      Object.assign(t.style, {
        position:"fixed", bottom:"90px", left:"50%", transform:"translateX(-50%)",
        background:"#1e293b", color:"#fff", padding:"10px 20px", borderRadius:"10px",
        fontSize:"13px", fontFamily:"Nunito,sans-serif", zIndex:"999999",
        boxShadow:"0 4px 20px rgba(0,0,0,0.3)", maxWidth:"90vw", textAlign:"center",
      });
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 5000);
    };

    if (editItem) {
      updateDoc(doc(db, "inventory", editItem.id), data).catch(err => {
        console.error("Firestore update error:", err.code, err.message);
        showToast("\u26a0\ufe0f Sync failed: " + (err.code || err.message) + ". Check Firestore rules.");
      });
    } else {
      addDoc(collection(db, "inventory"), data)
        .then(ref => {
          // Replace the temp entry with the real Firestore id
          setInventory(prev => prev.map(i =>
            i.id && i.id.startsWith("temp_") ? { ...i, id: ref.id } : i
          ));
        })
        .catch(err => {
          console.error("Firestore add error:", err.code, err.message);
          showToast("\u26a0\ufe0f Sync failed: " + (err.code || err.message) + ". Check Firestore rules.");
          // Remove temp entry if Firestore failed permanently
          setInventory(prev => prev.filter(i => !(i.id && i.id.startsWith("temp_"))));
        });
    }
  };

  const handlePrint = () => {
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>PharmaRx Inventory Report</title>
    <style>
      body{font-family:'Nunito',Arial,sans-serif;padding:32px;color:#0f172a;background:#fff}
      .header{display:flex;align-items:center;gap:16px;margin-bottom:8px;padding-bottom:16px;border-bottom:3px solid #4361ee}
      .logo{width:44px;height:44px;background:linear-gradient(135deg,#4361ee,#7c3aed);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;color:#fff}
      h1{font-size:22px;font-weight:800;color:#0f172a;margin:0}
      .sub{color:#64748b;font-size:13px;margin:0}
      .meta{color:#64748b;font-size:12px;margin-bottom:20px;margin-top:8px}
      table{width:100%;border-collapse:collapse;font-size:12.5px}
      th{background:#f1f5f9;padding:10px 12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:#64748b;border-bottom:2px solid #e2e8f0}
      td{padding:10px 12px;border-bottom:1px solid #f1f5f9}
      tr:hover td{background:#f8faff}
      .badge{padding:2px 9px;border-radius:99px;font-size:10px;font-weight:700}
      .good{background:#ecfdf5;color:#059669}.low{background:#fffbeb;color:#d97706}.crit{background:#fef2f2;color:#ef4444}
      .footer{margin-top:24px;font-size:11px;color:#94a3b8;text-align:right;padding-top:12px;border-top:1px solid #e2e8f0}
    </style></head><body>
    <div class="header">
      <div class="logo">💊</div>
      <div><h1>PharmaRx Management System</h1><p class="sub">Medicine Inventory Report</p></div>
    </div>
    <div class="meta">Generated: ${new Date().toLocaleString("en-IN")} &nbsp;|&nbsp; Total Items: ${filtered.length} &nbsp;|&nbsp; Filters: ${filterCat || "All Categories"}, ${filterType || "All Types"}</div>
    <table><thead><tr><th>#</th><th>Medicine</th><th>Category</th><th>Type</th><th>Stock</th><th>Price (₹)</th><th>Expiry</th><th>Supplier</th><th>Status</th></tr></thead>
    <tbody>${filtered.map((item, i) => `<tr>
      <td>${i+1}</td>
      <td><strong>${item.name}</strong></td>
      <td>${item.category}</td><td>${item.type}</td>
      <td>${item.stock}</td><td>₹${item.price}</td>
      <td>${item.expiry}</td><td>${item.supplier || "—"}</td>
      <td><span class="badge ${item.stock < 100 ? "crit" : item.stock < 300 ? "low" : "good"}">${item.stock < 100 ? "Critical" : item.stock < 300 ? "Low" : "Good"}</span></td>
    </tr>`).join("")}</tbody></table>
    <div class="footer">PharmaRx Pharmacy Management System · Confidential</div>
    </body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <div className="rx-page">
      <div className="rx-filters">
        <input className="rx-input" style={{ flex:1, maxWidth:300 }}
          placeholder="🔍  Search medicine or supplier…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="rx-select" style={{ width:170 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All Categories</option>
          {MEDICINE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="rx-select" style={{ width:150 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {MEDICINE_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        {(search || filterCat || filterType) && (
          <button className="rx-btn outline sm" onClick={() => { setSearch(""); setFilterCat(""); setFilterType(""); }}>Clear</button>
        )}
        <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
          <button className="rx-btn outline" onClick={handlePrint}>🖨️ Print</button>
          <button className="rx-btn primary" onClick={openAdd}>＋ Add Medicine</button>
        </div>
      </div>

      <div className="rx-card">
        <div className="rx-card-head">
          <span className="rx-card-title">📦 Medicine Inventory
            <span className="rx-badge info" style={{ marginLeft:8 }}>{filtered.length} shown</span>
          </span>
          <span className="rx-badge neutral">{inventory.length} total</span>
        </div>
        <div className="rx-table-wrap">
          <table className="rx-table">
            <thead>
              <tr>
                <th>#</th><th>Medicine Name</th><th>Category</th><th>Type</th>
                <th>Stock Level</th><th>Price</th><th>Expiry</th><th>Supplier</th>
                <th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10}>
                  <div className="rx-empty">
                    <div className="rx-empty-icon">📭</div>
                    <div className="rx-empty-title">No medicines found</div>
                    <div className="rx-empty-sub">Try adjusting your search or filters</div>
                  </div>
                </td></tr>
              ) : filtered.map((item, idx) => {
                const daysLeft = Math.ceil((new Date(item.expiry) - Date.now()) / 86400000);
                return (
                  <tr key={item.id}>
                    <td style={{ color:"var(--text-3)", fontSize:12, fontWeight:600 }}>{idx+1}</td>
                    <td>
                      <div style={{ fontWeight:700, color:"var(--text-1)", fontSize:13.5 }}>{item.name}</div>
                      <div style={{ fontSize:11.5, color:"var(--text-3)", marginTop:2 }}>ID: {item.id?.slice(0,8)}</div>
                    </td>
                    <td>
                      <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
                        <span>{CAT_META[item.category]?.icon}</span>
                        <span className="rx-tag">{item.category}</span>
                      </span>
                    </td>
                    <td>
                      <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:13 }}>
                        <span>{TYPE_META[item.type]?.icon || "💊"}</span>
                        <span style={{ fontWeight:500 }}>{item.type}</span>
                      </span>
                    </td>
                    <td><StockBar stock={item.stock} /></td>
                    <td style={{ fontWeight:800, fontSize:14, color:"var(--text-1)" }}>₹{item.price}</td>
                    <td>
                      <span style={{ fontSize:12.5, fontWeight:600, color: daysLeft < 60 ? "var(--danger)" : "var(--text-2)" }}>
                        {item.expiry}{daysLeft < 60 ? " ⚠️" : ""}
                      </span>
                    </td>
                    <td style={{ fontSize:12.5, color:"var(--text-2)" }}>{item.supplier || "—"}</td>
                    <td><StatusBadge stock={item.stock} /></td>
                    <td>
                      <div style={{ display:"flex", gap:5 }}>
                        <button className="rx-btn-icon" onClick={() => openEdit(item)} title="Edit">✏️</button>
                        <button className="rx-btn-icon danger" onClick={() => setDeleteId(item.id)} title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal
          title={editItem ? "✏️ Edit Medicine" : "➕ Add New Medicine"}
          onClose={closeModal}
          footer={
            <>
              <button className="rx-btn outline" onClick={closeModal}>Cancel</button>
              <button className="rx-btn primary" onClick={handleSave} disabled={loading}>
                {loading ? "Saving…" : editItem ? "Update Medicine" : "Save Medicine"}
              </button>
            </>
          }
        >
          <div className="rx-form-row">
            <div className="rx-form-group">
              <label className="rx-form-label">Medicine Name *</label>
              <input className="rx-form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Paracetamol 500mg" />
            </div>
            <div className="rx-form-group">
              <label className="rx-form-label">Supplier</label>
              <input className="rx-form-control" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} placeholder="Supplier name" />
            </div>
          </div>
          <div className="rx-form-row">
            <div className="rx-form-group">
              <label className="rx-form-label">Category *</label>
              <select className="rx-form-control" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="">Select category</option>
                {MEDICINE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="rx-form-group">
              <label className="rx-form-label">Type / Form *</label>
              <select className="rx-form-control" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="">Select type</option>
                {MEDICINE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="rx-form-row-3">
            <div className="rx-form-group">
              <label className="rx-form-label">Stock (units) *</label>
              <input className="rx-form-control" type="number" min="0" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} placeholder="0" />
            </div>
            <div className="rx-form-group">
              <label className="rx-form-label">Price (₹) *</label>
              <input className="rx-form-control" type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="0.00" />
            </div>
            <div className="rx-form-group">
              <label className="rx-form-label">Expiry Date *</label>
              <input className="rx-form-control" type="date" value={form.expiry} onChange={e => setForm({...form, expiry: e.target.value})} />
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <ConfirmDialog
          message="Are you sure you want to delete this medicine? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

// ─── MEDICINE CATEGORY ────────────────────────────────────────────────────────
function MedicineCategory({ inventory }) {
  const [cats,    setCats]    = useState(MEDICINE_CATEGORIES);
  const [newCat,  setNewCat]  = useState("");
  const [selected,setSelected]= useState(null);
  const [showModal,setShowModal]=useState(false);

  const addCat = () => {
    if (newCat.trim() && !cats.includes(newCat.trim())) {
      setCats([...cats, newCat.trim()]); setNewCat("");
    }
  };
  const delCat = c => {
    if (inventory.some(i => i.category === c)) { alert("Cannot delete: medicines exist in this category."); return; }
    setCats(cats.filter(x => x !== c));
    if (selected === c) setSelected(null);
  };

  return (
    <div className="rx-page">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:22 }}>
        <div>
          <h2 style={{ fontFamily:"var(--font-head)", fontSize:22, fontWeight:800, color:"var(--text-1)", letterSpacing:"-0.4px" }}>Medicine Categories</h2>
          <p style={{ color:"var(--text-3)", fontSize:13.5, marginTop:4 }}>Organise and manage your pharmacy's medicine categories</p>
        </div>
        <button className="rx-btn primary" onClick={() => setShowModal(true)}>＋ New Category</button>
      </div>

      <div className="rx-grid-4" style={{ marginBottom: selected ? 22 : 0 }}>
        {cats.map(cat => {
          const count = inventory.filter(i => i.category === cat).length;
          const total = inventory.filter(i => i.category === cat).reduce((s,i) => s+i.stock, 0);
          const meta  = CAT_META[cat] || { icon:"💊", color:"var(--brand)", bg:"var(--brand-light)" };
          return (
            <div key={cat} className={`rx-cat-card${selected===cat?" selected":""}`}
              style={{ borderColor: selected===cat ? meta.color : undefined }}
              onClick={() => setSelected(cat===selected ? null : cat)}>
              <div style={{ width:52, height:52, borderRadius:14, background:meta.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, margin:"0 auto 12px" }}>
                {meta.icon}
              </div>
              <div className="rx-cat-name">{cat}</div>
              <div className="rx-cat-count">{count} medicines · {total.toLocaleString()} units</div>
              {selected === cat && (
                <div style={{ marginTop:14, display:"flex", gap:6, justifyContent:"center" }} onClick={e => e.stopPropagation()}>
                  <button className="rx-btn outline sm" onClick={() => setSelected(null)}>Close</button>
                  <button className="rx-btn danger-btn sm" onClick={() => delCat(cat)}>Delete</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="rx-card">
          <div className="rx-card-head">
            <span className="rx-card-title">
              {CAT_META[selected]?.icon} {selected} — All Medicines
            </span>
            <span className="rx-badge info">{inventory.filter(i=>i.category===selected).length} items</span>
          </div>
          <div className="rx-table-wrap">
            <table className="rx-table">
              <thead><tr><th>Medicine</th><th>Type</th><th>Stock</th><th>Price</th><th>Expiry</th><th>Supplier</th></tr></thead>
              <tbody>
                {inventory.filter(i => i.category===selected).map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong></td>
                    <td><span style={{ display:"inline-flex", alignItems:"center", gap:5 }}>{TYPE_META[item.type]?.icon} {item.type}</span></td>
                    <td><StockBar stock={item.stock} /></td>
                    <td style={{ fontWeight:700 }}>₹{item.price}</td>
                    <td style={{ fontSize:12.5, color:"var(--text-2)" }}>{item.expiry}</td>
                    <td style={{ fontSize:12.5, color:"var(--text-2)" }}>{item.supplier||"—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <Modal title="➕ New Category" onClose={() => setShowModal(false)}
          footer={<>
            <button className="rx-btn outline" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="rx-btn primary" onClick={() => { addCat(); setShowModal(false); }}>Add Category</button>
          </>}>
          <div className="rx-form-group">
            <label className="rx-form-label">Category Name</label>
            <input className="rx-form-control" value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="e.g. Antivirals, Hormones…" autoFocus />
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── MEDICINE TYPE ────────────────────────────────────────────────────────────
function MedicineType({ inventory }) {
  const [types, setTypes]      = useState(MEDICINE_TYPES);
  const [newType, setNewType]  = useState("");
  const [selected, setSelected]= useState(null);
  const [showModal,setShowModal]= useState(false);

  const addType = () => {
    if (newType.trim() && !types.includes(newType.trim())) { setTypes([...types, newType.trim()]); setNewType(""); }
  };
  const delType = t => {
    if (inventory.some(i => i.type === t)) { alert("Cannot delete: medicines exist with this type."); return; }
    setTypes(types.filter(x => x !== t));
    if (selected === t) setSelected(null);
  };

  return (
    <div className="rx-page">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:22 }}>
        <div>
          <h2 style={{ fontFamily:"var(--font-head)", fontSize:22, fontWeight:800, color:"var(--text-1)", letterSpacing:"-0.4px" }}>Medicine Types</h2>
          <p style={{ color:"var(--text-3)", fontSize:13.5, marginTop:4 }}>Manage dosage forms and formulation types</p>
        </div>
        <button className="rx-btn primary" onClick={() => setShowModal(true)}>＋ New Type</button>
      </div>

      <div className="rx-grid-3" style={{ marginBottom: selected ? 22 : 0 }}>
        {types.map(type => {
          const count = inventory.filter(i => i.type === type).length;
          const meta  = TYPE_META[type] || { icon:"💊", color:"var(--brand)", bg:"var(--brand-light)" };
          return (
            <div key={type} className={`rx-type-card${selected===type?" selected":""}`}
              onClick={() => setSelected(type===selected ? null : type)}>
              <div className="rx-type-dot" style={{ background:meta.bg }}>
                {meta.icon}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14.5, fontFamily:"var(--font-head)" }}>{type}</div>
                <div style={{ color:"var(--text-3)", fontSize:12.5, marginTop:3 }}>{count} medicines in stock</div>
              </div>
              {selected === type && (
                <button className="rx-btn danger-btn sm" onClick={e => { e.stopPropagation(); delType(type); }}>Delete</button>
              )}
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="rx-card">
          <div className="rx-card-head">
            <span className="rx-card-title">{TYPE_META[selected]?.icon} {selected} — Medicines</span>
            <span className="rx-badge info">{inventory.filter(i=>i.type===selected).length} items</span>
          </div>
          <div className="rx-table-wrap">
            <table className="rx-table">
              <thead><tr><th>Medicine</th><th>Category</th><th>Stock</th><th>Price</th><th>Expiry</th></tr></thead>
              <tbody>
                {inventory.filter(i => i.type===selected).map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong></td>
                    <td><span className="rx-tag">{item.category}</span></td>
                    <td><StockBar stock={item.stock} /></td>
                    <td style={{ fontWeight:700 }}>₹{item.price}</td>
                    <td style={{ fontSize:12.5, color:"var(--text-2)" }}>{item.expiry}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <Modal title="➕ New Medicine Type" onClose={() => setShowModal(false)}
          footer={<>
            <button className="rx-btn outline" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="rx-btn primary" onClick={() => { addType(); setShowModal(false); }}>Add Type</button>
          </>}>
          <div className="rx-form-group">
            <label className="rx-form-label">Type / Dosage Form</label>
            <input className="rx-form-control" value={newType} onChange={e => setNewType(e.target.value)} placeholder="e.g. Lotion, Suppository, Inhaler…" autoFocus />
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
function Profile({ onLogout }) {
  const firebaseUser = auth.currentUser;
  const initName  = firebaseUser?.displayName || "Admin User";
  const initEmail = firebaseUser?.email || "admin@pharma.com";

  const [profile, setProfile] = useState({ name:initName, email:initEmail, phone:"", role:"Admin Pharmacist", license:"", pharmacy:"PharmaRx Healthcare", address:"" });
  const [edit, setEdit]       = useState(false);
  const [form, setForm]       = useState({ ...profile });

  const initials = profile.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();

  return (
    <div className="rx-page">
      {/* Header */}
      <div className="rx-profile-header">
        <div className="rx-avatar-lg">{initials}</div>
        <div style={{ flex:1, position:"relative", zIndex:1 }}>
          <h2 style={{ fontFamily:"var(--font-head)", fontSize:24, fontWeight:800, color:"#fff", letterSpacing:"-0.4px" }}>{profile.name}</h2>
          <div style={{ color:"rgba(255,255,255,0.7)", fontSize:14, marginTop:5 }}>{profile.role} · {profile.pharmacy}</div>
          <div style={{ color:"rgba(255,255,255,0.5)", fontSize:13, marginTop:3 }}>{profile.email}</div>
        </div>
        <button className="rx-btn" style={{ background:"rgba(255,255,255,0.12)", color:"#fff", border:"1.5px solid rgba(255,255,255,0.2)", position:"relative", zIndex:1 }} onClick={() => setEdit(true)}>
          ✏️ Edit Profile
        </button>
      </div>

      <div className="rx-grid-2">
        {/* Personal */}
        <div className="rx-card">
          <div className="rx-card-head"><span className="rx-card-title">👤 Personal Information</span></div>
          <div className="rx-card-body">
            {[["Full Name", profile.name], ["Email Address", profile.email], ["Phone Number", profile.phone||"Not set"], ["Address", profile.address||"Not set"]].map(([l,v]) => (
              <div key={l} className="rx-info-row">
                <span className="rx-info-label">{l}</span>
                <span className="rx-info-val">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pharmacy */}
        <div className="rx-card">
          <div className="rx-card-head"><span className="rx-card-title">🏥 Pharmacy Details</span></div>
          <div className="rx-card-body">
            {[["Role", profile.role], ["License No.", profile.license||"Not set"], ["Pharmacy", profile.pharmacy]].map(([l,v]) => (
              <div key={l} className="rx-info-row">
                <span className="rx-info-label">{l}</span>
                <span className="rx-info-val">{v}</span>
              </div>
            ))}
            <div style={{ marginTop:24 }}>
              <button className="rx-btn danger-btn" style={{ width:"100%", justifyContent:"center" }} onClick={onLogout}>
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {edit && (
        <Modal title="✏️ Edit Profile" onClose={() => setEdit(false)}
          footer={<>
            <button className="rx-btn outline" onClick={() => setEdit(false)}>Cancel</button>
            <button className="rx-btn primary" onClick={() => { setProfile(form); setEdit(false); }}>Save Changes</button>
          </>}>
          <div className="rx-form-row">
            <div className="rx-form-group"><label className="rx-form-label">Full Name</label><input className="rx-form-control" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div className="rx-form-group"><label className="rx-form-label">Email</label><input className="rx-form-control" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
          </div>
          <div className="rx-form-row">
            <div className="rx-form-group"><label className="rx-form-label">Phone</label><input className="rx-form-control" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+91 98765 43210" /></div>
            <div className="rx-form-group"><label className="rx-form-label">Role</label><input className="rx-form-control" value={form.role} onChange={e=>setForm({...form,role:e.target.value})} /></div>
          </div>
          <div className="rx-form-row">
            <div className="rx-form-group"><label className="rx-form-label">License No.</label><input className="rx-form-control" value={form.license} onChange={e=>setForm({...form,license:e.target.value})} placeholder="PH-2024-XXXXX" /></div>
            <div className="rx-form-group"><label className="rx-form-label">Pharmacy Name</label><input className="rx-form-control" value={form.pharmacy} onChange={e=>setForm({...form,pharmacy:e.target.value})} /></div>
          </div>
          <div className="rx-form-group"><label className="rx-form-label">Address</label><input className="rx-form-control" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Full pharmacy address" /></div>
        </Modal>
      )}
    </div>
  );
}

// ─── DAILY REPORT ─────────────────────────────────────────────────────────────

// ── always returns today's date fresh ──
function getToday() { return new Date().toISOString().slice(0, 10); }

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", hour12:true });
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}

// No-op stub kept so Inventory logActivity calls don't break
export function logActivity() {}

// ── uid-scoped storage — each user gets their own separate data ──
const LEGACY_KEY = "pharmarx_stock_movements";

function movKey(uid)          { return "pharmarx_moves_" + (uid || "guest"); }
function saveMoves(list, uid) { try { localStorage.setItem(movKey(uid), JSON.stringify(list.slice(0, 1000))); } catch {} }
function loadMoves(uid) {
  try {
    const key      = movKey(uid);
    const existing = localStorage.getItem(key);
    if (existing) return JSON.parse(existing);

    // One-time migration: old key had no uid, move it to new scoped key
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      localStorage.setItem(key, legacy);
      localStorage.removeItem(LEGACY_KEY);
      return JSON.parse(legacy);
    }
    return [];
  } catch { return []; }
}

const EMPTY_MOVE = { medicineId:"", qty:"", note:"", type:"out" };

// ── MovementTable defined OUTSIDE DailyReport so it never remounts ──
function MovementTable({ rows, emptyMsg, onDelete }) {
  const today = getToday();
  return (
    <div className="rx-card">
      <div className="rx-table-wrap">
        <table className="rx-table">
          <thead>
            <tr>
              <th>Time</th><th>Medicine</th><th>Category</th><th>Form</th>
              <th>Qty</th><th>Unit Price</th><th>Total Value</th>
              <th>Stock Change</th><th>Note</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={10}>
                <div className="rx-empty">
                  <div className="rx-empty-icon">{emptyMsg.icon}</div>
                  <div className="rx-empty-title">{emptyMsg.title}</div>
                  <div className="rx-empty-sub">{emptyMsg.sub}</div>
                </div>
              </td></tr>
            ) : rows.map(m => (
              <tr key={m.id}>
                <td style={{ fontSize:12, color:"var(--text-3)", fontWeight:600, whiteSpace:"nowrap" }}>{fmtTime(m.time)}</td>
                <td><strong style={{ color:"var(--text-1)" }}>{m.name}</strong></td>
                <td>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
                    <span>{CAT_META[m.category]?.icon}</span>
                    <span className="rx-tag">{m.category}</span>
                  </span>
                </td>
                <td style={{ fontSize:12.5, color:"var(--text-2)" }}>{m.formType}</td>
                <td>
                  <span className={`rx-badge ${m.type === "out" ? "danger" : "success"}`}>
                    {m.qty} units
                  </span>
                </td>
                <td style={{ color:"var(--text-2)" }}>₹{m.price}</td>
                <td style={{ fontWeight:800, fontSize:14, color: m.type === "out" ? "var(--danger)" : "var(--success)" }}>
                  {m.type === "out" ? "−" : "+"}₹{m.amount.toFixed(2)}
                </td>
                <td>
                  {m.stockBefore != null ? (
                    <span style={{ fontSize:12, display:"inline-flex", alignItems:"center", gap:4 }}>
                      <span style={{ fontWeight:700, color:"var(--text-2)" }}>{m.stockBefore}</span>
                      <span style={{ color:"var(--text-3)" }}>→</span>
                      <span style={{ fontWeight:700, color: m.stockAfter < 100 ? "var(--danger)" : m.stockAfter < 300 ? "var(--warning)" : "var(--success)" }}>
                        {m.stockAfter}
                      </span>
                    </span>
                  ) : <span style={{ color:"var(--text-3)", fontSize:12 }}>—</span>}
                </td>
                <td style={{ fontSize:12.5, color:"var(--text-3)", maxWidth:120 }}>{m.note || "—"}</td>
                <td>
                  {m.date === today && (
                    <button className="rx-btn-icon danger" onClick={() => onDelete(m.id)} title="Remove">🗑️</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 0 && (
        <div style={{ padding:"12px 22px", background:"var(--bg)", borderTop:"1px solid var(--border)", display:"flex", justifyContent:"flex-end", gap:28 }}>
          <span style={{ fontSize:13, color:"var(--text-2)" }}>
            Total Units: <strong>{rows.reduce((s, m) => s + m.qty, 0)}</strong>
          </span>
          <span style={{ fontSize:13.5, fontWeight:800, color: rows[0]?.type === "out" ? "var(--danger)" : "var(--success)" }}>
            Total: ₹{rows.reduce((s, m) => s + m.amount, 0).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}

function DailyReport({ inventory, setInventory, userId }) {
  const [movements,  setMovements]  = useState(() => loadMoves(userId));
  const [filterDate, setFilterDate] = useState(() => getToday());
  const [activeTab,  setActiveTab]  = useState("overview");
  const [showForm,   setShowForm]   = useState(false);
  const [formType,   setFormType]   = useState("out");
  const [form,       setForm]       = useState(EMPTY_MOVE);
  const [deleteId,   setDeleteId]   = useState(null);
  const [saving,     setSaving]     = useState(false);

  const today = getToday(); // fresh on every render

  const dayMovements = movements.filter(m => m.date === filterDate);
  const stockOut     = dayMovements.filter(m => m.type === "out");
  const stockIn      = dayMovements.filter(m => m.type === "in");
  const totalOut     = stockOut.reduce((s, m) => s + m.qty, 0);
  const totalIn      = stockIn.reduce((s,  m) => s + m.qty, 0);
  const totalOutAmt  = stockOut.reduce((s, m) => s + m.amount, 0);
  const totalInAmt   = stockIn.reduce((s,  m) => s + m.amount, 0);
  const netUnits     = totalIn - totalOut;
  const netAmount    = totalInAmt - totalOutAmt;

  const openForm = (type) => {
    setFormType(type);
    setForm({ ...EMPTY_MOVE, type });
    setShowForm(true);
  };

  const handleAdd = async () => {
    if (!form.medicineId || !form.qty || +form.qty <= 0)
      return alert("Please select a medicine and enter a valid quantity.");

    const med = inventory.find(i => i.id === form.medicineId);
    if (!med || !med.id) return alert("Medicine not found. Please try again.");

    if (form.type === "out" && +form.qty > med.stock)
      return alert(`Only ${med.stock} units available in stock.`);

    const newStock   = form.type === "out" ? med.stock - +form.qty : med.stock + +form.qty;
    const currentDay = getToday();

    const entry = {
      id:          Date.now(),
      type:        form.type,
      medicineId:  med.id,
      name:        med.name,
      category:    med.category,
      formType:    med.type,
      qty:         +form.qty,
      price:       med.price,
      amount:      +(+form.qty * med.price).toFixed(2),
      note:        form.note.trim(),
      date:        currentDay,
      time:        new Date().toISOString(),
      stockBefore: med.stock,
      stockAfter:  newStock,
    };

    setSaving(true);

    // ── STEP 1: Save locally & update UI immediately (never blocks) ──
    const existing = loadMoves(userId);
    const updated  = [entry, ...existing].slice(0, 1000);
    saveMoves(updated, userId);
    setMovements(updated);
    setInventory(prev =>
      prev.map(i => i.id === med.id ? { ...i, stock: newStock } : i)
    );
    setFilterDate(currentDay);
    setForm({ ...EMPTY_MOVE, type: form.type });
    setShowForm(false);
    setSaving(false);

    // ── STEP 2: Sync to Firestore in background (non-blocking) ──
    updateDoc(doc(db, "inventory", med.id), {
      stock:     newStock,
      updatedAt: new Date().toISOString(),
    }).catch(err => {
      console.error("Firestore sync error:", err.code, err.message);
      // Show a non-blocking toast instead of alert
      const toast = document.createElement("div");
      toast.textContent = "⚠️ Firestore sync failed: " + (err.code || err.message) + ". Data saved locally.";
      Object.assign(toast.style, {
        position:"fixed", bottom:"90px", left:"50%", transform:"translateX(-50%)",
        background:"#1e293b", color:"#fff", padding:"10px 20px", borderRadius:"10px",
        fontSize:"13px", fontFamily:"Nunito,sans-serif", zIndex:"999999",
        boxShadow:"0 4px 20px rgba(0,0,0,0.3)", maxWidth:"90vw", textAlign:"center",
      });
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 6000);
    });
  };

  const handleDelete = (id) => {
    const updated = movements.filter(m => m.id !== id);
    saveMoves(updated, userId);
    setMovements(updated);
    setDeleteId(null);
  };

  const handlePrint = () => {
    const win = window.open("", "_blank");
    const dateLabel = filterDate === today ? "Today" : fmtDate(filterDate + "T00:00:00");
    const rows = dayMovements.map((m, i) =>
      `<tr><td>${i+1}</td>` +
      `<td><span class="${m.type}">${m.type === "out" ? "STOCK OUT" : "STOCK IN"}</span></td>` +
      `<td><strong>${m.name}</strong></td><td>${m.category}</td>` +
      `<td>${m.qty}</td><td>Rs.${m.price}</td>` +
      `<td><strong>Rs.${m.amount.toFixed(2)}</strong></td>` +
      `<td>${m.stockBefore} → ${m.stockAfter}</td>` +
      `<td>${fmtTime(m.time)}</td><td>${m.note || "—"}</td></tr>`
    ).join("");

    win.document.write(
      "<!DOCTYPE html><html><head><title>PharmaRx Stock Report</title>" +
      "<style>" +
      "body{font-family:Arial,sans-serif;padding:32px;color:#0f172a;font-size:13px}" +
      ".hdr{display:flex;align-items:center;gap:14px;padding-bottom:16px;border-bottom:3px solid #4361ee;margin-bottom:20px}" +
      ".logo{width:42px;height:42px;background:linear-gradient(135deg,#4361ee,#7c3aed);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;color:#fff}" +
      "h1{font-size:18px;font-weight:800;margin:0}p{color:#64748b;font-size:12px;margin:2px 0}" +
      ".kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}" +
      ".kpi{background:#f8faff;border:1px solid #e2e8f0;border-radius:8px;padding:12px}" +
      ".kv{font-size:20px;font-weight:800}.kl{font-size:10px;color:#64748b;margin-top:2px;text-transform:uppercase}" +
      "table{width:100%;border-collapse:collapse}" +
      "th{background:#f1f5f9;padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#64748b;border-bottom:2px solid #e2e8f0}" +
      "td{padding:8px 10px;border-bottom:1px solid #f1f5f9}" +
      ".out{background:#fef2f2;color:#ef4444;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700}" +
      ".in{background:#ecfdf5;color:#059669;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700}" +
      ".footer{margin-top:20px;font-size:10px;color:#94a3b8;text-align:right;padding-top:10px;border-top:1px solid #e2e8f0}" +
      "</style></head><body>" +
      "<div class='hdr'><div class='logo'>💊</div><div>" +
      "<h1>PharmaRx — Daily Stock Movement Report</h1>" +
      "<p>Date: " + dateLabel + " | Generated: " + new Date().toLocaleString("en-IN") + " | Total: " + dayMovements.length + " entries</p>" +
      "</div></div>" +
      "<div class='kpis'>" +
      "<div class='kpi'><div class='kv' style='color:#ef4444'>" + totalOut + "</div><div class='kl'>Units Out</div></div>" +
      "<div class='kpi'><div class='kv' style='color:#059669'>" + totalIn + "</div><div class='kl'>Units In</div></div>" +
      "<div class='kpi'><div class='kv' style='color:#ef4444'>Rs." + totalOutAmt.toFixed(2) + "</div><div class='kl'>Sales Value</div></div>" +
      "<div class='kpi'><div class='kv' style='color:#059669'>Rs." + totalInAmt.toFixed(2) + "</div><div class='kl'>Restock Value</div></div>" +
      "</div>" +
      (dayMovements.length > 0
        ? "<table><thead><tr><th>#</th><th>Type</th><th>Medicine</th><th>Category</th><th>Qty</th><th>Price</th><th>Total</th><th>Stock</th><th>Time</th><th>Note</th></tr></thead><tbody>" + rows + "</tbody></table>"
        : "<p style='color:#94a3b8;text-align:center;padding:20px'>No movements for this date.</p>") +
      "<div class='footer'>PharmaRx · Confidential</div>" +
      "</body></html>"
    );
    win.document.close();
    win.print();
  };

  // ── live preview helper ──
  const previewMed = form.medicineId ? inventory.find(i => i.id === form.medicineId) : null;
  const previewAmt = previewMed && +form.qty > 0 ? (+form.qty * previewMed.price).toFixed(2) : null;
  const previewAfter = previewMed && +form.qty > 0
    ? (formType === "out" ? previewMed.stock - +form.qty : previewMed.stock + +form.qty)
    : null;

  return (
    <div className="rx-page">

      {/* ── Banner ── */}
      <div className="rx-report-header">
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", fontWeight:700, marginBottom:6, letterSpacing:"1.5px", textTransform:"uppercase" }}>
            Daily Stock Movement
          </div>
          <h2 style={{ fontFamily:"var(--font-head)", fontSize:24, fontWeight:800, color:"#fff", letterSpacing:"-0.4px", marginBottom:12 }}>
            {filterDate === today
              ? new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" })
              : fmtDate(filterDate + "T00:00:00")}
          </h2>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <span className="rx-report-date-pill" style={{ background:"rgba(239,68,68,0.2)", borderColor:"rgba(239,68,68,0.45)" }}>
              📤 Out: {totalOut} units · ₹{totalOutAmt.toFixed(2)}
            </span>
            <span className="rx-report-date-pill" style={{ background:"rgba(16,185,129,0.2)", borderColor:"rgba(16,185,129,0.45)" }}>
              📥 In: {totalIn} units · ₹{totalInAmt.toFixed(2)}
            </span>
            <span className="rx-report-date-pill" style={{
              background:  netUnits >= 0 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
              borderColor: netUnits >= 0 ? "rgba(16,185,129,0.45)" : "rgba(239,68,68,0.45)",
            }}>
              {netUnits >= 0 ? "📈" : "📉"} Net: {netUnits >= 0 ? "+" : ""}{netUnits} units
            </span>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8, zIndex:1, alignItems:"flex-end" }}>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            style={{ padding:"8px 12px", borderRadius:8, border:"1.5px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.08)", color:"#fff", fontSize:13, fontFamily:"var(--font-body)", outline:"none" }} />
          <button className="rx-btn" style={{ background:"rgba(255,255,255,0.1)", color:"#fff", border:"1.5px solid rgba(255,255,255,0.2)" }} onClick={handlePrint}>
            🖨️ Print Report
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="rx-stats" style={{ marginBottom:22 }}>
        <div className="rx-stat red">
          <div className="rx-stat-top"><div className="rx-stat-icon red">📤</div><span className="rx-stat-badge down">Stock Out</span></div>
          <div className="rx-stat-val" style={{ color:"var(--danger)" }}>{totalOut}</div>
          <div className="rx-stat-label">Units Sold / Dispensed</div>
        </div>
        <div className="rx-stat green">
          <div className="rx-stat-top"><div className="rx-stat-icon green">📥</div><span className="rx-stat-badge up">Stock In</span></div>
          <div className="rx-stat-val" style={{ color:"var(--success)" }}>{totalIn}</div>
          <div className="rx-stat-label">Units Restocked</div>
        </div>
        <div className="rx-stat orange">
          <div className="rx-stat-top"><div className="rx-stat-icon orange">💰</div><span className="rx-stat-badge warn">Revenue</span></div>
          <div className="rx-stat-val">₹{totalOutAmt.toFixed(0)}</div>
          <div className="rx-stat-label">Sales Value Today</div>
        </div>
        <div className="rx-stat blue">
          <div className="rx-stat-top"><div className="rx-stat-icon blue">🔄</div><span className="rx-stat-badge up">Movements</span></div>
          <div className="rx-stat-val">{dayMovements.length}</div>
          <div className="rx-stat-label">Total Entries</div>
        </div>
      </div>

      {/* ── Action bar ── */}
      <div className="rx-action-bar" style={{ display:"flex", gap:10, marginBottom:20, alignItems:"center", flexWrap:"wrap" }}>
        <button className="rx-btn danger-btn" onClick={() => openForm("out")}>
          📤 Record Stock Out (Sale)
        </button>
        <button className="rx-btn" style={{ background:"var(--success)", color:"#fff", boxShadow:"0 2px 8px rgba(16,185,129,0.3)" }}
          onClick={() => openForm("in")}>
          📥 Record Stock In (Restock)
        </button>
        <div style={{ marginLeft:"auto", display:"flex", gap:4 }}>
          {[
            { id:"overview", label:"All" },
            { id:"out",      label:"📤 Out" },
            { id:"in",       label:"📥 In"  },
          ].map(t => (
            <button key={t.id}
              className={`rx-btn ${activeTab === t.id ? "primary" : "outline"} sm`}
              onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Entry form ── */}
      {showForm && (
        <div className="rx-sale-form" style={{
          borderColor: formType === "out" ? "var(--danger)" : "var(--success)",
          borderWidth: 2, marginBottom: 20,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
            <span style={{ fontSize:20 }}>{formType === "out" ? "📤" : "📥"}</span>
            <span style={{ fontFamily:"var(--font-head)", fontWeight:700, fontSize:14.5, color:"var(--text-1)" }}>
              {formType === "out" ? "Record Stock Out — Sold / Dispensed" : "Record Stock In — Restock / Purchase"}
            </span>
            <button className="rx-btn outline sm" style={{ marginLeft:"auto" }}
              onClick={() => { setShowForm(false); setForm(EMPTY_MOVE); }}>
              ✕ Cancel
            </button>
          </div>

          <div className="rx-entry-form-grid" style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr auto", gap:12, alignItems:"end" }}>
            <div>
              <label className="rx-form-label">Medicine *</label>
              <select className="rx-form-control" value={form.medicineId}
                onChange={e => setForm({ ...form, medicineId: e.target.value })}>
                <option value="">Select medicine…</option>
                {[...inventory]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.category}) — Stock: {i.stock}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="rx-form-label">Quantity *</label>
              <input className="rx-form-control" type="number" min="1"
                value={form.qty}
                onChange={e => setForm({ ...form, qty: e.target.value })}
                placeholder="e.g. 10" />
            </div>
            <div>
              <label className="rx-form-label">Note (optional)</label>
              <input className="rx-form-control" value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })}
                placeholder={formType === "out" ? "Patient / Rx no." : "Supplier / Batch no."} />
            </div>
            <div>
              <button
                className="rx-btn"
                disabled={saving}
                style={{
                  height: 40,
                  background: saving ? "#94a3b8" : formType === "out" ? "var(--danger)" : "var(--success)",
                  color: "#fff",
                  cursor: saving ? "not-allowed" : "pointer",
                  boxShadow: formType === "out" ? "0 2px 8px rgba(239,68,68,0.3)" : "0 2px 8px rgba(16,185,129,0.3)",
                  minWidth: 80,
                }}
                onClick={handleAdd}>
                {saving ? "⏳ Saving…" : "✓ Save"}
              </button>
            </div>
          </div>

          {/* Live preview */}
          {previewMed && previewAmt && (
            <div style={{
              marginTop: 12, padding: "10px 16px",
              background: formType === "out" ? "#fef2f2" : "#ecfdf5",
              border: `1px solid ${formType === "out" ? "#fca5a5" : "#6ee7b7"}`,
              borderRadius: 8, display: "flex", gap: 28, flexWrap: "wrap", fontSize: 13,
            }}>
              <span style={{ fontWeight:700, color: formType === "out" ? "var(--danger)" : "var(--success)" }}>
                {formType === "out" ? "📤" : "📥"} {form.qty} × ₹{previewMed.price} = <strong>₹{previewAmt}</strong>
              </span>
              <span style={{ color:"var(--text-2)" }}>
                Current Stock: <strong>{previewMed.stock}</strong>
              </span>
              <span>
                After Sale:{" "}
                <strong style={{ color: previewAfter < 0 ? "var(--danger)" : previewAfter < 100 ? "var(--warning)" : "var(--success)" }}>
                  {previewAfter}
                </strong>
                {previewAfter < 0 && " ⚠️ Insufficient!"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Tables ── */}
      {activeTab === "overview" && (
        <MovementTable
          rows={dayMovements}
          emptyMsg={{ icon:"🔄", title:"No movements yet", sub: filterDate === today ? "Use the buttons above to record stock in or out" : "No entries recorded for this date" }}
          onDelete={id => setDeleteId(id)}
        />
      )}
      {activeTab === "out" && (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <h3 style={{ fontFamily:"var(--font-head)", fontSize:16, fontWeight:700 }}>📤 Stock Out Entries</h3>
            <span style={{ color:"var(--text-2)", fontSize:13 }}>
              {totalOut} units &nbsp;·&nbsp; <strong style={{ color:"var(--danger)" }}>₹{totalOutAmt.toFixed(2)}</strong>
            </span>
          </div>
          <MovementTable
            rows={stockOut}
            emptyMsg={{ icon:"📤", title:"No stock-out entries", sub:"Click 'Record Stock Out' to log a sale" }}
            onDelete={id => setDeleteId(id)}
          />
        </>
      )}
      {activeTab === "in" && (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <h3 style={{ fontFamily:"var(--font-head)", fontSize:16, fontWeight:700 }}>📥 Stock In Entries</h3>
            <span style={{ color:"var(--text-2)", fontSize:13 }}>
              {totalIn} units &nbsp;·&nbsp; <strong style={{ color:"var(--success)" }}>₹{totalInAmt.toFixed(2)}</strong>
            </span>
          </div>
          <MovementTable
            rows={stockIn}
            emptyMsg={{ icon:"📥", title:"No stock-in entries", sub:"Click 'Record Stock In' to log a restock" }}
            onDelete={id => setDeleteId(id)}
          />
        </>
      )}

      {/* ── Net summary ── */}
      {dayMovements.length > 0 && (
        <div className="rx-card" style={{ marginTop:20 }}>
          <div className="rx-card-head">
            <span className="rx-card-title">⚖️ Daily Net Summary</span>
          </div>
          <div className="rx-card-body">
            <div className="rx-net-summary-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
              {[
                { label:"Stock Out (Sold)",     val:`${totalOut} units`,  sub:`₹${totalOutAmt.toFixed(2)}`,                               color:"var(--danger)",  icon:"📤" },
                { label:"Stock In (Restocked)", val:`${totalIn} units`,   sub:`₹${totalInAmt.toFixed(2)}`,                                color:"var(--success)", icon:"📥" },
                { label:"Net Movement",         val:`${netUnits >= 0 ? "+" : ""}${netUnits} units`,
                                                sub:`${netAmount >= 0 ? "+" : ""}₹${Math.abs(netAmount).toFixed(2)}`,
                                                color: netUnits >= 0 ? "var(--success)" : "var(--danger)", icon:"🔄" },
              ].map(({ label, val, sub, color, icon }) => (
                <div key={label} style={{ background:"var(--bg)", borderRadius:12, padding:20, border:"1px solid var(--border)", textAlign:"center" }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
                  <div style={{ fontFamily:"var(--font-head)", fontSize:22, fontWeight:800, color }}>{val}</div>
                  <div style={{ fontSize:13, fontWeight:700, color, marginTop:3 }}>{sub}</div>
                  <div style={{ fontSize:12, color:"var(--text-3)", marginTop:5 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <ConfirmDialog
          message="Remove this stock movement entry? This will NOT reverse the inventory stock change in Firestore."
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}


// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function PharmacyApp() {
  const navigate = useNavigate();

  // Ensure viewport meta is set correctly for mobile
  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
  }, []);
  const [page,         setPage]        = useState("dashboard");
  const [inventory,    setInventory]   = useState([]);
  const [dbLoading,    setDbLoading]   = useState(true);
  const [topSearch,    setTopSearch]   = useState("");
  const [searchResults,setSearchResults]=useState([]);
  const [showResults,  setShowResults] = useState(false);
  const searchRef = useRef(null);

  const lowCount = inventory.filter(i => i.stock < 150).length;

  const handleLogout = () => signOut(auth).then(() => navigate("/login"));

  // ── Firestore realtime with safe seeding ──
  useEffect(() => {
    let seeded = false;
    const unsub = onSnapshot(collection(db, "inventory"), async snapshot => {
      if (snapshot.empty && !seeded) {
        seeded = true;
        await Promise.all(INITIAL_INVENTORY.map(item => addDoc(collection(db, "inventory"), item)));
      } else if (!snapshot.empty) {
        setInventory(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        setDbLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const handleTopSearch = val => {
    setTopSearch(val);
    if (val.trim().length < 2) { setSearchResults([]); setShowResults(false); return; }
    const res = inventory.filter(i =>
      i.name.toLowerCase().includes(val.toLowerCase()) ||
      i.category.toLowerCase().includes(val.toLowerCase()) ||
      (i.supplier||"").toLowerCase().includes(val.toLowerCase()) ||
      i.type.toLowerCase().includes(val.toLowerCase())
    );
    setSearchResults(res);
    setShowResults(true);
  };

  const firebaseUser = auth.currentUser;
  const userName  = firebaseUser?.displayName || firebaseUser?.email || "Admin";
  const userInit  = userName.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();

  const NAV = [
    { id:"dashboard", label:"Dashboard",    icon:"📊" },
    { id:"inventory", label:"Inventory",    icon:"📦" },
    { id:"daily",     label:"Daily Report", icon:"📅" },
    { id:"category",  label:"Categories",   icon:"🏷️" },
    { id:"type",      label:"Types",        icon:"💊" },
  ];
  const PAGE_TITLES = { dashboard:"Dashboard", inventory:"Inventory", daily:"Daily Report", category:"Medicine Categories", type:"Medicine Types", profile:"My Profile" };

  if (dbLoading) return (
    <>
      <style>{STYLES}</style>
      <div className="rx-loading">
        <div className="rx-loading-icon">💊</div>
        <div className="rx-loading-text">Loading PharmaRx…</div>
        <div className="rx-loading-sub">Syncing your inventory data</div>
      </div>
    </>
  );

  return (
    <>
      <style>{STYLES}</style>
      <div className="rx-app">

        {/* ── SIDEBAR ── */}
        <aside className="rx-sidebar">
          <div className="rx-sidebar-logo">
            <div className="rx-logo-icon">💊</div>
            <div>
              <div className="rx-logo-text">PharmaRx</div>
              <div className="rx-logo-sub">Management System</div>
            </div>
          </div>

          <nav className="rx-nav">
            <div className="rx-nav-label">Main</div>
            {NAV.map(p => (
              <button key={p.id} className={`rx-nav-item${page===p.id?" active":""}`} onClick={() => setPage(p.id)}>
                <span className="rx-nav-icon">{p.icon}</span>
                <span>{p.label}</span>
                {p.id==="inventory" && lowCount>0 && <span className="rx-nav-badge">{lowCount}</span>}
              </button>
            ))}

            <div className="rx-nav-label" style={{ marginTop:8 }}>Account</div>
            <button className={`rx-nav-item${page==="profile"?" active":""}`} onClick={() => setPage("profile")}>
              <span className="rx-nav-icon">👤</span><span>Profile</span>
            </button>
            <button className="rx-nav-item" onClick={handleLogout}>
              <span className="rx-nav-icon">🚪</span><span>Sign Out</span>
            </button>
          </nav>

          <div className="rx-sidebar-footer">
            <button className="rx-profile-btn" onClick={() => setPage("profile")}>
              <div className="rx-avatar">{userInit}</div>
              <div>
                <div className="rx-pname">{userName}</div>
                <div className="rx-prole">Admin Pharmacist</div>
              </div>
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <div className="rx-main">

          {/* Topbar */}
          <header className="rx-topbar">
            <span className="rx-topbar-title">{PAGE_TITLES[page]}</span>

            {/* Global Search */}
            <div className="rx-search-wrap" ref={searchRef}>
              <div className="rx-search-box">
                <span className="rx-search-icon">🔍</span>
                <input
                  placeholder="Search medicines…"
                  value={topSearch}
                  onChange={e => handleTopSearch(e.target.value)}
                  onFocus={() => topSearch.length >= 2 && setShowResults(true)}
                  onBlur={() => setTimeout(() => setShowResults(false), 220)}
                />
                {topSearch && (
                  <button className="rx-search-clear" onClick={() => { setTopSearch(""); setShowResults(false); }}>✕</button>
                )}
              </div>
              {showResults && (
                <div className="rx-search-dropdown">
                  {searchResults.length === 0 ? (
                    <div className="rx-search-empty">😕 No results for <strong>"{topSearch}"</strong></div>
                  ) : (
                    <>
                      <div className="rx-search-header">{searchResults.length} result{searchResults.length!==1?"s":""}</div>
                      {searchResults.slice(0,6).map(item => (
                        <div key={item.id} className="rx-search-item"
                          onClick={() => { setPage("inventory"); setTopSearch(""); setShowResults(false); }}>
                          <div className="rx-search-thumb" style={{ background: CAT_META[item.category]?.bg }}>
                            {CAT_META[item.category]?.icon || "💊"}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:700, fontSize:13, color:"var(--text-1)" }}>{item.name}</div>
                            <div style={{ fontSize:11.5, color:"var(--text-3)", marginTop:1.5 }}>{item.category} · {item.type} · Stock: {item.stock}</div>
                          </div>
                          <div style={{ fontSize:13, fontWeight:800, color:"var(--brand)" }}>₹{item.price}</div>
                        </div>
                      ))}
                      <div className="rx-search-footer"
                        onClick={() => { setPage("inventory"); setTopSearch(""); setShowResults(false); }}>
                        View all {searchResults.length} results in Inventory →
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="rx-topbar-actions">
              <button className="rx-icon-btn" title="Notifications">
                🔔{lowCount>0 && <span className="rx-notif-dot" />}
              </button>
              <button className="rx-icon-btn" title="Settings">⚙️</button>
            </div>
          </header>

          {/* Pages */}
          {page==="dashboard" && <Dashboard inventory={inventory} setPage={setPage} />}
          {page==="inventory" && <Inventory inventory={inventory} setInventory={setInventory} />}
          {page==="daily"     && <DailyReport inventory={inventory} setInventory={setInventory} userId={firebaseUser?.uid} />}
          {page==="category"  && <MedicineCategory inventory={inventory} />}
          {page==="type"      && <MedicineType inventory={inventory} />}
          {page==="profile"   && <Profile onLogout={handleLogout} />}
        </div>

        {/* ── MOBILE BOTTOM NAV ── */}
        <nav className="rx-mobile-nav">
          {[
            { id:"dashboard", icon:"📊", label:"Home"   },
            { id:"inventory", icon:"📦", label:"Stock"  },
            { id:"daily",     icon:"📅", label:"Report" },
            { id:"category",  icon:"🏷️", label:"Categ." },
            { id:"profile",   icon:"👤", label:"Profile"},
          ].map(p => (
            <button key={p.id} className={`rx-mn-item${page===p.id?" active":""}`} onClick={() => setPage(p.id)}>
              <div className="rx-mn-wrap">
                <span className="rx-mn-icon">{p.icon}</span>
                {p.id==="inventory" && lowCount>0 && <span className="rx-mn-badge">{lowCount}</span>}
              </div>
              <span>{p.label}</span>
            </button>
          ))}
        </nav>

      </div>
    </>
  );
}