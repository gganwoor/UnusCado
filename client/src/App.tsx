import React, { useReducer, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import './App.scss';

import Lobby from './components/Lobby/Lobby';
import InfoPanel from './components/InfoPanel/InfoPanel';
import PlayerHand from './components/PlayerHand/PlayerHand';
import OtherPlayers from './components/OtherPlayers/OtherPlayers';
import GameBoard from './components/GameBoard/GameBoard';
import SuitChooser from './components/SuitChooser/SuitChooser';

interface CardData {
  suit: string;
  rank: string;
  color?: string;
  isCountdown?: boolean;
}

interface PlayerInfo {
  id: string;
  name: string;
  handSize: number;
}

interface AppState {
  gameId: string | null;
  gameError: string | null;
  countdownState: { ownerId: string | null; number: number | null; } | null;
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
  | { type: 'GAME_CREATED'; payload: string }
  | { type: 'SET_GAME_ERROR'; payload: string | null }
  | { type: 'GAME_OVER'; payload: string }
  | { type: 'CHOOSE_SUIT' }
  | { type: 'PLAY_CARD_PENDING'; payload: CardData }
  | { type: 'SUIT_CHOICE_COMPLETE' }
  | { type: 'START_GAME_PENDING' };

const initialState: AppState = {
  gameId: null,
  gameError: null,
  countdownState: null,
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
        gameId: action.payload.gameId,
        myPlayerId: action.payload.myPlayerId,
        playerHand: action.payload.playerHand,
        discardPile: action.payload.discardPile,
        drawPileSize: action.payload.drawPileSize,
        currentPlayerId: action.payload.currentPlayerId,
        attackStack: action.payload.attackStack,
        players: action.payload.players,
        countdownState: action.payload.countdownState,
        winnerId: null,
        showSuitChooser: false,
        pendingSuitChangeCard: null,
        gameError: null,
      };
    case 'GAME_CREATED':
      return { ...state, gameId: action.payload, gameError: null };
    case 'SET_GAME_ERROR':
      return { ...state, gameError: action.payload };
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
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:4000';
    const socket: Socket = io(serverUrl);
    socketRef.current = socket;

    dispatch({ type: 'SET_CONNECTION_STATUS', payload: socket.connected });

    socket.on('connect', () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
      dispatch({ type: 'SET_MY_PLAYER_ID', payload: socket.id ?? null });
    });

    socket.on('disconnect', () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });
    });

    socket.on('game-state-update', (gameState: any) => {
      dispatch({ type: 'GAME_STATE_UPDATE', payload: gameState });
    });

    socket.on('game-created', ({ gameId }) => {
      dispatch({ type: 'GAME_CREATED', payload: gameId });
    });

    socket.on('unknown-game', () => {
      dispatch({ type: 'SET_GAME_ERROR', payload: 'Game not found. Please check the ID.' });
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

  const handleCreateGame = (playerName: string) => {
    socketRef.current?.emit('create-game', { playerName });
  };

    const handleJoinGame = (gameId: string, playerName: string) => {

      socketRef.current?.emit('join-game', { gameId, playerName });

    };

  

    const handleCreateSinglePlayerGame = (playerName: string) => {

      socketRef.current?.emit('create-single-player-game', { playerName });

    };

  

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

  const isMyTurn = state.myPlayerId === state.currentPlayerId;
  const isGameStarted = state.discardPile.length > 0;

  return (
    <div className="App">
      {!state.gameId ? (
        <Lobby 
          onCreateGame={handleCreateGame} 
          onJoinGame={handleJoinGame} 
          onCreateSinglePlayerGame={handleCreateSinglePlayerGame}
        />
      ) : (
        <div className="Game-board">
            <OtherPlayers 
              players={state.players} 
              myPlayerId={state.myPlayerId} 
              currentPlayerId={state.currentPlayerId} 
            />
            <div className="game-area">
              <InfoPanel
                gameId={state.gameId}
                isConnected={state.isConnected}
                players={state.players}
                winnerId={state.winnerId}
                onStartGame={startGame}
                isGameStarted={isGameStarted}
                myPlayerId={state.myPlayerId}
              />
              <GameBoard
                discardPile={state.discardPile}
                drawPileSize={state.drawPileSize}
                isMyTurn={isMyTurn}
                onDrawCard={handleDrawCard}
                attackStack={state.attackStack}
              />
            </div>
            <PlayerHand
              hand={state.playerHand}
              isMyTurn={isMyTurn}
              onPlayCard={handlePlayCard}
              discardPile={state.discardPile}
              countdownState={state.countdownState}
              attackStack={state.attackStack}
            />
            {state.showSuitChooser && (
              <SuitChooser
                pendingCardRank={state.pendingSuitChangeCard?.rank}
                onSuitChoice={handleSuitChoice}
              />
            )}
        </div>
      )}
    </div>
  );
}

export default App;