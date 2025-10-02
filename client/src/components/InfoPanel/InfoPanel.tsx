import React from 'react';
import './InfoPanel.scss';


interface PlayerInfo {
  id: string;
  name: string;
  handSize: number;
}

interface CountdownState {
  ownerId: string | null;
  number: number | null;
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
  countdownState: CountdownState | null;
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
  countdownState,
}) => {
  const countdownOwner = countdownState?.ownerId ? players.find(p => p.id === countdownState.ownerId) : null;

  return (
    <header className="App-header">
      <div className="info-panel">
        <h1>Unus Cado</h1>
        {gameId && <p className="game-id">Game ID: {gameId}</p>}
        {countdownState && countdownState.number !== null && (
          <p className="countdown-status">
            Countdown: {countdownState.number} (Owner: {countdownOwner?.name || 'Unknown'})
          </p>
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