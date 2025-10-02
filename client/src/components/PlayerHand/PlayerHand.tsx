import React from 'react';
import Card from '../Card'; 
import './PlayerHand.scss';

interface CardData {
  suit: string;
  rank: string;
  color?: string;
  isCountdown?: boolean;
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
            key={`${card.suit}-${card.rank}-${index}`}
            suit={card.suit} 
            rank={card.rank} 
            color={card.color}
            isCountdown={card.isCountdown}
            onClick={() => onPlayCard(card)} 
            className={isMyTurn ? '' : 'not-my-turn'} 
          />        ))}
      </div>
    </div>
  );
};

export default PlayerHand;