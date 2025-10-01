import React from 'react';
import Card from '../Card';
import './OtherPlayers.scss';

interface PlayerInfo {
  id: string;
  name: string;
  handSize: number;
}

interface OtherPlayersProps {
  players: PlayerInfo[];
  myPlayerId: string | null;
}

const OtherPlayers: React.FC<OtherPlayersProps> = ({ players, myPlayerId }) => {
  return (
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
  );
};

export default OtherPlayers;