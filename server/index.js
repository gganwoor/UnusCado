console.log('\n--- GEMINI AGENT MODIFIED THIS FILE ---\n');
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const isDevMode = process.env.NODE_ENV === 'development';

const Game = isDevMode
  ? require('./src/Game.dev')
  : require('./src/Game');

const gameManager = require('./src/GameManager');

if (isDevMode) {
  console.log('\n!!! DEVELOPMENT MODE ACTIVE !!!');
  console.log('!!! Using Game.dev.js with fixed card hands for testing. !!!\n');
}

const app = express();
const server = http.createServer(app);
const allowedOrigins = ["http://localhost:3000", "http://localhost:3001"];
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

const io = new Server(server, {
  pingTimeout: 20000,
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.send('<h1>Unus Cado Server</h1>');
});

const notifyGameStateUpdate = (game) => {
  if (!game) return;
  game.players.forEach(p => {
    if (!p.isAI) {
      io.to(p.id).emit('game-state-update', game.getGameStateForPlayer(p.id));
    }
  });
};

const handleTurnAdvancement = (game, lastPlayerSocketId = null, options = {}) => {
  const { skip = false } = options;

  if (lastPlayerSocketId && game.checkWinCondition(lastPlayerSocketId)) {
    notifyGameStateUpdate(game);
    setTimeout(() => {
      io.to(game.gameId).emit('game-over', { winnerId: lastPlayerSocketId });
      gameManager.endGame(game.gameId);
    }, 500);
    return;
  }

  const turnResult = game.advanceTurn(skip);
  if (turnResult === 'countdown-win') {
    notifyGameStateUpdate(game);
    setTimeout(() => {
      io.to(game.gameId).emit('game-over', { winnerId: game.countdownState.ownerId });
      gameManager.endGame(game.gameId);
    }, 500);
    return;
  }
  
  notifyGameStateUpdate(game);

  const currentPlayer = game.players[game.currentPlayerIndex];
  if (currentPlayer && currentPlayer.isAI) {
    setTimeout(() => {
      const aiMove = game.runAITurn();
      if (!aiMove) return;

      if (aiMove.result === 'countdown-win') {
        io.to(game.gameId).emit('game-over', { winnerId: currentPlayer.id });
        gameManager.endGame(game.gameId);
        return;
      }

      const isJCard = aiMove.action === 'play' && aiMove.card.rank === 'J';
      handleTurnAdvancement(game, currentPlayer.id, { skip: isJCard });
    }, 1000);
  }
};

io.on('connection', (socket) => {
  console.log(`A user connected: ${socket.id}`);

  socket.on('create-game', ({ playerName }) => {
    const game = gameManager.createGame({ isDevMode }, Game);
    const gameId = game.gameId;

    socket.join(gameId);
    socket.gameId = gameId;
    game.addPlayer(socket.id, playerName || `Player 1`);
    
    console.log(`Player ${socket.id} created game ${gameId}`);
    socket.emit('game-created', { gameId });
    notifyGameStateUpdate(game);
  });

  socket.on('join-game', ({ gameId, playerName }) => {
    const game = gameManager.getGame(gameId);
    if (!game) {
      return socket.emit('unknown-game');
    }

    socket.join(gameId);
    socket.gameId = gameId;
    game.addPlayer(socket.id, playerName || `Player ${game.players.length + 1}`);

    console.log(`Player ${socket.id} joined game ${gameId}`);
    notifyGameStateUpdate(game);
  });

  socket.on('create-single-player-game', ({ playerName }) => {
    console.log(`'create-single-player-game' event received from ${playerName}`);
    const game = gameManager.createGame({ isDevMode, mode: 'single-player' }, Game);
    const gameId = game.gameId;

    socket.join(gameId);
    socket.gameId = gameId;
    game.addPlayer(socket.id, playerName || 'Player');

    const botNames = ['Bot 1', 'Bot 2', 'Bot 3'];
    for (let i = 0; i < botNames.length; i++) {
      const botId = `ai-player-${i + 1}`;
      game.addPlayer(botId, botNames[i]);
    }

    game.startGame();

    console.log(`Single player game ${gameId} created for ${socket.id} with 3 bots.`);

    socket.emit('game-created', { gameId });
    notifyGameStateUpdate(game);

    const currentPlayer = game.players[game.currentPlayerIndex];
    if (currentPlayer && currentPlayer.isAI) {
      const isJCard = false;
      handleTurnAdvancement(game, null, { skip: isJCard });
    }
  });

  socket.on('start-game', () => {
    const game = gameManager.getGame(socket.gameId);
    if (!game) return;

    game.startGame();
    notifyGameStateUpdate(game);
  });

  socket.on('play-card', (cardToPlay) => {
    const game = gameManager.getGame(socket.gameId);
    if (!game) return;

    const result = game.playCard(socket.id, cardToPlay);

    if (result === 'countdown-win') {
      io.to(game.gameId).emit('game-over', { winnerId: socket.id });
      gameManager.endGame(game.gameId);
    } else if (result === 'choose-suit') {
      socket.emit('choose-suit');
    } else if (result === 'play-again') {
      notifyGameStateUpdate(game);
    } else if (result === true) {
      const isJCard = cardToPlay.rank === 'J';
      handleTurnAdvancement(game, socket.id, { skip: isJCard });
    } else {
      socket.emit('game-state-update', game.getGameStateForPlayer(socket.id));
    }
  });

  socket.on('suit-chosen', ({ chosenSuit }) => {
    const game = gameManager.getGame(socket.gameId);
    if (!game) return;

    if (game.pendingSuitChange && game.pendingSuitChange.playerId === socket.id) {
      game.discardPile[0].suit = chosenSuit;
      game.pendingSuitChange = null;
      handleTurnAdvancement(game, socket.id, { skip: false });
    } else {
      socket.emit('game-state-update', game.getGameStateForPlayer(socket.id));
    }
  });

  socket.on('draw-card', () => {
    const game = gameManager.getGame(socket.gameId);
    if (!game) return;

    if (game.drawCard(socket.id)) {
      handleTurnAdvancement(game, socket.id, { skip: false });
    } else {
      socket.emit('game-state-update', game.getGameStateForPlayer(socket.id));
    }
  });

  socket.on('disconnect', () => {
    console.log(`A user disconnected: ${socket.id}`);
    const gameId = socket.gameId;
    if (!gameId) return;

    const game = gameManager.getGame(gameId);
    if (!game) return;

    const isSinglePlayer = game.players.some(p => p.isAI);
    if (isSinglePlayer && !socket.id.startsWith('ai-')) {
        console.log(`Human player disconnected from single player game ${gameId}. Ending game.`);
        gameManager.endGame(gameId);
        return;
    }

    const disconnectedPlayerIndex = game.players.findIndex(p => p.id === socket.id);
    if (disconnectedPlayerIndex === -1) return;

    const wasCurrentPlayer = game.currentPlayerIndex === disconnectedPlayerIndex;
    
    game.removePlayer(socket.id);

    if (game.players.length === 0) {
      console.log(`Game ${gameId} is empty, deleting.`);
      gameManager.endGame(gameId);
      return; 
    }

    if (disconnectedPlayerIndex < game.currentPlayerIndex) {
      game.currentPlayerIndex--;
    }

    if (wasCurrentPlayer) {
      game.currentPlayerIndex = game.currentPlayerIndex % game.players.length;
    }
    
    game.currentPlayerIndex = (game.currentPlayerIndex + game.players.length) % game.players.length;

    notifyGameStateUpdate(game);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});