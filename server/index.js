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

    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    const playerHand = deck.splice(0, 7);
    const discardPile = deck.splice(0, 1);
    const drawPileSize = deck.length;

    console.log('Dealt cards, sending initial game state');
    socket.emit('game-state-update', { 
      playerHand,
      discardPile,
      drawPileSize
    });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});