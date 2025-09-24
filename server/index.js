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
  let currentPlayerId = socket.id; 
  let attackStack = 0;

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

    playerHand = deck.splice(0, 7);
    discardPile = deck.splice(0, 1);
    drawPile = deck;

    currentPlayerId = socket.id; 
    attackStack = 0;

    console.log('Dealt cards, sending initial game state');
    socket.emit('game-state-update', { 
      playerHand,
      discardPile,
      drawPileSize: drawPile.length,
      currentPlayerId: currentPlayerId,
      attackStack: attackStack 
    });
  });

  socket.on('play-card', (cardToPlay) => {
    if (socket.id !== currentPlayerId) {
      console.log(`Not player ${socket.id}'s turn to play.`);
      return; 
    }

    console.log(`Player ${socket.id} wants to play:`, cardToPlay);
    const cardIndex = playerHand.findIndex(card => card.suit === cardToPlay.suit && card.rank === cardToPlay.rank);

    if (cardIndex > -1) {
      const topDiscardCard = discardPile[0]; 

      
      if (cardToPlay.rank === topDiscardCard.rank || cardToPlay.suit === topDiscardCard.suit) {
        const playedCard = playerHand.splice(cardIndex, 1)[0]; 
        discardPile.unshift(playedCard); 

        
        
        if (playedCard.rank === '7') {
          console.log(`7 played! Changing suit to Spades (♠).`);
          playedCard.suit = '♠'; 
        } else if (playedCard.rank === 'K') {
          console.log(`King played! Player ${socket.id} acts again.`);
          
        } else if (playedCard.rank === 'J') {
          console.log(`Jack played! Next player's turn is skipped.`);
          
        } else if (playedCard.rank === 'Q') {
          console.log(`Queen played! Game direction reversed.`);
          
        } else if (playedCard.rank === '2') {
          attackStack += 2;
          console.log(`2 played! Attack stack is now: ${attackStack}`);
        } else if (playedCard.rank === 'A') {
          attackStack += 3;
          console.log(`Ace played! Attack stack is now: ${attackStack}`);
        }

        console.log(`Player ${socket.id} played:`, playedCard);
        
        currentPlayerId = socket.id; 

        socket.emit('game-state-update', {
          playerHand,
          discardPile,
          drawPileSize: drawPile.length,
          currentPlayerId: currentPlayerId,
          attackStack: attackStack 
        });
      } else {
        console.log(`Invalid move: Card ${cardToPlay.rank}${cardToPlay.suit} does not match top discard card ${topDiscardCard.rank}${topDiscardCard.suit}.`);
        
        socket.emit('game-state-update', {
          playerHand,
          discardPile,
          drawPileSize: drawPile.length,
          currentPlayerId: currentPlayerId,
          attackStack: attackStack 
        });
      }
    } else {
      console.log(`Invalid move: Card ${cardToPlay.rank}${cardToPlay.suit} not found in player's hand.`);
      
      socket.emit('game-state-update', {
        playerHand,
        discardPile,
        drawPileSize: drawPile.length,
        currentPlayerId: currentPlayerId
      });
    }
  });

  socket.on('draw-card', () => {
    if (socket.id !== currentPlayerId) {
      console.log(`Not player ${socket.id}'s turn to draw.`);
      return; 
    }

    console.log(`Player ${socket.id} wants to draw a card.`);
    if (drawPile.length > 0) {
      let cardsToDraw = 1;
      if (attackStack > 0) {
        cardsToDraw = attackStack;
        console.log(`Player ${socket.id} drawing ${cardsToDraw} cards due to attack stack.`);
      }

      for (let i = 0; i < cardsToDraw; i++) {
        if (drawPile.length > 0) {
          const drawnCard = drawPile.shift();
          playerHand.push(drawnCard);
        } else {
          console.log(`Draw pile is empty, cannot draw more cards.`);
          break;
        }
      }
      attackStack = 0;

      console.log(`Player ${socket.id} drew cards.`);
      
      currentPlayerId = socket.id;

      socket.emit('game-state-update', {
        playerHand,
        discardPile,
        drawPileSize: drawPile.length,
        currentPlayerId: currentPlayerId,
        attackStack: attackStack 
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