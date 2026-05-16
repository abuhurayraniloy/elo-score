"use client";

import { useState } from "react";

export default function VotingCards({ match, onVote }) {
  const [animatingWinner, setAnimatingWinner] = useState(null);

  const handleVote = (winnerId) => {
    if (animatingWinner) return;
    setAnimatingWinner(winnerId);
    
    setTimeout(() => {
      onVote(winnerId);
      setAnimatingWinner(null);
    }, 450);
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
    <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
      <style dangerouslySetInnerHTML={{__html: `
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
      `}} />
      <div className="cards-container">
        <div className={getCardClass(match.photo_a.id)} onClick={() => handleVote(match.photo_a.id)}>
          <img src={`${baseUrl}${match.photo_a.image_url}`} alt="Photo A" className="card-img" />
          <div className="card-overlay">
            <button className="vote-btn">❤️</button>
          </div>
        </div>
        
        <div className="vs-badge">VS</div>

        <div className={getCardClass(match.photo_b.id)} onClick={() => handleVote(match.photo_b.id)}>
          <img src={`${baseUrl}${match.photo_b.image_url}`} alt="Photo B" className="card-img" />
          <div className="card-overlay">
            <button className="vote-btn">❤️</button>
          </div>
        </div>
      </div>
    </div>
  );
}
