import React, { useState } from 'react';
import './Lobby.scss';

interface LobbyProps {
  onCreateGame: (playerName: string) => void;
  onJoinGame: (gameId: string, playerName: string) => void;
  onCreateSinglePlayerGame: (playerName: string) => void;
  gameError: string | null;
}

const Lobby: React.FC<LobbyProps> = ({ onCreateGame, onJoinGame, onCreateSinglePlayerGame, gameError }) => {
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');

  const handleCreate = () => {
    if (playerName) {
      onCreateGame(playerName);
    }
  };

  const handleJoin = () => {
    if (playerName && gameId) {
      onJoinGame(gameId, playerName);
    }
  };

  const handleCreateSinglePlayer = () => {
    if (playerName) {
      onCreateSinglePlayerGame(playerName);
    }
  };

  return (
    <div className="lobby-container">
      <h1>Unus Cado</h1>
      <div className="lobby-form">
        <input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="lobby-input"
        />
        <button onClick={handleCreate} disabled={!playerName} className="lobby-button">
          Create Game
        </button>
        <button onClick={handleCreateSinglePlayer} disabled={!playerName} className="lobby-button single-player-button">
          혼자서 시작하기
        </button>
        <div className="join-game-section">
          <input
            type="text"
            placeholder="Enter Game ID"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className="lobby-input"
          />
          <button onClick={handleJoin} disabled={!playerName || !gameId} className="lobby-button">
            Join Game
          </button>
          {gameError && <div className="lobby-error">{gameError}</div>}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
