const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 4000;

const games = {};
const players = {};

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
      players: this.players.map(p => ({ id: p.id, name: p.name, handSize: p.hand.length }))
    };
  }

  startGame() {
    const suits = ['♥', '♦', '♣', '♠'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    this.deck = [];
    for (const suit of suits) {
      for (const rank of ranks) {
        this.deck.push({ suit, rank });
      }
    }
    this.deck.push({ suit: 'Black', rank: 'Joker' });
    this.deck.push({ suit: 'Color', rank: 'Joker' });

    
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
  }

  applySpecialCardEffect(playedCard, socketId) {
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

    const cardIndex = player.hand.findIndex(card => card.suit === cardToPlay.suit && card.rank === cardToPlay.rank);

    if (cardIndex > -1) {
      const topDiscardCard = this.discardPile[0];

      if (cardToPlay.rank === 'Joker' || topDiscardCard.rank === 'Joker' || cardToPlay.rank === topDiscardCard.rank || cardToPlay.suit === topDiscardCard.suit) {
        const playedCard = player.hand.splice(cardIndex, 1)[0];
        this.discardPile.unshift(playedCard);

        if (playedCard.rank === '7') {
          this.pendingSuitChange = { card: playedCard, playerId: socketId };
          return 'choose-suit';
        }

        this.applySpecialCardEffect(playedCard, socketId);

        if (playedCard.rank !== 'K' && playedCard.rank !== 'A') { 
          this.advanceTurn();
        }

        return true;
      } else {
        return false;
      }
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
      }

      for (let i = 0; i < cardsToDraw; i++) {
        if (this.drawPile.length > 0) {
          const drawnCard = this.drawPile.shift();
          player.hand.push(drawnCard);
        } else {
          break;
        }
      }
      this.attackStack = 0;

      this.advanceTurn();
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
  }

  checkWinCondition(socketId) {
    const player = this.players.find(p => p.id === socketId);
    return player && player.hand.length === 0;
  }
}

app.get('/', (req, res) => {
  res.send('<h1>Unus Cado Server</h1>');
});

io.on('connection', (socket) => {
  const GAME_ID = 'defaultGame';
  if (!games[GAME_ID]) {
    games[GAME_ID] = new Game(GAME_ID);
  }
  const game = games[GAME_ID];

  const playerName = `Player ${game.players.length + 1}`;
  game.addPlayer(socket.id, playerName);
  players[socket.id] = { gameId: GAME_ID, name: playerName };
  socket.join(GAME_ID);

  socket.emit('game-state-update', game.getGameStateForPlayer(socket.id));

  socket.on('start-game', () => {
    game.startGame();
    game.players.forEach(p => {
      io.to(p.id).emit('game-state-update', game.getGameStateForPlayer(p.id));
    });
  });

  socket.on('play-card', (cardToPlay) => {
    const result = game.playCard(socket.id, cardToPlay);

    if (result === 'choose-suit') {
      socket.emit('choose-suit');
    } else if (result) {
      game.players.forEach(p => {
        io.to(p.id).emit('game-state-update', game.getGameStateForPlayer(p.id));
      });

      if (game.checkWinCondition(socket.id)) {
        io.to(GAME_ID).emit('game-over', { winnerId: socket.id });
      }
    } else {
      socket.emit('game-state-update', game.getGameStateForPlayer(socket.id));
    }
  });

  socket.on('suit-chosen', ({ chosenSuit }) => {
          if (game.pendingSuitChange && game.pendingSuitChange.playerId === socket.id) {
            const { card, playerId } = game.pendingSuitChange;
            card.suit = chosenSuit;
            game.pendingSuitChange = null;
            game.advanceTurn();
    
            game.players.forEach(p => {
              io.to(p.id).emit('game-state-update', game.getGameStateForPlayer(p.id));
            });
    
            if (game.checkWinCondition(socket.id)) {
              io.to(GAME_ID).emit('game-over', { winnerId: socket.id });
            }
          } else {      socket.emit('game-state-update', game.getGameStateForPlayer(socket.id));
    }
  });

  socket.on('draw-card', () => {
    if (game.drawCard(socket.id)) {
      game.players.forEach(p => {
        io.to(p.id).emit('game-state-update', game.getGameStateForPlayer(p.id));
      });
    } else {
      socket.emit('game-state-update', game.getGameStateForPlayer(socket.id));
    }
  });

  socket.on('disconnect', () => {
    const disconnectedPlayerIndex = game.players.findIndex(p => p.id === socket.id);
    if (disconnectedPlayerIndex === -1) return;

    const wasCurrentPlayer = game.currentPlayerIndex === disconnectedPlayerIndex;
    
    game.removePlayer(socket.id);
    delete players[socket.id];

    if (game.players.length === 0) {
      delete games[GAME_ID];
      return; 
    }

    if (disconnectedPlayerIndex < game.currentPlayerIndex) {
      game.currentPlayerIndex--;
    }

    if (wasCurrentPlayer) {
      game.currentPlayerIndex = game.currentPlayerIndex % game.players.length;
    }
    
    game.currentPlayerIndex = (game.currentPlayerIndex + game.players.length) % game.players.length;

    game.players.forEach(p => {
      io.to(p.id).emit('game-state-update', game.getGameStateForPlayer(p.id));
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});