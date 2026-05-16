"use client";

import { useEffect, useState } from "react";
import { getLeaderboard } from "../../lib/api";

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [limitReached, setLimitReached] = useState(false);
  const [resetTime, setResetTime] = useState("");

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("limit_reached") === "true") {
        setLimitReached(true);
        const now = new Date();
        const tomorrowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
        setResetTime(tomorrowUTC.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }));
      }
    }

    const fetchLeaderboard = async () => {
      try {
        const data = await getLeaderboard();
        setLeaderboard(data);
      } catch (err) {
        setError(err.message || "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div className="form-title">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="leaderboard">
        <h1 className="leaderboard-title">Top Ranked Photos</h1>
        
        {error && <p className="error-text">{error}</p>}
        
        <div className="glass-panel" style={{ padding: "2rem", marginTop: "2rem" }}>
          {leaderboard.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)" }}>No photos ranked yet.</p>
          ) : (
            leaderboard.map((photo, index) => (
              <div key={photo.id} className={`rank-item rank-${index + 1}`}>
                <div className="rank-number">#{index + 1}</div>
                <img src={photo.image_url.startsWith("http") ? photo.image_url : `${baseUrl}${photo.image_url}`} alt={`Rank ${index + 1}`} className="rank-img" />
                <div className="rank-info">
                  <div className="rank-score">Elo: {Math.round(photo.elo_rating)}</div>
                  <div className="rank-matches">{photo.matches_played} matches played</div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {limitReached && (
          <div className="glass-panel" style={{ padding: "2rem", marginTop: "2rem", textAlign: "center", border: "1px solid var(--primary)", background: "rgba(255, 75, 75, 0.05)" }}>
            <h3 style={{ color: "var(--primary)", marginBottom: "0.5rem", fontSize: "1.5rem" }}>Daily Limit Reached</h3>
            <p style={{ fontSize: "1.1rem" }}>You will be able to vote again at <strong style={{ color: "white" }}>{resetTime}</strong>.</p>
          </div>
        )}
      </div>
    </div>
  );
}
