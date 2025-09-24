import React, { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import './App.css';
import Card from './components/Card';


interface CardData {
  suit: string;
  rank: string;
}

interface PlayerInfo {
  id: string;
  name: string;
  handSize: number;
}

interface GameState {
  gameId: string;
  myPlayerId: string;
  playerHand: CardData[];
  discardPile: CardData[];
  drawPileSize: number;
  currentPlayerId: string; 
  attackStack: number; 
  players: PlayerInfo[];
}

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null); 
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null); 
  const [playerHand, setPlayerHand] = useState<CardData[]>([]);
  const [discardPile, setDiscardPile] = useState<CardData[]>([]);
  const [drawPileSize, setDrawPileSize] = useState<number>(0);
  const [attackStack, setAttackStack] = useState<number>(0); 
  const [winnerId, setWinnerId] = useState<string | null>(null); 
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [showSuitChooser, setShowSuitChooser] = useState(false);
  const [pendingSuitChangeCard, setPendingSuitChangeCard] = useState<CardData | null>(null);

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
      console.log('DEBUG: gameState.players:', gameState.players);
      setMyPlayerId(gameState.myPlayerId); 
      setPlayerHand(gameState.playerHand);
      setDiscardPile(gameState.discardPile);
      setDrawPileSize(gameState.drawPileSize);
      setCurrentPlayerId(gameState.currentPlayerId);
      setAttackStack(gameState.attackStack); 
      setWinnerId(null); 
      setPlayers(gameState.players);
      setShowSuitChooser(false); 
      setPendingSuitChangeCard(null); 
    }

    function onGameOver(data: { winnerId: string }) {
      console.log('Game Over! Winner:', data.winnerId);
      setWinnerId(data.winnerId);
    }

    function onChooseSuit() {
      console.log('Server requested suit choice.');
      setShowSuitChooser(true);
    }

    
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('game-state-update', onGameStateUpdate);
    socket.on('game-over', onGameOver); 
    socket.on('choose-suit', onChooseSuit);

    
    socket.onAny((event, ...args) => {
      console.log(`Received event: ${event}`, args);
    });

    
    return () => {
      console.log('Cleaning up socket. useEffect cleanup called.');
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('game-state-update', onGameStateUpdate);
      socket.off('game-over', onGameOver); 
      socket.off('choose-suit', onChooseSuit);
      socket.disconnect();
    };
  }, []); 

  const isMyTurn = myPlayerId === currentPlayerId; 

  const handlePlayCard = (card: CardData) => {
    if (!isMyTurn) { 
      console.log('Not your turn to play.');
      return;
    }
    if (socketRef.current) {
      if (card.rank === '7') {
        setPendingSuitChangeCard(card);
        socketRef.current.emit('play-card', card); 
      } else {
        console.log('Playing card:', card);
        socketRef.current.emit('play-card', card);
      }
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

  const handleSuitChoice = (chosenSuit: string) => {
    if (socketRef.current && pendingSuitChangeCard) {
      console.log(`Choosing suit ${chosenSuit} for ${pendingSuitChangeCard.rank}`);
      socketRef.current.emit('suit-chosen', { chosenSuit });
      setShowSuitChooser(false);
      setPendingSuitChangeCard(null);
    }
  };

  const startGame = () => {
    if (socketRef.current) {
      console.log('Start Game button clicked. Emitting start-game event.');
      
      setPlayerHand([]);
      setDiscardPile([]);
      setDrawPileSize(0);
      setWinnerId(null); 
      setPlayers([]);
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
            isMyTurn ? 'Your Turn!' : `It's ${players.find(p => p.id === currentPlayerId)?.name}'s Turn` 
          )}
        </p>
        <p>Attack Stack: {attackStack}</p>
        {myPlayerId && players.length > 0 && (
          <p>You are: {players.find(p => p.id === myPlayerId)?.name}</p>
        )}
        <button onClick={startGame} disabled={!isConnected || winnerId !== null}>
          Start Game
        </button>
        {winnerId && myPlayerId === winnerId && (
          <h2>You Win!</h2>
        )}
        {winnerId && myPlayerId !== winnerId && (
          <h2>Game Over! Winner: {players.find(p => p.id === winnerId)?.name}</h2> 
        )}
      </header>
      <div className="Game-board">
        <div className="Other-players">
          {players.filter(p => p.id !== myPlayerId).map(p => (
            <div key={p.id} className="Other-player-info">
              <h3>{p.name} ({p.handSize} cards)</h3>
              <div className="Card-list">
                {Array.from({ length: p.handSize }).map((_, i) => (
                  <Card key={i} suit="" rank="" isFaceDown={true} className="small-card" />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="Discard-pile">
          <h2>Discard Pile</h2>
          <div className="Card-list">
            {discardPile.length > 0 ? (
              <Card suit={discardPile[0].suit} rank={discardPile[0].rank} />
            ) : (
              <Card suit="" rank="" className="empty" />
            )}
          </div>
        </div>

        <div className="Draw-pile" onClick={handleDrawCard} style={{ cursor: isMyTurn ? 'pointer' : 'not-allowed' }}>
          <h2>Draw Pile ({drawPileSize} cards)</h2>
          {drawPileSize > 0 ? (
            <Card suit="" rank="" isFaceDown={true} />
          ) : (
            <Card suit="" rank="" className="empty" />
          )}
        </div>

        <div className="Player-hand">
          <h2>My Hand ({playerHand.length} cards)</h2>
          <div className="Card-list">
            {playerHand.map((card, index) => (
              <Card key={index} suit={card.suit} rank={card.rank} onClick={() => handlePlayCard(card)} className={isMyTurn ? '' : 'not-my-turn'} />
            ))}
          </div>
        </div>

        {showSuitChooser && (
          <div className="suit-chooser-overlay">
            <div className="suit-chooser">
              <h3>Choose a Suit for {pendingSuitChangeCard?.rank}</h3>
              <button onClick={() => handleSuitChoice('♥')}>♥ Hearts</button>
              <button onClick={() => handleSuitChoice('♦')}>♦ Diamonds</button>
              <button onClick={() => handleSuitChoice('♣')}>♣ Clubs</button>
              <button onClick={() => handleSuitChoice('♠')}>♠ Spades</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;