import React from 'react';
import Card from '../Card'; 
import './PlayerHand.scss';

interface CardData {
  suit: string;
  rank: string;
}

interface PlayerHandProps {
  hand: CardData[];
  isMyTurn: boolean;
  onPlayCard: (card: CardData) => void;
}

const PlayerHand: React.FC<PlayerHandProps> = ({ hand, isMyTurn, onPlayCard }) => {
  return (
    <div className="Player-hand">
      <div className="Card-list">
        {hand.map((card, index) => (
          <Card 
            key={index} 
            suit={card.suit} 
            rank={card.rank} 
            onClick={() => onPlayCard(card)} 
            className={isMyTurn ? '' : 'not-my-turn'} 
          />
        ))}
      </div>
    </div>
  );
};

export default PlayerHand;