import React, { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import './App.scss';
import Card from './components/Card';
import InfoPanel from './components/InfoPanel/InfoPanel';
import PlayerHand from './components/PlayerHand/PlayerHand';

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

  
  const socketRef = React.useRef<Socket | null>(null);

  useEffect(() => {
    
    const socket: Socket = io('http://localhost:4000');
    socketRef.current = socket; 

    
    setIsConnected(socket.connected);

    function onConnect() {
      setIsConnected(true);
      setMyPlayerId(socket.id ?? null); 
    }

    function onDisconnect() {
      setIsConnected(false);
      setMyPlayerId(null); 
    }

    function onGameStateUpdate(gameState: GameState) {
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
      setWinnerId(data.winnerId);
    }

    function onChooseSuit() {
      setShowSuitChooser(true);
    }

    
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('game-state-update', onGameStateUpdate);
    socket.on('game-over', onGameOver); 
    socket.on('choose-suit', onChooseSuit);

    
    socket.onAny((event, ...args) => {
      
    });

    
    return () => {
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
      return;
    }
    if (socketRef.current) {
      if (card.rank === '7') {
        setPendingSuitChangeCard(card);
        socketRef.current.emit('play-card', card); 
      } else {
        socketRef.current.emit('play-card', card);
      }
    } else {
      console.error('Socket not connected when trying to play card.');
    }
  };

  const handleDrawCard = () => {
    if (!isMyTurn) { 
      return;
    }
    if (socketRef.current) {
      socketRef.current.emit('draw-card');
    } else {
      console.error('Socket not connected when trying to draw card.');
    }
  };

  const handleSuitChoice = (chosenSuit: string) => {
    if (socketRef.current && pendingSuitChangeCard) {
      socketRef.current.emit('suit-chosen', { chosenSuit });
      setShowSuitChooser(false);
      setPendingSuitChangeCard(null);
    }
  };

  const startGame = () => {
    if (socketRef.current) {
      
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
      <InfoPanel
        isConnected={isConnected}
        myPlayerId={myPlayerId}
        currentPlayerId={currentPlayerId}
        players={players}
        attackStack={attackStack}
        winnerId={winnerId}
        onStartGame={startGame}
        isMyTurn={isMyTurn}
      />
      <div className="Game-board">
        <div className="Other-players">
          {players.filter(p => p.id !== myPlayerId).map(p => (
            <div key={p.id} className="Other-player-info">
              <div className="Card-list">
                {Array.from({ length: p.handSize }).map((_, i) => (
                  <Card key={i} suit="" rank="" isFaceDown={true} className="small-card" />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="Discard-pile">
          {discardPile.length > 0 ? (
            <Card suit={discardPile[0].suit} rank={discardPile[0].rank} />
          ) : (
            <Card suit="" rank="" className="empty" />
          )}
        </div>

        <div className="Draw-pile" onClick={handleDrawCard} style={{ cursor: isMyTurn ? 'pointer' : 'not-allowed' }}>
          <div className="Card-list draw-pile-stack">
            {Array.from({ length: drawPileSize }).map((_, i) => (
              <Card 
                key={i} 
                suit="" 
                rank="" 
                isFaceDown={true} 
                className="stacked-card" 
                style={{ top: `${i * -1}px`, left: `${i * 1}px`, zIndex: i + 1 }}
              />
            ))}
            {drawPileSize === 0 && (
              <Card suit="" rank="" className="empty" />
            )}
          </div>
        </div>

        <PlayerHand 
          hand={playerHand} 
          isMyTurn={isMyTurn} 
          onPlayCard={handlePlayCard} 
        />

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