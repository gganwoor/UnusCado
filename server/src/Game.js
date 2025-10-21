class Game {
  constructor(options = {}) {
    this.gameId = options.gameId;
    this.lastActivity = Date.now();
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

  updateLastActivity() {
    this.lastActivity = Date.now();
  }

  cleanup() {
    console.log(`Cleaning up game ${this.gameId}`);
  }

  addPlayer(socketId, playerName) {
    this.updateLastActivity();
    const isAI = socketId.startsWith('ai-');
    this.players.push({ id: socketId, hand: [], name: playerName, isAI });
  }

  removePlayer(socketId) {
    this.updateLastActivity();
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
      players: this.players.map(p => ({ id: p.id, name: p.name, handSize: p.hand.length, isAI: p.isAI })),
      countdownState: this.countdownState,
    };
  }

  startGame() {
    this.updateLastActivity();
    const suits = { '♥': 'Red', '♦': 'Red', '♣': 'Black', '♠': 'Black' };
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
    this.deck.push({ suit: 'Countdown', rank: '3', color: 'Gray', isCountdown: true });
    this.deck.push({ suit: 'Countdown', rank: '2', color: 'Gray', isCountdown: true });
    this.deck.push({ suit: 'Countdown', rank: '1', color: 'Gray', isCountdown: true });
    this.deck.push({ suit: 'Countdown', rank: '0', color: 'Gray', isCountdown: true });

    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }

    this.players.forEach(p => { p.hand = this.deck.splice(0, 7); });
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
    if (playedCard.rank === 'K') {} 
    else if (playedCard.rank === 'Q') { this.direction *= -1; }
    else if (playedCard.rank === '2') { this.attackStack += 2; }
    else if (playedCard.rank === 'A') { this.attackStack += 3; }
    else if (playedCard.rank === '3') { this.attackStack = 0; }
    else if (playedCard.rank === 'Joker') {
      if (playedCard.suit === 'Black') { this.attackStack += 5; }
      else if (playedCard.suit === 'Color') { this.attackStack += 10; }
    }
  }

  _isCardPlayable(cardToPlay) {
    const topCard = this.discardPile[0];
    if (!topCard) return true;

    if (this.attackStack > 0) {
      const isAttackCard = !cardToPlay.isCountdown && ['A', '2', 'Joker'].includes(cardToPlay.rank);
      const isDefenseCard = !cardToPlay.isCountdown && cardToPlay.rank === '3';

      if (isAttackCard || isDefenseCard) {
        if (cardToPlay.rank === 'Joker') {
          return true;
        }
        if (topCard.rank === 'Joker' || cardToPlay.rank === topCard.rank || cardToPlay.suit === topCard.suit) {
          return true;
        }
      }
      return false;
    }

    const topIsCountdown = topCard.isCountdown;
    if (topIsCountdown && this.countdownState.number !== null) {
      const isPlayedCardCountdown = cardToPlay.isCountdown;
      let isInterruptPlay = false;
      const playedRank = cardToPlay.rank;
      const countdownNumber = this.countdownState.number;

      if (countdownNumber === 3 && ['A', '2', '3', 'Joker'].includes(playedRank)) isInterruptPlay = true;
      else if (countdownNumber === 2 && ['A', '2', 'Joker'].includes(playedRank)) isInterruptPlay = true;
      else if (countdownNumber === 1 && playedRank === 'A') isInterruptPlay = true;

      if (isPlayedCardCountdown && parseInt(cardToPlay.rank, 10) === countdownNumber - 1) {
        return true;
      }
      if (isInterruptPlay) {
        return true;
      }
      
      return false; 
    }

    if (cardToPlay.isCountdown && cardToPlay.rank === '3') return true;
    if (cardToPlay.rank === 'Joker') return true;
    if (topCard.rank === 'Joker') {
      if (!cardToPlay.isCountdown) {
        return true;
      }
      if (cardToPlay.isCountdown && cardToPlay.rank !== '0') {
        return true;
      }
    }
    if (!cardToPlay.isCountdown && (cardToPlay.rank === topCard.rank || cardToPlay.suit === topCard.suit)) return true;

    return false;
  }

  playCard(socketId, cardToPlay) {
    this.updateLastActivity();
    const player = this.players.find(p => p.id === socketId);
    if (!player || player.id !== this.players[this.currentPlayerIndex].id) return false;

    const cardInHand = player.hand.find(card => card.suit === cardToPlay.suit && card.rank === cardToPlay.rank && !!card.isCountdown === !!cardToPlay.isCountdown);
    if (!cardInHand) return false;

    if (this._isCardPlayable(cardInHand)) {
      const cardIndex = player.hand.findIndex(c => c === cardInHand);
      const playedCard = player.hand.splice(cardIndex, 1)[0];
      const topCard = this.discardPile[0];
      let isInterrupt = false;
      if (topCard && topCard.isCountdown && !playedCard.isCountdown) {
        isInterrupt = true;
      }

      this.discardPile.unshift(playedCard);

      if (playedCard.isCountdown) {
        this.countdownState = { ownerId: socketId, number: parseInt(playedCard.rank, 10) };
        if (playedCard.rank === '0') return 'countdown-win';
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

      if (playedCard.rank === 'K' && !isInterrupt) {
        return 'play-again';
      }

      return true;
    }
    return false;
  }

  drawCard(socketId) {
    this.updateLastActivity();
    const player = this.players.find(p => p.id === socketId);
    if (!player || player.id !== this.players[this.currentPlayerIndex].id) return false;

    if (this.drawPile.length === 0) {
      if (this.discardPile.length <= 1) return false;
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
        if (this.drawPile.length > 0) player.hand.push(this.drawPile.shift());
        else break;
      }
      return true;
    }
    return false;
  }

  advanceTurn(skipNext = false) {
    this.updateLastActivity();
    let nextPlayerIndex = this.currentPlayerIndex;
    if (skipNext) {
      nextPlayerIndex += this.direction * 2;
    } else {
      nextPlayerIndex += this.direction;
    }
    this.currentPlayerIndex = (nextPlayerIndex % this.players.length + this.players.length) % this.players.length;

    const newCurrentPlayer = this.players[this.currentPlayerIndex];
    if (this.countdownState.ownerId && newCurrentPlayer && newCurrentPlayer.id === this.countdownState.ownerId) {
      this.countdownState.number--;
      this.discardPile[0].rank = String(this.countdownState.number);
      this.discardPile[0].isCountdown = true;
      if (this.countdownState.number === 0) return 'countdown-win';
      return 'countdown-upgraded';
    }
    return null;
  }

  checkWinCondition(socketId) {
    const player = this.players.find(p => p.id === socketId);
    return player && player.hand.length === 0;
  }

  runAITurn() {
    const currentPlayer = this.players[this.currentPlayerIndex];
    if (!currentPlayer || !currentPlayer.isAI) return null;

    this.updateLastActivity();

    if (this.attackStack > 0) {
      const defenseCard = currentPlayer.hand.find(card => this._isCardPlayable(card));
      if (defenseCard) {
        console.log(`AI ${currentPlayer.name} defends with ${defenseCard.rank} of ${defenseCard.suit}`);
        this.playCard(currentPlayer.id, defenseCard);
        return { action: 'play', card: defenseCard };
      } else {
        console.log(`AI ${currentPlayer.name} is under attack and draws ${this.attackStack} cards.`);
        this.drawCard(currentPlayer.id);
        return { action: 'draw' };
      }
    }

    const playableCards = currentPlayer.hand.filter(card => this._isCardPlayable(card));
    if (playableCards.length > 0) {

      let cardToPlay = playableCards.find(c => !['A', '2', 'J', 'Q', 'K', '7', 'Joker'].includes(c.rank));
      if (!cardToPlay) {
        cardToPlay = playableCards[0];
      }

      console.log(`AI ${currentPlayer.name} plays ${cardToPlay.rank} of ${cardToPlay.suit}`);
      const result = this.playCard(currentPlayer.id, cardToPlay);

      if (result === 'choose-suit') {
        const suitCounts = {};
        currentPlayer.hand.forEach(card => {
          if (card.suit !== 'Black' && card.suit !== 'Color' && card.suit !== 'Countdown') {
            suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
          }
        });
        let chosenSuit = '♥';
        let maxCount = 0;
        for (const suit in suitCounts) {
          if (suitCounts[suit] > maxCount) {
            maxCount = suitCounts[suit];
            chosenSuit = suit;
          }
        }
        console.log(`AI ${currentPlayer.name} chose suit ${chosenSuit}`);
        this.pendingSuitChange.card.suit = chosenSuit;
        this.pendingSuitChange = null;
        return { action: 'play_and_choose_suit', card: cardToPlay, chosenSuit };
      }
      return { action: 'play', card: cardToPlay, result };
    } else {
      console.log(`AI ${currentPlayer.name} has no cards to play and draws.`);
      this.drawCard(currentPlayer.id);
      return { action: 'draw' };
    }
  }
}

module.exports = Game;