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
      setMatchData(data);
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
      {error && <div className="error-text" style={{ marginBottom: "1rem", fontSize: "1.2rem", textAlign: "center" }}>{error}</div>}
      
      {matchData && matchData.daily_limit && !limitReached && (
        <ProgressBar votesToday={matchData.votes_today} dailyLimit={matchData.daily_limit} />
      )}

      {limitReached ? (
        <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", marginTop: "2rem" }}>
          <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Redirecting to Leaderboard...</h2>
        </div>
      ) : matchData && matchData.photo_a && !error ? (
        <VotingCards match={matchData} onVote={handleVote} />
      ) : null}
    </div>
  );
}
