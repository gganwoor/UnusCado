import React, { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import './App.css';

interface Card {
  suit: string;
  rank: string;
}

interface GameState {
  playerHand: Card[];
  discardPile: Card[];
  drawPileSize: number;
}

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [drawPileSize, setDrawPileSize] = useState<number>(0);

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

    function onGameStateUpdate(gameState: GameState) {
      console.log('Received game-state-update event:', gameState);
      setPlayerHand(gameState.playerHand);
      setDiscardPile(gameState.discardPile);
      setDrawPileSize(gameState.drawPileSize);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('game-state-update', onGameStateUpdate);

    socket.onAny((event, ...args) => {
      console.log(`Received event: ${event}`, args);
    });

    const startGame = () => {
      console.log('Start Game button clicked. Emitting start-game event.');
      setPlayerHand([]);
      setDiscardPile([]);
      setDrawPileSize(0);
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
      socket.off('game-state-update', onGameStateUpdate);
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
        <div className="Player-hand">
          <h2>My Hand ({playerHand.length} cards)</h2>
          <div className="Card-list">
            {playerHand.map((card, index) => (
              <div key={index} className="Card">
                {card.rank}{card.suit}
              </div>
            ))}
          </div>
        </div>

        <div className="Discard-pile">
          <h2>Discard Pile</h2>
          <div className="Card-list">
            {discardPile.length > 0 ? (
              <div className="Card">
                {discardPile[0].rank}{discardPile[0].suit}
              </div>
            ) : (
              <div className="Card empty">Empty</div>
            )}
          </div>
        </div>

        <div className="Draw-pile">
          <h2>Draw Pile ({drawPileSize} cards)</h2>
          {drawPileSize > 0 ? (
            <div className="Card back">Draw</div>
          ) : (
            <div className="Card empty">Empty</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;