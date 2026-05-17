"use client";

import { useState } from "react";

export default function VotingCards({ match, onVote }) {
  const [animatingWinner, setAnimatingWinner] = useState(null);
  const [eloResult, setEloResult] = useState(null);

  const handleVote = async (winnerId) => {
    if (animatingWinner) return;
    setAnimatingWinner(winnerId);

    // Call onVote and wait for the math result
    const result = await onVote(winnerId);
    if (result) {
      setEloResult(result);
    }

    // Longer timeout to let the user see the math
    setTimeout(() => {
      setAnimatingWinner(null);
      setEloResult(null);
    }, 1200);
  };

  const getCardClass = (photoId) => {
    let className = "glass-panel card";
    if (animatingWinner === photoId) {
      className += " scale-up-center";
    } else if (animatingWinner !== null && animatingWinner !== photoId) {
      className += " slide-out-bottom";
    }
    return className;
  };

  // Base URL is needed for static images
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .scale-up-center { 
          animation: scale-up-center 0.45s cubic-bezier(0.390, 0.575, 0.565, 1.000) both; 
          z-index: 20;
          border-color: var(--primary);
        }
        .slide-out-bottom { 
          animation: slide-out-bottom 0.4s cubic-bezier(0.550, 0.085, 0.680, 0.530) both; 
        }
        @keyframes scale-up-center { 
          0% { transform: scale(1); } 
          100% { transform: scale(1.08) translateY(-10px); box-shadow: 0 0 40px rgba(255, 75, 75, 0.4); } 
        }
        @keyframes slide-out-bottom { 
          0% { transform: translateY(0); opacity: 1; } 
          100% { transform: translateY(80px); opacity: 0; } 
        }
        .elo-float {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 3rem;
          font-weight: 800;
          color: var(--primary);
          text-shadow: 0 0 20px rgba(0,0,0,0.8);
          animation: float-up 1s ease-out forwards;
          pointer-events: none;
          z-index: 100;
        }
        @keyframes float-up {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          20% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
          100% { transform: translate(-50%, -150%) scale(1); opacity: 0; }
        }
      `,
        }}
      />
      <div className="cards-container">
        <div
          className={getCardClass(match.photo_a.id)}
          onClick={() => handleVote(match.photo_a.id)}
        >
          <img
            src={
              match.photo_a.image_url.startsWith("http")
                ? match.photo_a.image_url
                : `${baseUrl}${match.photo_a.image_url}`
            }
            alt="Photo A"
            className="card-img"
          />
          <div className="card-overlay">
            <button className="vote-btn">❤️</button>
          </div>
          {eloResult && (
            <div
              className="elo-float"
              style={{
                color: eloResult.photo_a.change > 0 ? "#10b981" : "#ff4b4b",
              }}
            >
              {eloResult.photo_a.change > 0 ? "+" : ""}
              {eloResult.photo_a.change.toFixed(1)}
            </div>
          )}
        </div>

        <div className="vs-badge">VS</div>

        <div
          className={getCardClass(match.photo_b.id)}
          onClick={() => handleVote(match.photo_b.id)}
        >
          <img
            src={
              match.photo_b.image_url.startsWith("http")
                ? match.photo_b.image_url
                : `${baseUrl}${match.photo_b.image_url}`
            }
            alt="Photo B"
            className="card-img"
          />
          <div className="card-overlay">
            <button className="vote-btn">❤️</button>
          </div>
          {eloResult && (
            <div
              className="elo-float"
              style={{
                color: eloResult.photo_b.change > 0 ? "#10b981" : "#ff4b4b",
              }}
            >
              {eloResult.photo_b.change > 0 ? "+" : ""}
              {eloResult.photo_b.change.toFixed(1)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
