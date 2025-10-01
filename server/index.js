const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const Game = require('./src/Game');

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
      const { card } = game.pendingSuitChange;
      card.suit = chosenSuit;
      game.pendingSuitChange = null;
      game.advanceTurn();

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