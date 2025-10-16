const Game = require('./Game.js');

class GameDev extends Game {
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

    this.players.forEach((p, index) => {
      if (index === 0) {
        p.hand = this.deck.filter(c => c.isCountdown && c.rank === '3');
        p.hand.push(...this.deck.splice(0, 6));
      } else if (index === 1) {
        p.hand = [
          { suit: '♥', rank: 'A', color: 'Red' },
          { suit: '♦', rank: '2', color: 'Red' },
          { suit: '♣', rank: '3', color: 'Black' },
          { suit: '♠', rank: '4', color: 'Black' },
        ];
        p.hand.push(...this.deck.splice(0, 3));
      } else {
        p.hand = this.deck.splice(0, 7);
      }
    });

    this.discardPile = this.deck.splice(0, 1);
    this.drawPile = this.deck;
    this.currentPlayerIndex = 0;
    this.attackStack = 0;
    this.direction = 1;
    this.pendingSuitChange = null;
    this.countdownState = { ownerId: null, number: null };
  }
}

module.exports = GameDev;