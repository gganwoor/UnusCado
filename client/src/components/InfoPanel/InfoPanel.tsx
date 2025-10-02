import React from 'react';
import './InfoPanel.scss';


interface PlayerInfo {
  id: string;
  name: string;
  handSize: number;
}

interface InfoPanelProps {
  gameId: string | null;
  isConnected: boolean;
  myPlayerId: string | null;
  currentPlayerId: string | null;
  players: PlayerInfo[];
  attackStack: number;
  winnerId: string | null;
  onStartGame: () => void;
  isMyTurn: boolean;
}

const InfoPanel: React.FC<InfoPanelProps> = ({
  gameId,
  isConnected,
  myPlayerId,
  currentPlayerId,
  players,
  attackStack,
  winnerId,
  onStartGame,
  isMyTurn,
}) => {
  return (
    <header className="App-header">
      <div className="info-panel">
        <h1>Unus Cado</h1>
        {gameId && <p className="game-id">Game ID: {gameId}</p>}
        {isConnected && myPlayerId && players.length > 0 && (
          <p>You are: {players.find(p => p.id === myPlayerId)?.name}</p>
        )}
        <p>
          {isConnected && myPlayerId && currentPlayerId && (
            isMyTurn ? 'Your Turn!' : `It's ${players.find(p => p.id === currentPlayerId)?.name}'s Turn`
          )}
        </p>
        <p>Attack Stack: {attackStack}</p>
        <button onClick={onStartGame} disabled={!isConnected || winnerId !== null}>
          Start Game
        </button>
        {winnerId && myPlayerId === winnerId && (
          <h2>You Win!</h2>
        )}
        {winnerId && myPlayerId !== winnerId && (
          <h2>Game Over! Winner: {players.find(p => p.id === winnerId)?.name}</h2>
        )}
      </div>
    </header>
  );
};

export default InfoPanel;