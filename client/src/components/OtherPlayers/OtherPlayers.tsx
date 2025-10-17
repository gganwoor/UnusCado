import React from 'react';
import './OtherPlayers.scss';

interface PlayerInfo {
  id: string;
  name: string;
  handSize: number;
}

interface OtherPlayersProps {
  players: PlayerInfo[];
  myPlayerId: string | null;
  currentPlayerId: string | null;
}

const OtherPlayers: React.FC<OtherPlayersProps> = ({ players, myPlayerId, currentPlayerId }) => {
  return (
    <div className="Other-players">
      {players.filter(p => p.id !== myPlayerId).map(p => {
        const isCurrentTurn = p.id === currentPlayerId;
        return (
          <div key={p.id} className={`player-badge ${isCurrentTurn ? 'current-turn' : ''}`}>
            <span className="player-name">{p.name}</span>
            <span className="card-count">{p.handSize} Cards</span>
          </div>
        );
      })}
    </div>
  );
};

export default OtherPlayers;