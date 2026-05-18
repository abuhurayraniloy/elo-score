"use client";

import { useEffect, useState } from "react";
import AuthForm from "../components/AuthForm";
import VotingCards from "../components/VotingCards";
import ProgressBar from "../components/ProgressBar";
import { getTournamentBracket, submitTournamentVote } from "../lib/api";
import Link from "next/link";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bracketMatches, setBracketMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submittingVote, setSubmittingVote] = useState(false);

  const loadVotingData = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");

    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    setIsAuthenticated(true);
    try {
      const data = await getTournamentBracket();
      setBracketMatches(data);
    } catch (err) {
      setError(err.message || "Failed to load voting matches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVotingData();
  }, []);

  // Filter for active match-ups for the current round
  const activeMatches = bracketMatches.filter((m) => m.is_active);
  const unvotedMatches = activeMatches.filter((m) => !m.has_voted);

  // Get the first active, unvoted match
  const currentMatch = unvotedMatches[0];

  // Calculate today's voting progress
  const totalActiveToday = activeMatches.length;
  const votedTodayCount = totalActiveToday - unvotedMatches.length;

  const handleVote = async (winnerId) => {
    if (submittingVote || !currentMatch) return;
    setSubmittingVote(true);
    try {
      await submitTournamentVote(currentMatch.id, winnerId);

      // Return a simulated rating change to trigger the premium float animation
      const simulatedResult = {
        photo_a: { change: 1.0 },
        photo_b: { change: 1.0 },
      };

      // Refresh data after the slide animation has played out
      setTimeout(async () => {
        try {
          const data = await getTournamentBracket();
          setBracketMatches(data);
        } catch (err) {
          console.error("Failed to refresh bracket data", err);
        } finally {
          setSubmittingVote(false);
        }
      }, 1200);

      return simulatedResult;
    } catch (err) {
      setError(err.message || "Failed to submit vote");
      setSubmittingVote(false);
    }
  };

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
        <div className="form-title">Loading Active Matches...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container">
        <AuthForm onLoginSuccess={loadVotingData} />
      </div>
    );
  }

  return (
    <div className="container">
      {/* ProgressBar for daily matches */}
      {totalActiveToday > 0 && (
        <ProgressBar
          votesToday={votedTodayCount}
          dailyLimit={totalActiveToday}
        />
      )}

      {error && (
        <div
          className="error-text"
          style={{
            marginBottom: "2rem",
            fontSize: "1.2rem",
            textAlign: "center",
          }}
        >
          {error === "Failed to fetch"
            ? "Backend is offline. Please start the server."
            : error}
        </div>
      )}

      {/* Main Duel comparison card area */}
      {currentMatch ? (
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>
            Tournament Match #{currentMatch.match_index + 1}
          </h2>
          <p
            style={{
              color: "var(--text-muted)",
              marginBottom: "2rem",
              fontSize: "1rem",
            }}
          >
            Which image should advance in the bracket? Click your favorite to vote!
          </p>
          <VotingCards
            match={{
              photo_a: currentMatch.photo_a,
              photo_b: currentMatch.photo_b,
            }}
            onVote={handleVote}
          />
        </div>
      ) : (
        <div
          className="glass-panel"
          style={{
            padding: "4rem 2rem",
            textAlign: "center",
            maxWidth: "600px",
            margin: "2rem auto",
            borderRadius: "24px",
            border: "1px solid var(--surface-border)",
            boxShadow: "var(--shadow-subtle)",
          }}
        >
          <span style={{ fontSize: "4rem" }}>🎉</span>
          <h2
            style={{
              fontSize: "2rem",
              marginTop: "1.5rem",
              marginBottom: "1rem",
            }}
          >
            All Caught Up!
          </h2>
          <p
            style={{
              color: "var(--text-muted)",
              lineHeight: "1.6",
              marginBottom: "2rem",
              fontSize: "1.1rem",
            }}
          >
            You have successfully voted on all active match-ups for this round!
            Check out the visual tournament bracket tree to view the live standings,
            completed round percentages, and upcoming duels.
          </p>
          <Link href="/leaderboard" className="btn-primary">
            Explore Bracket Standings 🏆
          </Link>
        </div>
      )}
    </div>
  );
}
