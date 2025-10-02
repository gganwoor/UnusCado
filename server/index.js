const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const Game = require('./src/Game');

const app = express();
const server = http.createServer(app);
const allowedOrigins = ["http://localhost:3000", "http://localhost:3001"];
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 4000;

const games = {};

const generateGameId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

app.get('/', (req, res) => {
  res.send('<h1>Unus Cado Server</h1>');
});

io.on('connection', (socket) => {
  console.log(`A user connected: ${socket.id}`);

  socket.on('create-game', ({ playerName }) => {
    let gameId = generateGameId();
    while(games[gameId]) {
        gameId = generateGameId();
    }
    const game = new Game(gameId);
    games[gameId] = game;

    socket.join(gameId);
    socket.gameId = gameId;
    game.addPlayer(socket.id, playerName || `Player 1`);
    
    console.log(`Player ${socket.id} created game ${gameId}`);
    socket.emit('game-created', { gameId });
    socket.emit('game-state-update', game.getGameStateForPlayer(socket.id));
  });

  socket.on('join-game', ({ gameId, playerName }) => {
    const game = games[gameId];
    if (!game) {
      return socket.emit('unknown-game');
    }

    socket.join(gameId);
    socket.gameId = gameId;
    game.addPlayer(socket.id, playerName || `Player ${game.players.length + 1}`);

    console.log(`Player ${socket.id} joined game ${gameId}`);
    
    game.players.forEach(p => {
      io.to(p.id).emit('game-state-update', game.getGameStateForPlayer(p.id));
    });
  });

  socket.on('start-game', () => {
    const gameId = socket.gameId;
    const game = games[gameId];
    if (!game) return;

    game.startGame();
    game.players.forEach(p => {
      io.to(p.id).emit('game-state-update', game.getGameStateForPlayer(p.id));
    });
  });

  socket.on('play-card', (cardToPlay) => {
    const gameId = socket.gameId;
    const game = games[gameId];
    if (!game) return;

    const result = game.playCard(socket.id, cardToPlay);

    if (result === 'choose-suit') {
      socket.emit('choose-suit');
    } else if (result) {
      game.players.forEach(p => {
        io.to(p.id).emit('game-state-update', game.getGameStateForPlayer(p.id));
      });

      if (game.checkWinCondition(socket.id)) {
        io.to(gameId).emit('game-over', { winnerId: socket.id });
      }
    } else {
      socket.emit('game-state-update', game.getGameStateForPlayer(socket.id));
    }
  });

  socket.on('suit-chosen', ({ chosenSuit }) => {
    const gameId = socket.gameId;
    const game = games[gameId];
    if (!game) return;

    if (game.pendingSuitChange && game.pendingSuitChange.playerId === socket.id) {
      const { card } = game.pendingSuitChange;
      card.suit = chosenSuit;
      game.pendingSuitChange = null;
      game.advanceTurn();

      game.players.forEach(p => {
        io.to(p.id).emit('game-state-update', game.getGameStateForPlayer(p.id));
      });

      if (game.checkWinCondition(socket.id)) {
        io.to(gameId).emit('game-over', { winnerId: socket.id });
      }
    } else {
      socket.emit('game-state-update', game.getGameStateForPlayer(socket.id));
    }
  });

  socket.on('draw-card', () => {
    const gameId = socket.gameId;
    const game = games[gameId];
    if (!game) return;

    if (game.drawCard(socket.id)) {
      game.players.forEach(p => {
        io.to(p.id).emit('game-state-update', game.getGameStateForPlayer(p.id));
      });
    } else {
      socket.emit('game-state-update', game.getGameStateForPlayer(socket.id));
    }
  });

  socket.on('disconnect', () => {
    console.log(`A user disconnected: ${socket.id}`);
    const gameId = socket.gameId;
    if (!gameId) return;

    const game = games[gameId];
    if (!game) return;

    const disconnectedPlayerIndex = game.players.findIndex(p => p.id === socket.id);
    if (disconnectedPlayerIndex === -1) return;

    const wasCurrentPlayer = game.currentPlayerIndex === disconnectedPlayerIndex;
    
    game.removePlayer(socket.id);

    if (game.players.length === 0) {
      console.log(`Game ${gameId} is empty, deleting.`);
      delete games[gameId];
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