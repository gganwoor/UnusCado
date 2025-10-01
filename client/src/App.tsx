import React, { useReducer, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import './App.scss';
import InfoPanel from './components/InfoPanel/InfoPanel';
import PlayerHand from './components/PlayerHand/PlayerHand';
import OtherPlayers from './components/OtherPlayers/OtherPlayers';
import GameBoard from './components/GameBoard/GameBoard';
import SuitChooser from './components/SuitChooser/SuitChooser';

interface CardData {
  suit: string;
  rank: string;
}

interface PlayerInfo {
  id: string;
  name: string;
  handSize: number;
}

interface AppState {
  isConnected: boolean;
  myPlayerId: string | null;
  currentPlayerId: string | null;
  playerHand: CardData[];
  discardPile: CardData[];
  drawPileSize: number;
  attackStack: number;
  winnerId: string | null;
  players: PlayerInfo[];
  showSuitChooser: boolean;
  pendingSuitChangeCard: CardData | null;
}

type AppAction =
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'SET_MY_PLAYER_ID'; payload: string | null }
  | { type: 'GAME_STATE_UPDATE'; payload: any }
  | { type: 'GAME_OVER'; payload: string }
  | { type: 'CHOOSE_SUIT' }
  | { type: 'PLAY_CARD_PENDING'; payload: CardData }
  | { type: 'SUIT_CHOICE_COMPLETE' }
  | { type: 'START_GAME_PENDING' };

const initialState: AppState = {
  isConnected: false,
  myPlayerId: null,
  currentPlayerId: null,
  playerHand: [],
  discardPile: [],
  drawPileSize: 0,
  attackStack: 0,
  winnerId: null,
  players: [],
  showSuitChooser: false,
  pendingSuitChangeCard: null,
};

function gameReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload };
    case 'SET_MY_PLAYER_ID':
      return { ...state, myPlayerId: action.payload };
    case 'GAME_STATE_UPDATE':
      return {
        ...state,
        myPlayerId: action.payload.myPlayerId,
        playerHand: action.payload.playerHand,
        discardPile: action.payload.discardPile,
        drawPileSize: action.payload.drawPileSize,
        currentPlayerId: action.payload.currentPlayerId,
        attackStack: action.payload.attackStack,
        players: action.payload.players,
        winnerId: null,
        showSuitChooser: false,
        pendingSuitChangeCard: null,
      };
    case 'GAME_OVER':
      return { ...state, winnerId: action.payload };
    case 'CHOOSE_SUIT':
      return { ...state, showSuitChooser: true };
    case 'PLAY_CARD_PENDING':
      return { ...state, pendingSuitChangeCard: action.payload };
    case 'SUIT_CHOICE_COMPLETE':
      return { ...state, showSuitChooser: false, pendingSuitChangeCard: null };
    case 'START_GAME_PENDING':
      return {
        ...state,
        playerHand: [],
        discardPile: [],
        drawPileSize: 0,
        winnerId: null,
        players: [],
      };
    default:
      return state;
  }
}

function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket: Socket = io('http://localhost:4000');
    socketRef.current = socket;

    dispatch({ type: 'SET_CONNECTION_STATUS', payload: socket.connected });

    socket.on('connect', () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
      dispatch({ type: 'SET_MY_PLAYER_ID', payload: socket.id ?? null });
    });

    socket.on('disconnect', () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });
      dispatch({ type: 'SET_MY_PLAYER_ID', payload: null });
    });

    socket.on('game-state-update', (gameState: any) => {
      dispatch({ type: 'GAME_STATE_UPDATE', payload: gameState });
    });

    socket.on('game-over', (data: { winnerId: string }) => {
      dispatch({ type: 'GAME_OVER', payload: data.winnerId });
    });

    socket.on('choose-suit', () => {
      dispatch({ type: 'CHOOSE_SUIT' });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const isMyTurn = state.myPlayerId === state.currentPlayerId;

  const handlePlayCard = (card: CardData) => {
    if (!isMyTurn || !socketRef.current) return;
    
    if (card.rank === '7') {
      dispatch({ type: 'PLAY_CARD_PENDING', payload: card });
    }
    socketRef.current.emit('play-card', card);
  };

  const handleDrawCard = () => {
    if (!isMyTurn || !socketRef.current) return;
    socketRef.current.emit('draw-card');
  };

  const handleSuitChoice = (chosenSuit: string) => {
    if (!socketRef.current || !state.pendingSuitChangeCard) return;

    socketRef.current.emit('suit-chosen', { chosenSuit });
    dispatch({ type: 'SUIT_CHOICE_COMPLETE' });
  };

  const startGame = () => {
    if (!socketRef.current) return;
    
    dispatch({ type: 'START_GAME_PENDING' });
    socketRef.current.emit('start-game');
  };

  return (
    <div className="App">
      <InfoPanel
        isConnected={state.isConnected}
        myPlayerId={state.myPlayerId}
        currentPlayerId={state.currentPlayerId}
        players={state.players}
        attackStack={state.attackStack}
        winnerId={state.winnerId}
        onStartGame={startGame}
        isMyTurn={isMyTurn}
      />
      <div className="Game-board">
        <OtherPlayers players={state.players} myPlayerId={state.myPlayerId} />
        <GameBoard
          discardPile={state.discardPile}
          drawPileSize={state.drawPileSize}
          isMyTurn={isMyTurn}
          onDrawCard={handleDrawCard}
        />
        <PlayerHand
          hand={state.playerHand}
          isMyTurn={isMyTurn}
          onPlayCard={handlePlayCard}
        />
        {state.showSuitChooser && (
          <SuitChooser
            pendingCardRank={state.pendingSuitChangeCard?.rank}
            onSuitChoice={handleSuitChoice}
          />
        )}
      </div>
    </div>
  );
}

export default App;