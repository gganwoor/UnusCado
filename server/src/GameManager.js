
const { v4: uuidv4 } = require('uuid');


class GameManager {
  constructor() {
    this.games = new Map();
    
    setInterval(this.cleanupInactiveGames.bind(this), 60 * 1000); 
  }

  createGame(options, GameClass) {
    const gameId = uuidv4();
    
    const game = new GameClass({ ...options, gameId }); 
    this.games.set(gameId, game);
    console.log(`Game created: ${gameId}`);
    return game;
  }

  getGame(gameId) {
    return this.games.get(gameId);
  }

  endGame(gameId) {
    if (this.games.has(gameId)) {
      const game = this.games.get(gameId);
      
      if (typeof game.cleanup === 'function') {
        game.cleanup();
      }
      this.games.delete(gameId);
      console.log(`Game ended: ${gameId}`);
    }
  }

  cleanupInactiveGames() {
    const now = Date.now();
    const inactiveThreshold = 15 * 60 * 1000; 
    
    console.log('Running cleanup for inactive games...');
    for (const [gameId, game] of this.games.entries()) {
      if (now - game.lastActivity > inactiveThreshold) {
        console.log(`Found inactive game ${gameId}. Cleaning up.`);
        this.endGame(gameId);
      }
    }
  }
}


module.exports = new GameManager();
