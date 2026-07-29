import React, { useState, useEffect } from 'react';
import { db } from './lib/firebase';
import { collection, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useGameRoom } from './lib/useGameRoom';
import { JoinRoom } from './components/JoinRoom';
import { Lobby } from './components/Lobby';
import { VotingModal } from './components/VotingModal';
import GameBoard from './components/GameBoard';

const App: React.FC = () => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    // Parse URL for room
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      setRoomId(room);
      const savedPlayer = sessionStorage.getItem(`basta_player_${room}`);
      if (savedPlayer) {
        setPlayerId(savedPlayer);
      }
    }
  }, []);

  const { room, players, loading } = useGameRoom(roomId, playerId);

  const createRoom = async () => {
    try {
      const roomRef = await addDoc(collection(db, 'rooms'), {
        status: 'lobby',
        rules: {
          canSteal: false,
          canDeselect: false,
          goldenLettersEnabled: false,
          penaltyEnabled: true,
          mode: 'normal',
          timerDuration: 60,
        },
        proposerId: null,
        lastUpdated: serverTimestamp()
      });
      window.history.replaceState({}, '', `?room=${roomRef.id}`); setRoomId(roomRef.id);
    } catch (err) {
      console.error("Error creating room", err);
    }
  };

  if (loading && roomId) {
    return <div className="min-h-screen flex items-center justify-center bg-yellow-50 font-['Fredoka'] text-xl">Cargando...</div>;
  }

  // No room in URL -> Home screen to create one
  if (!roomId) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4 font-['Fredoka']">
        <div className="text-center max-w-md w-full bg-white p-8 rounded-3xl shadow-xl">
          <h1 className="text-4xl font-black text-blue-900 mb-6">BASTA! Digital</h1>
          <p className="text-gray-600 mb-8 text-lg">Crea una sala y comparte el link con tus amigos para jugar todos juntos desde sus celulares.</p>
          <button 
            onClick={createRoom}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold rounded-2xl shadow-lg transition-transform hover:scale-105"
          >
            Crear Nueva Partida
          </button>
        </div>
      </div>
    );
  }

  if (room && !playerId) {
    if (room.status === 'playing') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-yellow-50 p-4 font-['Fredoka'] text-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl">
            <h2 className="text-3xl font-bold text-red-600 mb-4">La partida ya ha comenzado.</h2>
            <p className="text-xl text-gray-700">Por favor, espera a que termine la ronda actual para unirte.</p>
            <p className="mt-6 text-gray-500 text-sm">Vuelve a intentar recargar la página más tarde.</p>
          </div>
        </div>
      );
    }
    return <JoinRoom roomId={roomId} onJoin={setPlayerId} players={players} />;
  }

  if (!room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-50 p-4 font-['Fredoka'] text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">La sala no existe.</h2>
        <a href="/" className="text-blue-600 font-bold underline">Volver al inicio</a>
      </div>
    );
  }

  if (room.status === 'lobby') {
    return <Lobby room={room} players={players} playerId={playerId!} />;
  }

  if (room.status === 'voting') {
    return (
      <>
        <Lobby room={room} players={players} playerId={playerId!} />
        <VotingModal room={room} players={players} playerId={playerId!} />
      </>
    );
  }

  if (room.status === 'playing') {
    return <GameBoard room={room} players={players} playerId={playerId!} />;
  }

  return null;
};

export default App;
