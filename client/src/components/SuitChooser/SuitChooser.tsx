import React from 'react';
import './SuitChooser.scss';

interface SuitChooserProps {
  pendingCardRank: string | null | undefined;
  onSuitChoice: (suit: string) => void;
}

const SuitChooser: React.FC<SuitChooserProps> = ({ pendingCardRank, onSuitChoice }) => {
  return (
    <div className="suit-chooser-overlay">
      <div className="suit-chooser">
        <h3>Choose a Suit for {pendingCardRank}</h3>
        <button onClick={() => onSuitChoice('♥')}>♥ Hearts</button>
        <button onClick={() => onSuitChoice('♦')}>♦ Diamonds</button>
        <button onClick={() => onSuitChoice('♣')}>♣ Clubs</button>
        <button onClick={() => onSuitChoice('♠')}>♠ Spades</button>
      </div>
    </div>
  );
};

export default SuitChooser;