"use client";

import { useEffect, useState } from "react";
import AuthForm from "../components/AuthForm";
import VotingCards from "../components/VotingCards";
import ProgressBar from "../components/ProgressBar";
import { getNextMatch, submitVote } from "../lib/api";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [limitReached, setLimitReached] = useState(false);

  const checkAuthAndLoadMatch = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    setIsAuthenticated(true);
    window.dispatchEvent(new Event("auth-change"));
    try {
      const data = await getNextMatch();
      if (data.not_approved) {
        setMatchData(null);
        setError("PENDING_APPROVAL");
      } else {
        setMatchData(data);
      }
      setLimitReached(false);
    } catch (err) {
      if (err.status === 429) {
        setLimitReached(true);
        window.location.href = "/leaderboard?limit_reached=true";
      } else if (err.message === "No more matches available to vote on") {
        setError("You have voted on all available matches!");
      } else {
        setError(err.message || "Failed to load match");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthAndLoadMatch();
  }, []);

  const handleVote = async (winnerId) => {
    if (!matchData) return;
    try {
      await submitVote(matchData.photo_a.id, matchData.photo_b.id, winnerId);
      // Load next match
      await checkAuthAndLoadMatch();
    } catch (err) {
      setError(err.message || "Failed to submit vote");
    }
  };

  // Removed local handleLogout since it's now in the Navbar

  if (loading) {
    return (
      <div className="container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div className="form-title">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container">
        <AuthForm onLoginSuccess={checkAuthAndLoadMatch} />
      </div>
    );
  }

  return (
    <div className="container">
      {matchData && matchData.daily_limit && !limitReached && (
        <ProgressBar votesToday={matchData.votes_today} dailyLimit={matchData.daily_limit} />
      )}

      {limitReached ? (
        <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", marginTop: "2rem" }}>
          <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Redirecting to Leaderboard...</h2>
        </div>
      ) : error === "PENDING_APPROVAL" ? (
        <div className="glass-panel" style={{ padding: "4rem", maxWidth: "600px", margin: "0 auto", marginTop: "2rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>⏳</h1>
          <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Pending Approval</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "1.2rem", lineHeight: "1.6" }}>
            Your account is currently waiting for admin approval. 
            Once activated, you'll be able to join the ranking and cast your votes!
          </p>
          <div style={{ marginTop: "2rem", padding: "1rem", background: "rgba(255,255,255,0.05)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p style={{ fontSize: "0.9rem" }}>Tip: Check back soon or contact an admin to speed up the process.</p>
          </div>
        </div>
      ) : error ? (
        <div className="error-text" style={{ marginBottom: "1rem", fontSize: "1.2rem", textAlign: "center" }}>
          {error === "Failed to fetch" ? "Backend is offline. Please start the server." : error}
        </div>
      ) : matchData && matchData.photo_a ? (
        <VotingCards match={matchData} onVote={handleVote} />
      ) : null}
    </div>
  );
}
