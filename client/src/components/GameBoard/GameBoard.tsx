import React from 'react';
import Card from '../Card';
import './GameBoard.scss';

interface CardData {
  suit: string;
  rank: string;
  color?: string;
  isCountdown?: boolean;
}

interface GameBoardProps {
  discardPile: CardData[];
  drawPileSize: number;
  isMyTurn: boolean;
  onDrawCard: () => void;
  mustDraw: boolean;
  attackStack: number;
}

const GameBoard: React.FC<GameBoardProps> = ({ discardPile, drawPileSize, isMyTurn, onDrawCard, mustDraw, attackStack }) => {
  const mustDrawClass = mustDraw ? (attackStack > 0 ? 'must-draw-attack' : 'must-draw-normal') : '';

  return (
    <>
      <div className="Discard-pile">
        {discardPile.length > 0 ? (
          <Card 
            suit={discardPile[0].suit} 
            rank={discardPile[0].rank} 
            color={discardPile[0].color}
            isCountdown={discardPile[0].isCountdown}
          />
        ) : (
          <Card suit="" rank="" className="empty" />
        )}
      </div>

      <div className="Draw-pile" onClick={onDrawCard} style={{ cursor: isMyTurn ? 'pointer' : 'not-allowed' }}>
        <div className={`Card-list draw-pile-stack ${mustDrawClass}`}>
          {Array.from({ length: drawPileSize }).map((_, i) => {
            const isTopCard = i === drawPileSize - 1;
            const cardClassName = `stacked-card ${isTopCard ? 'top-card' : ''}`;

            return (
              <Card 
                key={i} 
                suit="" 
                rank="" 
                isFaceDown={true} 
                className={cardClassName}
                style={{ top: `${i * -1}px`, left: `${i * 1}px`, zIndex: i + 1 }}
              />
            );
          })}
          {drawPileSize === 0 && (
            <Card suit="" rank="" className="empty" />
          )}
        </div>
      </div>
    </>
  );
};

export default GameBoard;