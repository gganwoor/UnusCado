import React from 'react';
import './Card.css'; 

interface CardProps {
  suit: string;
  rank: string;
  isFaceDown?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties; 
}

const Card: React.FC<CardProps> = ({ suit, rank, isFaceDown = false, onClick, className }) => {
  const getCardImage = (s: string, r: string): string => {
    if (r === 'Joker') {
      return ''; 
    }
    
    const suitMap: { [key: string]: string } = {
      '♥': 'H', '♦': 'D', '♣': 'C', '♠': 'S',
      'Black': 'Black', 'Color': 'Color' 
    };
    const rankMap: { [key: string]: string } = {
      
    };

    const mappedRank = rankMap[r] || r;
    const mappedSuit = suitMap[s] || s;

    return `/assets/cardimg/${mappedRank}${mappedSuit}.png`;
  };

  const cardImagePath = getCardImage(suit, rank);

  return (
    <div className={`card-container ${className || ''}`} onClick={onClick}>
      {isFaceDown ? (
        <img src="/assets/cardimg/Card-back.png" alt="Card Back" className="card-image" /> 
      ) : (
        rank === 'Joker' ? (
          <div className="joker-text">{suit} {rank}</div> 
        ) : (
          <img src={cardImagePath} alt={`${rank} of ${suit}`} className="card-image" />
        )
      )}
    </div>
  );
};

export default Card;