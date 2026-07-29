import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Player, RoomState } from '../lib/useGameRoom';
import { Loader2 } from 'lucide-react';

const AVAILABLE_COLORS = [
  { id: 'rojo', color: 'bg-red-500', text: 'text-red-500', label: 'Rojo' },
  { id: 'azul', color: 'bg-blue-500', text: 'text-blue-500', label: 'Azul' },
  { id: 'verde', color: 'bg-green-500', text: 'text-green-500', label: 'Verde' },
  { id: 'amarillo', color: 'bg-yellow-500', text: 'text-yellow-500', label: 'Amarillo' },
  { id: 'naranja', color: 'bg-orange-500', text: 'text-orange-500', label: 'Naranja' },
  { id: 'violeta', color: 'bg-purple-600', text: 'text-purple-600', label: 'Violeta' },
];

export const JoinRoom: React.FC<{ roomId: string, onJoin: (playerId: string) => void, players: Player[] }> = ({ roomId, onJoin, players }) => {
  const [name, setName] = useState('');
  const [colorId, setColorId] = useState('');
  const [joining, setJoining] = useState(false);

  const usedColors = players.map(p => p.color);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !colorId) return;
    setJoining(true);

    try {
      const newPlayerRef = doc(collection(db, 'rooms', roomId, 'players'));
      await setDoc(newPlayerRef, {
        name,
        color: colorId,
        vote: 'pending',
        lastSeen: serverTimestamp()
      });
      
      // Store in sessionStorage
      sessionStorage.setItem(`basta_player_${roomId}`, newPlayerRef.id);
      onJoin(newPlayerRef.id);
    } catch (err) {
      console.error(err);
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-yellow-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-blue-900 mb-6">Unirse a la Partida</h1>
        
        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tu Nombre</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              placeholder="Ingresa tu nombre..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Elige tu Color</label>
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_COLORS.map(c => {
                const isUsed = usedColors.includes(c.id);
                const isSelected = colorId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={isUsed}
                    onClick={() => setColorId(c.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      isUsed ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-200' :
                      isSelected ? `border-${c.id === 'rojo' ? 'red' : c.id === 'azul' ? 'blue' : c.id === 'verde' ? 'green' : c.id === 'amarillo' ? 'yellow' : c.id === 'naranja' ? 'orange' : 'purple'}-500 bg-gray-50` :
                      'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full ${c.color}`} />
                    <span className="font-medium text-gray-800">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={!name || !colorId || joining}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-colors flex justify-center items-center gap-2"
          >
            {joining && <Loader2 className="w-5 h-5 animate-spin" />}
            Entrar a la Sala
          </button>
        </form>
      </div>
    </div>
  );
}
