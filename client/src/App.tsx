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
  currentPlayerId: string;
}

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [drawPileSize, setDrawPileSize] = useState<number>(0);

  console.log('Render: myPlayerId=', myPlayerId, 'currentPlayerId=', currentPlayerId, 'isMyTurn=', myPlayerId === currentPlayerId);

  
  const socketRef = React.useRef<Socket | null>(null);

  useEffect(() => {
    
    const socket: Socket = io('http://localhost:4000');
    socketRef.current = socket; 
    console.log('useEffect: Socket created. Initial socket.id=', socket.id);

    
    setIsConnected(socket.connected);

    function onConnect() {
      console.log('Socket connected! socket.id=', socket.id);
      setIsConnected(true);
      setMyPlayerId(socket.id ?? null); 
    }

    function onDisconnect() {
      console.log('Socket disconnected!');
      setIsConnected(false);
      setMyPlayerId(null); 
    }

    function onGameStateUpdate(gameState: GameState) {
      console.log('Received game-state-update event:', gameState);
      setPlayerHand(gameState.playerHand);
      setDiscardPile(gameState.discardPile);
      setDrawPileSize(gameState.drawPileSize);
      setCurrentPlayerId(gameState.currentPlayerId);
    }

    
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('game-state-update', onGameStateUpdate);

    
    socket.onAny((event, ...args) => {
      console.log(`Received event: ${event}`, args);
    });

    
    return () => {
      console.log('Cleaning up socket. useEffect cleanup called.');
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('game-state-update', onGameStateUpdate);
      socket.disconnect();
    };
  }, []); 

  const isMyTurn = myPlayerId === currentPlayerId; 

  const handlePlayCard = (card: Card) => {
    if (!isMyTurn) { 
      console.log('Not your turn to play.');
      return;
    }
    if (socketRef.current) {
      console.log('Playing card:', card);
      socketRef.current.emit('play-card', card);
    } else {
      console.error('Socket not connected when trying to play card.');
    }
  };

  const handleDrawCard = () => {
    if (!isMyTurn) { 
      console.log('Not your turn to draw.');
      return;
    }
    if (socketRef.current) {
      console.log('Drawing card from pile.');
      socketRef.current.emit('draw-card');
    } else {
      console.error('Socket not connected when trying to draw card.');
    }
  };

  const startGame = () => {
    if (socketRef.current) {
      console.log('Start Game button clicked. Emitting start-game event.');
      
      setPlayerHand([]);
      setDiscardPile([]);
      setDrawPileSize(0);
      socketRef.current.emit('start-game');
    } else {
      console.error('Socket not connected when trying to start game.');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Unus Cado</h1>
        <p>Server Connection Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
        <p>
          {isConnected && myPlayerId && currentPlayerId && (
            isMyTurn ? 'Your Turn!' : 'Opponent\'s Turn' 
          )}
        </p>
        <button onClick={startGame} disabled={!isConnected}>
          Start Game
        </button>
      </header>
      <div className="Game-board">
        <div className="Player-hand">
          <h2>My Hand ({playerHand.length} cards)</h2>
          <div className="Card-list">
            {playerHand.map((card, index) => (
              <div key={index} className="Card" onClick={() => handlePlayCard(card)} style={{ cursor: isMyTurn ? 'pointer' : 'not-allowed' }}>
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

        <div className="Draw-pile" onClick={handleDrawCard} style={{ cursor: isMyTurn ? 'pointer' : 'not-allowed' }}>
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
