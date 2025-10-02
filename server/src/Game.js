class Game {
  constructor(gameId) {
    this.gameId = gameId;
    this.players = [];
    this.deck = [];
    this.discardPile = [];
    this.drawPile = [];
    this.currentPlayerIndex = 0;
    this.attackStack = 0;
    this.direction = 1;
    this.pendingSuitChange = null;
    this.countdownState = { ownerId: null, number: null };
  }

  addPlayer(socketId, playerName) {
    this.players.push({ id: socketId, hand: [], name: playerName });
  }

  removePlayer(socketId) {
    this.players = this.players.filter(p => p.id !== socketId);
  }

  getGameStateForPlayer(socketId) {
    const player = this.players.find(p => p.id === socketId);
    if (!player) return null;

    return {
      gameId: this.gameId,
      myPlayerId: socketId,
      playerHand: player.hand,
      discardPile: this.discardPile,
      drawPileSize: this.drawPile.length,
      currentPlayerId: this.players[this.currentPlayerIndex] ? this.players[this.currentPlayerIndex].id : null,
      attackStack: this.attackStack,
      players: this.players.map(p => ({ id: p.id, name: p.name, handSize: p.hand.length })),
      countdownState: this.countdownState,
    };
  }

  startGame() {
    const suits = {
      '♥': 'Red',
      '♦': 'Red',
      '♣': 'Black',
      '♠': 'Black'
    };
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    this.deck = [];
    for (const suitSymbol in suits) {
      const color = suits[suitSymbol];
      for (const rank of ranks) {
        this.deck.push({ suit: suitSymbol, rank, color });
      }
    }
    this.deck.push({ suit: 'Black', rank: 'Joker', color: 'Black' });
    this.deck.push({ suit: 'Color', rank: 'Joker', color: 'Red' });

    this.deck.push({ suit: '♥', rank: '3', color: 'Red', isCountdown: true });
    this.deck.push({ suit: '♦', rank: '2', color: 'Red', isCountdown: true });
    this.deck.push({ suit: '♣', rank: '1', color: 'Black', isCountdown: true });
    this.deck.push({ suit: '♠', rank: '0', color: 'Black', isCountdown: true });

    
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }

    this.players.forEach(p => {
      p.hand = this.deck.splice(0, 7);
    });

    this.discardPile = this.deck.splice(0, 1);
    this.drawPile = this.deck;

    this.currentPlayerIndex = 0;
    this.attackStack = 0;
    this.direction = 1;
    this.pendingSuitChange = null;
    this.countdownState = { ownerId: null, number: null };
  }

  applySpecialCardEffect(playedCard, socketId) {
    if (playedCard.isCountdown) return;

    if (playedCard.rank === 'K') {
    } else if (playedCard.rank === 'J') {
      this.advanceTurn(true);
    } else if (playedCard.rank === 'Q') {
      this.direction *= -1;
    } else if (playedCard.rank === '2') {
      this.attackStack += 2;
    } else if (playedCard.rank === 'A') {
      this.attackStack += 3;
    } else if (playedCard.rank === '3') {
      this.attackStack = 0;
    } else if (playedCard.rank === 'Joker') {
      if (playedCard.suit === 'Black') {
        this.attackStack += 5;
      } else if (playedCard.suit === 'Color') {
        this.attackStack += 10;
      }
    }
  }

  playCard(socketId, cardToPlay) {
    const player = this.players.find(p => p.id === socketId);
    if (!player || player.id !== this.players[this.currentPlayerIndex].id) {
      return false;
    }

    const cardIndex = player.hand.findIndex(card => 
      card.suit === cardToPlay.suit && 
      card.rank === cardToPlay.rank &&
      !!card.isCountdown === !!cardToPlay.isCountdown
    );
    if (cardIndex === -1) return false;

    const topCard = this.discardPile[0];
    let isValidPlay = false;
    let isInterrupt = false;

    const topIsCountdown = topCard && topCard.isCountdown;

    if (topIsCountdown && this.countdownState.number !== null) {
      const isPlayedCardCountdown = cardToPlay.isCountdown;
      const isInterruptCard = ['A', '2'].includes(cardToPlay.rank);
      const isPlayedCardJoker = cardToPlay.rank === 'Joker';

      if (isPlayedCardCountdown && parseInt(cardToPlay.rank, 10) === this.countdownState.number - 1) {
        isValidPlay = true;
      }
      else if (isPlayedCardJoker) {
        isValidPlay = true;
        isInterrupt = true;
      } else if (this.countdownState.number === 1 && cardToPlay.rank === 'A') {
        isValidPlay = true;
        isInterrupt = true;
      } else if (isInterruptCard) {
        if (this.countdownState.number === 3 && cardToPlay.color === topCard.color) {
          isValidPlay = true;
          isInterrupt = true;
        } else if (this.countdownState.number === 2 && cardToPlay.suit === topCard.suit) {
          isValidPlay = true;
          isInterrupt = true;
        }
      }
    } else {
      if (cardToPlay.isCountdown && cardToPlay.rank === '3') {
        isValidPlay = true;
      } else if (cardToPlay.rank === 'Joker' || (topCard && (topCard.rank === 'Joker' || cardToPlay.rank === topCard.rank || cardToPlay.suit === topCard.suit))) {
        isValidPlay = true;
      }
    }

    if (isValidPlay) {
      const playedCard = player.hand.splice(cardIndex, 1)[0];
      this.discardPile.unshift(playedCard);

      if (playedCard.isCountdown) {
        this.countdownState = { ownerId: socketId, number: parseInt(playedCard.rank, 10) };
        if (playedCard.rank === '0') {
          return 'countdown-win';
        }
      } else if (isInterrupt) {
        this.countdownState = { ownerId: null, number: null };
      } else {
        this.countdownState = { ownerId: null, number: null };
        this.applySpecialCardEffect(playedCard, socketId);
      }
      
      if (playedCard.rank === '7' && !isInterrupt) {
        this.pendingSuitChange = { card: playedCard, playerId: socketId };
        return 'choose-suit';
      }

      return true;
    } else {
      return false;
    }
  }

  drawCard(socketId) {
    const player = this.players.find(p => p.id === socketId);
    if (!player || player.id !== this.players[this.currentPlayerIndex].id) {
      return false;
    }

    if (this.drawPile.length === 0) {
      if (this.discardPile.length <= 1) {
        return false;
      }
      const topCard = this.discardPile.shift();
      this.drawPile = this.discardPile;
      
      for (let i = this.drawPile.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.drawPile[i], this.drawPile[j]] = [this.drawPile[j], this.drawPile[i]];
      }
      this.discardPile = [topCard];
    }

    if (this.drawPile.length > 0) {
      let cardsToDraw = 1;
      if (this.attackStack > 0) {
        cardsToDraw = this.attackStack;
        this.attackStack = 0;
      }

      for (let i = 0; i < cardsToDraw; i++) {
        if (this.drawPile.length > 0) {
          const drawnCard = this.drawPile.shift();
          player.hand.push(drawnCard);
        } else {
          break;
        }
      }
      
      return true;
    } else {
      return false;
    }
  }

  advanceTurn(skipNext = false) {
    let nextPlayerIndex = this.currentPlayerIndex;
    if (skipNext) {
      nextPlayerIndex += this.direction * 2;
    } else {
      nextPlayerIndex += this.direction;
    }

    nextPlayerIndex = (nextPlayerIndex % this.players.length + this.players.length) % this.players.length;
    this.currentPlayerIndex = nextPlayerIndex;

    const newCurrentPlayer = this.players[this.currentPlayerIndex];
    if (
      this.countdownState.ownerId &&
      newCurrentPlayer &&
      newCurrentPlayer.id === this.countdownState.ownerId
    ) {
      this.countdownState.number--;
      this.discardPile[0].rank = String(this.countdownState.number);
      this.discardPile[0].isCountdown = true;
      
      if (this.countdownState.number === 0) {
        return 'countdown-win';
      }
      return 'countdown-upgraded';
    }

    return null;
  }

  checkWinCondition(socketId) {
    const player = this.players.find(p => p.id === socketId);
    return player && player.hand.length === 0;
  }
}

module.exports = Game;