"use client";

import { useEffect, useState } from "react";

export default function Navbar() {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      setIsAuth(!!localStorage.getItem("token"));
    };
    
    checkAuth();
    window.addEventListener("auth-change", checkAuth);
    return () => window.removeEventListener("auth-change", checkAuth);
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth-change"));
    window.location.href = "/";
  };

  return (
    <nav className="navbar glass-panel">
      <div className="nav-container">
        <a href="/" className="logo">🔥 Ranker</a>
        <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <a href="/">Vote</a>
          <a href="/leaderboard">Leaderboard</a>
          {isAuth && (
            <button 
              onClick={handleLogout} 
              style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontWeight: "600", fontSize: "1rem" }}
            >
              Log Out
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
