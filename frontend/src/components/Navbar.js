"use client";

import { useEffect, useState } from "react";
import { getUserInfo } from "../lib/api";

export default function Navbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      setUser(getUserInfo());
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
        <a href="/" className="logo">
          🔥 Ranker
        </a>
        <div
          className="nav-links"
          style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}
        >
          <a href="/">Vote</a>
          <a href="/leaderboard">Leaderboard</a>
          {user?.role === "admin" && (
            <a
              href="/admin"
              style={{ color: "var(--primary)", fontWeight: "bold" }}
            >
              Admin
            </a>
          )}
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Hi,{" "}
                <span style={{ color: "#fff", fontWeight: "600" }}>
                  {user.username}
                </span>
              </span>
              <button
                onClick={handleLogout}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary)",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                }}
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
