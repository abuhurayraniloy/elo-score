"use client";
import { useState } from "react";
import { login, register } from "../lib/api";

export default function AuthForm({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, email, password);
        await login(username, password);
      }
      onLoginSuccess();
    } catch (err) {
      setError(err.message || "Something went wrong");
    }
  };

  return (
    <div className="glass-panel form-container">
      <h2 className="form-title">{isLogin ? "Welcome Back" : "Join Ranker"}</h2>
      {error && <p className="error-text">{error}</p>}
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <div className="form-group">
          <label className="form-label">Username</label>
          <input
            className="form-input"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        {!isLogin && (
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="btn-primary"
          style={{ marginTop: "1rem" }}
        >
          {isLogin ? "Sign In" : "Sign Up"}
        </button>
      </form>
      <p
        style={{
          textAlign: "center",
          fontSize: "0.9rem",
          color: "var(--text-muted)",
        }}
      >
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button
          onClick={() => setIsLogin(!isLogin)}
          style={{
            background: "none",
            border: "none",
            color: "var(--primary)",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          {isLogin ? "Sign Up" : "Sign In"}
        </button>
      </p>
    </div>
  );
}
