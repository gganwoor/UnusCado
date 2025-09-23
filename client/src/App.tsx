import React, { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import './App.css';


interface Card {
  suit: string;
  rank: string;
}

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [deck, setDeck] = useState<Card[]>([]);

  useEffect(() => {
    
    const socket: Socket = io('http://localhost:4000');

    function onConnect() {
      console.log('Socket connected!');
      setIsConnected(true);
    }

    function onDisconnect() {
      console.log('Socket disconnected!');
      setIsConnected(false);
    }

    function onGameStarted(newDeck: Card[]) {
      console.log('Received game-started event with deck:', newDeck);
      setDeck(newDeck);
    }

    
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('game-started', onGameStarted);

    
    socket.onAny((event, ...args) => {
      console.log(`Received event: ${event}`, args);
    });

    
    const startGame = () => {
      console.log('Start Game button clicked. Emitting start-game event.');
      socket.emit('start-game');
    };

    
    const startButton = document.getElementById('start-game-btn');
    if (startButton) {
      startButton.addEventListener('click', startGame);
    }

    
    return () => {
      console.log('Cleaning up socket...');
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('game-started', onGameStarted);
      if (startButton) {
        startButton.removeEventListener('click', startGame);
      }
      socket.disconnect();
    };
  }, []); 

  return (
    <div className="App">
      <header className="App-header">
        <h1>Unus Cado</h1>
        <p>Server Connection Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
        <button id="start-game-btn" disabled={!isConnected}>
          Start Game
        </button>
      </header>
      <div className="Game-board">
        <h2>Deck ({deck.length} cards)</h2>
        <div className="Card-list">
          {deck.map((card, index) => (
            <div key={index} className="Card">
              {card.rank}{card.suit}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;