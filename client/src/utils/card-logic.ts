interface CardData {
  suit: string;
  rank: string;
  isCountdown?: boolean;
}

interface CountdownState {
  ownerId: string | null;
  number: number | null;
}

export const isCardPlayable = (
  cardToPlay: CardData, 
  discardPile: CardData[], 
  attackStack: number, 
  countdownState: CountdownState | null
): boolean => {
  if (discardPile.length === 0) {
    return true;
  }

  const topCard = discardPile[0];

  if (attackStack > 0) {
    const isAttackCard = !cardToPlay.isCountdown && ['A', '2', 'Joker'].includes(cardToPlay.rank);
    const isDefenseCard = !cardToPlay.isCountdown && cardToPlay.rank === '3';

    if (isAttackCard || isDefenseCard) {
      if (cardToPlay.rank === 'Joker') {
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
