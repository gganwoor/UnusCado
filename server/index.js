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

app.get('/', (req, res) => {
  res.send('<h1>Unus Cado Server</h1>');
});

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  let playerHand = [];
  let discardPile = [];
  let drawPile = [];
  let currentPlayerId = socket.id; // For single player, it's always their turn

  socket.on('start-game', () => {
    console.log('Received start-game event from:', socket.id);
    const suits = ['♥', '♦', '♣', '♠'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    let deck = [];
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ suit, rank });
      }
    }

    // Shuffle deck (Fisher-Yates shuffle)
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    playerHand = deck.splice(0, 7);
    discardPile = deck.splice(0, 1);
    drawPile = deck;

    currentPlayerId = socket.id; // Ensure it's this player's turn

    console.log('Dealt cards, sending initial game state');
    socket.emit('game-state-update', { 
      playerHand,
      discardPile,
      drawPileSize: drawPile.length,
      currentPlayerId: currentPlayerId // Include turn info
    });
  });

  socket.on('play-card', (cardToPlay) => {
    if (socket.id !== currentPlayerId) {
      console.log(`Not player ${socket.id}'s turn to play.`);
      return; // Not their turn
    }

    console.log(`Player ${socket.id} wants to play:`, cardToPlay);
    const cardIndex = playerHand.findIndex(card => card.suit === cardToPlay.suit && card.rank === cardToPlay.rank);

    if (cardIndex > -1) {
      const playedCard = playerHand.splice(cardIndex, 1)[0];
      discardPile.unshift(playedCard);

      console.log(`Player ${socket.id} played:`, playedCard);
      // Advance turn (for single player, it's always their turn again)
      currentPlayerId = socket.id; 

      socket.emit('game-state-update', {
        playerHand,
        discardPile,
        drawPileSize: drawPile.length,
        currentPlayerId: currentPlayerId // Include updated turn info
      });
    } else {
      console.log(`Invalid move: Card ${cardToPlay.rank}${cardToPlay.suit} not found in player's hand.`);
    }
  });

  socket.on('draw-card', () => {
    if (socket.id !== currentPlayerId) {
      console.log(`Not player ${socket.id}'s turn to draw.`);
      return; // Not their turn
    }

    console.log(`Player ${socket.id} wants to draw a card.`);
    if (drawPile.length > 0) {
      const drawnCard = drawPile.shift();
      playerHand.push(drawnCard);

      console.log(`Player ${socket.id} drew:`, drawnCard);
      // Advance turn (for single player, it's always their turn again)
      currentPlayerId = socket.id;

      socket.emit('game-state-update', {
        playerHand,
        discardPile,
        drawPileSize: drawPile.length,
        currentPlayerId: currentPlayerId // Include updated turn info
      });
    } else {
      console.log(`Draw pile is empty for player ${socket.id}.`);
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});