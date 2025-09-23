import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

// Connect to the server
const socket = io('http://localhost:4000');

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    // Listen for successful connection
    socket.on('connect', () => {
      setIsConnected(true);
    });

    // Listen for disconnection
    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Clean up the socket connection when the component unmounts
    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Unus Cado</h1>
        <p>Server Connection Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      </header>
    </div>
  );
}

export default App;
