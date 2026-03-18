import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import AdminRegister from "./pages/AdminRegister";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import PharmacyApp from "./pages/Dashboard";


export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/register" element={<AdminRegister />} />
        <Route path="/" element={
          <ProtectedRoute>
            <PharmacyApp />
          </ProtectedRoute>
        } />
      </Routes>
    </HashRouter>
  );
}