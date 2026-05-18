"use client";

import { useEffect, useState } from "react";
import {
  getTournamentBracket,
  getUserInfo,
} from "../../lib/api";
import AuthForm from "../../components/AuthForm";

export default function Leaderboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bracket, setBracket] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCompetitor, setSelectedCompetitor] = useState(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const loadBracketData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }
    setIsAuthenticated(true);
    try {
      const data = await getTournamentBracket();
      setBracket(data);
    } catch (err) {
      setError(err.message || "Failed to load tournament bracket");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBracketData();
  }, []);

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
        <div className="form-title">Loading Tournament Bracket...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container">
        <AuthForm onLoginSuccess={loadBracketData} />
      </div>
    );
  }

  // Group matches by round (1 to 5)
  const rounds = {
    1: { name: "Round of 32", matches: [] },
    2: { name: "Round of 16", matches: [] },
    3: { name: "Quarterfinals", matches: [] },
    4: { name: "Semifinals", matches: [] },
    5: { name: "Finals", matches: [] },
  };

  bracket.forEach((match) => {
    if (rounds[match.round_number]) {
      rounds[match.round_number].matches.push(match);
    }
  });

  // Sort matches within each round by index
  Object.keys(rounds).forEach((r) => {
    rounds[r].matches.sort((a, b) => a.match_index - b.match_index);
  });

  const getMatchStatusLabel = (match) => {
    if (match.winner) return "Completed";
    if (match.is_active) {
      return "Active ⚡";
    }
    return "Locked 🔒";
  };

  const finalsMatch = rounds[5]?.matches[0];
  const championPhoto = finalsMatch?.winner;

  // Reusable match renderer
  const renderMatchCard = (match, animationClass, baseDelay, index) => {
    if (!match) return null;
    const hasWinner = !!match.winner;
    const computedDelay = `${baseDelay + index * 0.05}s`;

    return (
      <div
        key={match.id}
        className={`bracket-match-box ${
          match.is_active ? "active-match" : ""
        } ${animationClass}`}
        style={{
          animationDelay: computedDelay,
          position: "relative",
          margin: "1rem 0"
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-8px",
            right: "8px",
            background: match.winner
              ? "rgba(251, 191, 36, 0.15)"
              : match.is_active
              ? "var(--primary)"
              : "rgba(255,255,255,0.05)",
            color: match.winner
              ? "#fbbf24"
              : match.is_active
              ? "white"
              : "var(--text-muted)",
            fontSize: "0.65rem",
            fontWeight: "700",
            padding: "2px 8px",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.05)",
            zIndex: "5",
          }}
        >
          {getMatchStatusLabel(match)}
        </div>

        {/* Participant A */}
        <div
          className={`bracket-participant ${
            hasWinner && match.winner.id === match.photo_a?.id ? "winner" : ""
          }`}
          style={{ cursor: match.photo_a ? "pointer" : "default" }}
          onClick={() => {
            if (match.photo_a) setSelectedCompetitor(match.photo_a);
          }}
        >
          {match.photo_a ? (
            <>
              <img
                className="bracket-participant-img"
                src={
                  match.photo_a.image_url.startsWith("http")
                    ? match.photo_a.image_url
                    : `${baseUrl}${match.photo_a.image_url}`
                }
                alt="Participant A"
              />
              <span className="bracket-participant-name">
                {match.photo_a.image_url.split("/").pop().slice(0, 12) || "Image A"}
              </span>
            </>
          ) : (
            <>
              <div className="bracket-participant-placeholder">?</div>
              <span
                className="bracket-participant-name"
                style={{ color: "var(--text-muted)", fontStyle: "italic" }}
              >
                TBD
              </span>
            </>
          )}
        </div>

        {/* Participant B */}
        <div
          className={`bracket-participant ${
            hasWinner && match.winner.id === match.photo_b?.id ? "winner" : ""
          }`}
          style={{ cursor: match.photo_b ? "pointer" : "default" }}
          onClick={() => {
            if (match.photo_b) setSelectedCompetitor(match.photo_b);
          }}
        >
          {match.photo_b ? (
            <>
              <img
                className="bracket-participant-img"
                src={
                  match.photo_b.image_url.startsWith("http")
                    ? match.photo_b.image_url
                    : `${baseUrl}${match.photo_b.image_url}`
                }
                alt="Participant B"
              />
              <span className="bracket-participant-name">
                {match.photo_b.image_url.split("/").pop().slice(0, 12) || "Image B"}
              </span>
            </>
          ) : (
            <>
              <div className="bracket-participant-placeholder">?</div>
              <span
                className="bracket-participant-name"
                style={{ color: "var(--text-muted)", fontStyle: "italic" }}
              >
                TBD
              </span>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container" style={{ maxWidth: "100%", padding: "2rem 1rem" }}>
      <h1 className="leaderboard-title" style={{ marginBottom: "0.5rem" }}>
        🏆 Official Tournament Bracket
      </h1>
      <p
        style={{
          textAlign: "center",
          color: "var(--text-muted)",
          marginBottom: "3rem",
          fontSize: "1.1rem",
        }}
      >
        Track the live fixtures, vote tallies, and champions dynamically. Scroll horizontally to explore. Click any photo for details.
      </p>

      {error && <p className="error-text">{error}</p>}

      {/* Main Bracket Scrollable Tree */}
      <div className="bracket-outer">
        <div className="bracket-container">
          
          {/* Columns 1-5 */}
          {Object.entries(rounds).map(([roundNum, round], rIndex) => (
            <div key={roundNum} className="bracket-column">
              <div className="bracket-round-title">{round.name}</div>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", height: "100%", minHeight: "850px" }}>
                {round.matches.map((m, idx) => 
                  renderMatchCard(m, "bracket-animate-up", rIndex * 0.15, idx)
                )}
              </div>
            </div>
          ))}

          {/* Column 6: Champion */}
          <div className="bracket-column">
             <div className="bracket-round-title" style={{ color: "#fbbf24" }}>CHAMPION</div>
             <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", minHeight: "850px" }}>
                {championPhoto ? (
                  <div
                    className="glass-panel champion-gold-card bracket-animate-up"
                    style={{
                      padding: "1.5rem",
                      borderRadius: "24px",
                      width: "240px",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      cursor: "pointer",
                      animationDelay: "0.85s"
                    }}
                    onClick={() => setSelectedCompetitor(championPhoto)}
                  >
                    <span style={{ fontSize: "3rem" }}>👑</span>
                    <h3 style={{ color: "#fbbf24", margin: "0.5rem 0", fontSize: "1.3rem", fontWeight: "800", letterSpacing: "1px" }}>WINNER</h3>
                    <img
                      src={
                        championPhoto.image_url.startsWith("http")
                          ? championPhoto.image_url
                          : `${baseUrl}${championPhoto.image_url}`
                      }
                      alt="Tournament Champion"
                      style={{ width: "120px", height: "120px", borderRadius: "16px", objectFit: "cover", margin: "0.5rem auto", border: "3px solid #fbbf24" }}
                    />
                    <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "white", marginTop: "0.5rem" }}>
                      {championPhoto.image_url.split("/").pop().slice(0, 14)}
                    </div>
                  </div>
                ) : (
                  <div className="glass-panel bracket-animate-up" style={{ padding: "1.5rem", borderRadius: "24px", width: "220px", textAlign: "center", border: "2px dashed var(--surface-border)", opacity: 0.6, animationDelay: "0.85s" }}>
                    <span style={{ fontSize: "2rem" }}>🏆</span>
                    <h4 style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>TBD CHAMPION</h4>
                  </div>
                )}
             </div>
          </div>

        </div>
      </div>

      {/* Competitor Flashcard Modal */}
      {selectedCompetitor && (
        <div className="modal-overlay" onClick={() => setSelectedCompetitor(null)}>
          <div
            className="modal-content glass-panel flashcard-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: "400px", 
              borderRadius: "24px",
              padding: "0",
              overflow: "hidden"
            }}
          >
            <button
              className="modal-close-btn"
              onClick={() => setSelectedCompetitor(null)}
              style={{ zIndex: 10, background: "rgba(0,0,0,0.5)", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              &times;
            </button>

            <img
              src={
                selectedCompetitor.image_url.startsWith("http")
                  ? selectedCompetitor.image_url
                  : `${baseUrl}${selectedCompetitor.image_url}`
              }
              alt="Competitor"
              style={{
                width: "100%",
                height: "350px",
                objectFit: "cover",
                display: "block"
              }}
            />
            
            <div style={{ padding: "1.5rem", textAlign: "center" }}>
              <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
                {selectedCompetitor.image_url.split("/").pop().slice(0, 16)}
              </h3>
              
              <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Elo Rating</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--primary)" }}>
                    {Math.round(selectedCompetitor.elo_rating || 1200)}
                  </div>
                </div>
                
                <div style={{ width: "1px", height: "40px", background: "var(--surface-border)" }}></div>
                
                <div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Matches</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: "800" }}>
                    {selectedCompetitor.matches_played || 0}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
