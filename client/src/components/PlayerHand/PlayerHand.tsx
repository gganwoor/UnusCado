import React, { useState, useRef } from 'react';
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

interface AnimatingCardInfo {
  card: CardData;
  index: number;
  startRect: DOMRect;
}

const PlayerHand: React.FC<PlayerHandProps> = ({ hand, isMyTurn, onPlayCard, discardPile, countdownState, attackStack }) => {
  const [animatingCard, setAnimatingCard] = useState<AnimatingCardInfo | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleCardClick = (card: CardData, index: number) => {
    if (isMyTurn && isCardPlayable(card, discardPile, attackStack, countdownState) && !animatingCard) {
      const startNode = cardRefs.current[index];
      if (startNode) {
        setAnimatingCard({ 
          card, 
          index, 
          startRect: startNode.getBoundingClientRect() 
        });
      }
    }
  };

  const handleAnimationEnd = () => {
    if (animatingCard) {
      onPlayCard(animatingCard.card);
      setAnimatingCard(null);
    }
  };

  const endNode = document.querySelector('.Discard-pile .card-container');
  const endRect = endNode?.getBoundingClientRect();

  return (
    <>
      <div className="Player-hand">
        <div className="Card-list">
          {hand.map((card, index) => {
            const isAnimating = animatingCard?.index === index;
            const playable = isMyTurn && isCardPlayable(card, discardPile, attackStack, countdownState);
            let playableClass = '';
            if (playable && !animatingCard) {
              playableClass = attackStack > 0 ? 'playable-attack' : 'playable';
            }
            const cardClassName = `${isMyTurn && !animatingCard ? '' : 'not-my-turn'} ${playableClass}`;

            return (
              <div 
                ref={el => { cardRefs.current[index] = el; }}
                key={`${card.suit}-${card.rank}-${index}`}
                style={{ opacity: isAnimating ? 0 : 1 }}
                onClick={() => handleCardClick(card, index)} 
              >
                <Card 
                  suit={card.suit} 
                  rank={card.rank} 
                  color={card.color}
                  isCountdown={card.isCountdown}
                  className={cardClassName}
                />
              </div>
            );
          })}
        </div>
      </div>
      {animatingCard && endRect && (
        <div
          className="card-fly-container"
          onAnimationEnd={handleAnimationEnd}
          style={{
            '--start-x': `${animatingCard.startRect.left}px`,
            '--start-y': `${animatingCard.startRect.top}px`,
            '--end-x': `${endRect.left}px`,
            '--end-y': `${endRect.top}px`,
            '--start-width': `${animatingCard.startRect.width}px`,
            '--start-height': `${animatingCard.startRect.height}px`,
            '--end-width': `${endRect.width}px`,
            '--end-height': `${endRect.height}px`,
          } as React.CSSProperties}
        >
          <Card 
            suit={animatingCard.card.suit} 
            rank={animatingCard.card.rank} 
            color={animatingCard.card.color}
            isCountdown={animatingCard.card.isCountdown}
          />
        </div>
      )}
    </>
  );
};

export default PlayerHand;