const Game = require('./Game.js');

class GameDev extends Game {
  startGame() {
    this.updateLastActivity();

    if (this.players.length === 0) {
      return super.startGame();
    }

    console.log('--- SPECIAL DEBUG SCENARIO: PLAY COUNTDOWN ON JOKER TEST ---');

    this.players[0].hand = [
        { suit: 'Countdown', rank: '2', color: 'Gray', isCountdown: true },
        { suit: 'Countdown', rank: '0', color: 'Gray', isCountdown: true },
        { suit: '♥', rank: '7', color: 'Red' } 
    ];
    
    for (let i = 1; i < this.players.length; i++) {
        this.players[i].hand = [];
    }

    this.discardPile = [{ suit: 'Color', rank: 'Joker', color: 'Red' }];
    
    this.attackStack = 0;

    this.currentPlayerIndex = 0;
    this.direction = 1;
    this.drawPile = [{ suit: '♥', rank: 'K', color: 'Red' }];
    this.pendingSuitChange = null;
    this.countdownState = { ownerId: null, number: null };

    console.log('A Joker is on the discard pile. It is your turn.');
    console.log('You should be able to play the Countdown \'2\' card, but not the Countdown \'0\' card.');
  }
}

module.exports = GameDev;
