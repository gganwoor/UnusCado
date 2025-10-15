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
    let isValidPlay = false;

    if (attackStack > 0) {
      const isAttackCard = ['A', '2', 'Joker'].includes(cardToPlay.rank);
      const isDefenseCard = cardToPlay.rank === '3';
      const isCountdownCard = cardToPlay.isCountdown && cardToPlay.rank === '3';

      if (isAttackCard || isDefenseCard || isCountdownCard) {
        if ((cardToPlay.rank === 'Joker') || (cardToPlay.isCountdown && cardToPlay.rank === '3')) {
          isValidPlay = true;
        } else if (topCard && (topCard.rank === 'Joker' || cardToPlay.rank === topCard.rank || cardToPlay.suit === topCard.suit)) {
          isValidPlay = true;
        }
      }
    } else {
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
          isValidPlay = true;
        } else if (isInterruptPlay) {
          isValidPlay = true;
        }
      } else {
        if (cardToPlay.isCountdown && cardToPlay.rank === '3') {
          isValidPlay = true;
        } else if (cardToPlay.rank === 'Joker' || (topCard && (topCard.rank === 'Joker' || cardToPlay.rank === topCard.rank || cardToPlay.suit === topCard.suit))) {
          isValidPlay = true;
        }
      }
    }

    return isValidPlay;
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