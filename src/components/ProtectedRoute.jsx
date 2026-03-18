import { Navigate } from "react-router-dom";
import { auth } from "../firebase";
import { useState, useEffect } from "react";

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);

  if (user === undefined) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}