const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"], // Allow requests from our React client
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

    // Shuffle deck (Fisher-Yates shuffle)
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    console.log('Game started, sending deck to client');
    socket.emit('game-started', deck);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
