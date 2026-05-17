"use client";

import { useEffect, useState } from "react";
import AuthForm from "../components/AuthForm";
import VotingCards from "../components/VotingCards";
import ProgressBar from "../components/ProgressBar";
import { getNextMatch, submitVote, getUserInfo } from "../lib/api";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [user, setUser] = useState(null);
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
    setUser(getUserInfo());
    window.dispatchEvent(new Event("auth-change"));
    try {
      const data = await getNextMatch();
      setMatchData(data);
      setLimitReached(false);
    } catch (err) {
      if (err.status === 429) {
        setLimitReached(true);
        const resetParam = err.next_reset
          ? `&next_reset=${encodeURIComponent(err.next_reset)}`
          : "";
        window.location.href = `/leaderboard?limit_reached=true${resetParam}`;
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
    try {
      const result = await submitVote(
        matchData.photo_a.id,
        matchData.photo_b.id,
        winnerId,
      );

      // Wait for the animation to play before fetching the next match
      setTimeout(async () => {
        await checkAuthAndLoadMatch();
      }, 1000);

      return result;
    } catch (err) {
      setError(err.message || "Failed to submit vote");
    }
  };

  // Removed local handleLogout since it's now in the Navbar

  if (loading) {
    return (
      <div
        className="container"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
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
        <ProgressBar
          votesToday={matchData.votes_today}
          dailyLimit={matchData.daily_limit}
        />
      )}

      {matchData && matchData.is_guest && (
        <div
          className="glass-panel"
          style={{
            padding: "1rem",
            marginBottom: "2rem",
            textAlign: "center",
            border: "1px solid var(--primary)",
            background: "rgba(255, 75, 75, 0.1)",
          }}
        >
          <span style={{ fontWeight: "bold", color: "var(--primary)" }}>
            🎮 GUEST MODE
          </span>
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--text-muted)",
              marginTop: "0.5rem",
            }}
          >
            {matchData.no_real_photos
              ? "Your account is approved! However, we are waiting for more user photos to begin the real competition. You are currently in guest mode."
              : "Your account is pending approval. You are currently voting in training mode (no rating impact)."}
          </p>
        </div>
      )}

      {limitReached ? (
        <div
          className="glass-panel"
          style={{ padding: "3rem", textAlign: "center", marginTop: "2rem" }}
        >
          <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
            Redirecting to Leaderboard...
          </h2>
        </div>
      ) : error ? (
        <div
          className="error-text"
          style={{
            marginBottom: "1rem",
            fontSize: "1.2rem",
            textAlign: "center",
          }}
        >
          {error === "Failed to fetch"
            ? "Backend is offline. Please start the server."
            : error}
        </div>
      ) : matchData && matchData.photo_a ? (
        <VotingCards match={matchData} onVote={handleVote} />
      ) : null}
    </div>
  );
}
