import React, { useEffect, useState } from 'react';
import { RoomState, Player } from '../lib/useGameRoom';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export const VotingModal: React.FC<{ room: RoomState, players: Player[], playerId: string }> = ({ room, players, playerId }) => {
  const me = players.find(p => p.id === playerId);
  const proposer = players.find(p => p.id === room.proposerId);
  const [voted, setVoted] = useState(me?.vote !== 'pending');

  useEffect(() => {
    setVoted(me?.vote !== 'pending');
  }, [me?.vote]);

  const handleVote = async (vote: 'yes' | 'no') => {
    setVoted(true);
    await updateDoc(doc(db, 'rooms', room.id, 'players', playerId), { vote });
  };

  // Check if majority voted or all voted
  useEffect(() => {
    if (room.proposerId === playerId) { // only proposer checks logic to avoid multiple updates
      const total = players.length;
      const yesVotes = players.filter(p => p.vote === 'yes').length;
      const noVotes = players.filter(p => p.vote === 'no').length;
      
      const threshold = Math.floor(total / 2) + 1; // simple majority

      if (yesVotes >= threshold || (total === 2 && yesVotes === 2)) {
        updateDoc(doc(db, 'rooms', room.id), { status: 'playing' });
      } else if (noVotes >= threshold || (total === 2 && noVotes > 0)) {
        updateDoc(doc(db, 'rooms', room.id), { status: 'lobby' });
      }
    }
  }, [players, room, playerId]);

  if (!proposer) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center animate-in zoom-in duration-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">¡Votación de Partida!</h2>
        <p className="text-gray-600 mb-6 text-lg">
          <span className="font-bold text-blue-600">{proposer.name}</span> quiere iniciar la partida con estas reglas:
        </p>
        
        <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 space-y-2">
          <p>Robar Letras: {room.rules.canSteal ? '✅' : '❌'}</p>
          <p>Desmarcar Letras: {room.rules.canDeselect ? '✅' : '❌'}</p>
          <p>Letras Doradas: {room.rules.goldenLettersEnabled ? '✅' : '❌'}</p>
          
          <p>Modo: <span className="capitalize">{room.rules.mode}</span></p>
        </div>

        {voted ? (
          <div className="py-4">
            <p className="text-lg font-semibold text-gray-700">Esperando al resto de los jugadores...</p>
            <div className="flex justify-center gap-2 mt-4">
               {players.map(p => (
                 <div key={p.id} className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
                   p.vote === 'yes' ? 'bg-green-500' : p.vote === 'no' ? 'bg-red-500' : 'bg-gray-300'
                 }`}>
                   {p.name.charAt(0).toUpperCase()}
                 </div>
               ))}
            </div>
          </div>
        ) : (
          <div className="flex gap-4">
            <button onClick={() => handleVote('no')} className="flex-1 py-3 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl transition-colors">
              Rechazar
            </button>
            <button onClick={() => handleVote('yes')} className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors shadow-lg">
              Aceptar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
