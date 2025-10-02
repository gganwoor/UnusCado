import React, { useState } from 'react';
import './Lobby.scss';

interface LobbyProps {
  onCreateGame: (playerName: string) => void;
  onJoinGame: (gameId: string, playerName: string) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onCreateGame, onJoinGame }) => {
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');

  const handleCreate = () => {
    if (playerName) {
      onCreateGame(playerName);
    }
  };

  const handleJoin = () => {
    if (playerName && gameId) {
      onJoinGame(gameId.toUpperCase(), playerName);
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
        </div>
      </div>
    </div>
  );
};

export default Lobby;