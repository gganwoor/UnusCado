import React, { useState } from 'react';
import './InfoPanel.scss';

interface PlayerInfo {
  id: string;
  name: string;
  handSize: number;
}

interface InfoPanelProps {
  gameId: string | null;
  isConnected: boolean;
  players: PlayerInfo[];
  winnerId: string | null;
  onStartGame: () => void;
  isGameStarted: boolean;
  myPlayerId: string | null;
  onBackToLobby: () => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({
  gameId,
  isConnected,
  players,
  winnerId,
  onStartGame,
  isGameStarted,
  myPlayerId,
  onBackToLobby,
}) => {
  const [copied, setCopied] = useState(false);
  const winner = winnerId ? players.find(p => p.id === winnerId) : null;

  const handleCopy = () => {
    if (gameId) {
      navigator.clipboard.writeText(gameId).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="info-panel-container">
      {!isGameStarted && (
        <div className="waiting-room-info">
          <div className="game-id-container">
            <span>Game ID:</span>
            <span className="game-id-display">{gameId}</span>
            <button onClick={handleCopy} className="copy-button">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button onClick={onStartGame} disabled={!isConnected || winnerId !== null}>
            Start Game
          </button>
        </div>
      )}
      {winner && (
        <div className="winner-announcement">
          <div className="winner-box">
            <h2>{winner.id === myPlayerId ? 'You Win!' : `Winner: ${winner.name}`}</h2>
            <button onClick={onBackToLobby} className="lobby-button">
              Back to Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoPanel;