import React from 'react';
import Card from '../Card'; 
import './PlayerHand.scss';
import { isCardPlayable } from '../../utils/card-logic';

interface CardData {
  suit: string;
  rank: string;
  color?: string;
  isCountdown?: boolean;
}

interface CountdownState {
  ownerId: string | null;
  number: number | null;
}

interface PlayerHandProps {
  hand: CardData[];
  isMyTurn: boolean;
  onPlayCard: (card: CardData) => void;
  discardPile: CardData[];
  countdownState: CountdownState | null;
  attackStack: number;
}

const PlayerHand: React.FC<PlayerHandProps> = ({ hand, isMyTurn, onPlayCard, discardPile, countdownState, attackStack }) => {

  return (
    <div className="Player-hand">
      <div className="Card-list">
        {hand.map((card, index) => {
          const playable = isMyTurn && isCardPlayable(card, discardPile, attackStack, countdownState);
          let playableClass = '';
          if (playable) {
            playableClass = attackStack > 0 ? 'playable-attack' : 'playable';
          }
          const cardClassName = `${isMyTurn ? '' : 'not-my-turn'} ${playableClass}`;

          return (
            <Card 
              key={`${card.suit}-${card.rank}-${index}`}
              suit={card.suit} 
              rank={card.rank} 
              color={card.color}
              isCountdown={card.isCountdown}
              onClick={() => onPlayCard(card)} 
              className={cardClassName}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PlayerHand;