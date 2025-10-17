import React from 'react';
import Card from '../Card'; 
import './PlayerHand.scss';

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
  const isCardPlayable = (cardToPlay: CardData): boolean => {
    if (discardPile.length === 0) {
      return true;
    }

    const topCard = discardPile[0];

    if (attackStack > 0) {
      const isAttackCard = ['A', '2', 'Joker'].includes(cardToPlay.rank);
      const isDefenseCard = cardToPlay.rank === '3';
      const isCountdownCard = cardToPlay.isCountdown && cardToPlay.rank === '3';

      if (isAttackCard || isDefenseCard || isCountdownCard) {
        if (cardToPlay.rank === 'Joker' || (cardToPlay.isCountdown && cardToPlay.rank === '3')) {
          return true;
        } 
        if (topCard && (topCard.rank === 'Joker' || cardToPlay.rank === topCard.rank || cardToPlay.suit === topCard.suit)) {
          return true;
        }
      }
      return false;
    } 
    
    const topIsCountdown = topCard && topCard.isCountdown;
    const countdownNumber = countdownState?.number;

    if (topIsCountdown && countdownNumber !== null && countdownNumber !== undefined) {
      const isPlayedCardCountdown = cardToPlay.isCountdown;
      let isInterruptPlay = false;
      const playedRank = cardToPlay.rank;

      if (countdownNumber === 3 && ['A', '2', '3', 'Joker'].includes(playedRank)) {
        isInterruptPlay = true;
      } else if (countdownNumber === 2 && ['A', '2', 'Joker'].includes(playedRank)) {
        isInterruptPlay = true;
      } else if (countdownNumber === 1 && playedRank === 'A') {
        isInterruptPlay = true;
      }

      if (isPlayedCardCountdown && parseInt(cardToPlay.rank, 10) === countdownNumber - 1) {
        return true;
      } 
      if (isInterruptPlay) {
        return true;
      }
      return false;
    }

    if (cardToPlay.isCountdown && cardToPlay.rank === '3') {
      return true;
    } 
    if (cardToPlay.rank === 'Joker') {
      return true;
    }
    if (topCard && topCard.rank === 'Joker') {
      if (!cardToPlay.isCountdown) {
        return true;
      }
      if (cardToPlay.isCountdown && cardToPlay.rank !== '0') {
        return true;
      }
    }
    if (topCard && !cardToPlay.isCountdown && (cardToPlay.rank === topCard.rank || cardToPlay.suit === topCard.suit)) {
      return true;
    }

    return false;
  };

  return (
    <div className="Player-hand">
      <div className="Card-list">
        {hand.map((card, index) => {
          const playable = isMyTurn && isCardPlayable(card);
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