import React from 'react';
import './Card.css'; 

interface CardProps {
  suit: string;
  rank: string;
  color?: string;
  isFaceDown?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  isCountdown?: boolean;
}

const Card: React.FC<CardProps> = ({ suit, rank, color, isFaceDown = false, onClick, className, isCountdown }) => {
  const getCardImage = (s: string, r: string): string => {
    if (r === 'Joker' || isCountdown) { // Don't try to get images for countdown cards
      return ''; 
    }
    
    const suitMap: { [key: string]: string } = {
      '♥': 'H', '♦': 'D', '♣': 'C', '♠': 'S',
    };

    return `/assets/cardimg/${r}${suitMap[s]}.webp`;
  };

  const cardImagePath = getCardImage(suit, rank);

  const isTextCard = rank === 'Joker' || isCountdown;
  const specialTextMap: { [key: string]: string } = {
    '3': 'Tres',
    '2': 'Duo',
    '1': 'Unus',
    '0': 'Nihil',
  };

  const renderText = () => {
    let text = '';
    if (isCountdown) {
      text = specialTextMap[rank] || rank;
      return color ? `${text} ${suit} (${color})` : `${text} ${suit}`;
    }
    if (rank === 'Joker') {
      text = `${suit} ${rank}`;
      return color ? `${text} (${color})` : text;
    }
    return null;
  };

  return (
    <div className={`card-container ${className || ''}`} onClick={onClick}>
      {isFaceDown ? (
        <img src="/assets/cardimg/Card-back.webp" alt="Card Back" className="card-image" /> 
      ) : (
        isTextCard ? (
          <div className="joker-text">
            {renderText()}
          </div> 
        ) : (
          <img src={cardImagePath} alt={`${rank} of ${suit}`} className="card-image" />
        )
      )}
    </div>
  );
};

export default Card;
