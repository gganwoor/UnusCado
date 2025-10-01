import React from 'react';
import Card from '../Card';
import './GameBoard.scss';

interface CardData {
  suit: string;
  rank: string;
}

interface GameBoardProps {
  discardPile: CardData[];
  drawPileSize: number;
  isMyTurn: boolean;
  onDrawCard: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ discardPile, drawPileSize, isMyTurn, onDrawCard }) => {
  return (
    <>
      <div className="Discard-pile">
        {discardPile.length > 0 ? (
          <Card suit={discardPile[0].suit} rank={discardPile[0].rank} />
        ) : (
          <Card suit="" rank="" className="empty" />
        )}
      </div>

      <div className="Draw-pile" onClick={onDrawCard} style={{ cursor: isMyTurn ? 'pointer' : 'not-allowed' }}>
        <div className="Card-list draw-pile-stack">
          {Array.from({ length: drawPileSize }).map((_, i) => (
            <Card 
              key={i} 
              suit="" 
              rank="" 
              isFaceDown={true} 
              className="stacked-card" 
              style={{ top: `${i * -1}px`, left: `${i * 1}px`, zIndex: i + 1 }}
            />
          ))}
          {drawPileSize === 0 && (
            <Card suit="" rank="" className="empty" />
          )}
        </div>
      </div>
    </>
  );
};

export default GameBoard;