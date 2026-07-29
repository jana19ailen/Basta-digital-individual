const fs = require('fs');

let code = `
import React, { useState } from 'react';
import { RoomState, Player } from '../lib/useGameRoom';
import { db } from '../lib/firebase';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Users, Settings, Play, Link, Copy, CheckCircle2 } from 'lucide-react';

const AVAILABLE_COLORS = {
  rojo: 'bg-red-500',
  azul: 'bg-blue-500',
  verde: 'bg-green-500',
  amarillo: 'bg-yellow-500',
  naranja: 'bg-orange-500',
  violeta: 'bg-purple-600',
};

export const Lobby: React.FC<{ room: RoomState, players: Player[], playerId: string }> = ({ room, players, playerId }) => {
  const [rules, setRules] = useState(room.rules);
  const [copied, setCopied] = useState(false);

  const me = players.find(p => p.id === playerId);

  const handlePropose = async () => {
    // Reset all votes to pending
    const batch = writeBatch(db);
    players.forEach(p => {
      batch.update(doc(db, 'rooms', room.id, 'players', p.id), { vote: 'pending' });
    });
    // Auto vote yes for proposer
    batch.update(doc(db, 'rooms', room.id, 'players', playerId), { vote: 'yes' });
    
    // Update room
    batch.update(doc(db, 'rooms', room.id), {
      status: 'voting',
      rules: rules,
      proposerId: playerId
    });

    await batch.commit();
  };

  const toggleRule = (key: keyof typeof rules) => {
    setRules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const inviteLink = \`\${window.location.origin}\${window.location.pathname}?room=\${room.id}\`;

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-yellow-50 p-4 md:p-8 font-['Fredoka']">
      
      <div className="max-w-4xl mx-auto mb-8 bg-blue-600 text-white p-6 rounded-2xl shadow-lg text-center relative overflow-hidden">
        <h2 className="text-2xl font-black mb-2 flex justify-center items-center gap-2"><Link /> Invita a tus amigos</h2>
        <p className="text-blue-100 mb-4">Copia este enlace y envíalo para que se unan a la partida:</p>
        
        <div className="flex items-center bg-blue-800 rounded-xl max-w-lg mx-auto">
          <input 
            type="text" 
            readOnly 
            value={inviteLink} 
            className="bg-transparent flex-1 p-4 text-blue-100 outline-none text-sm md:text-base overflow-hidden text-ellipsis"
          />
          <button 
            onClick={copyLink}
            className="bg-green-500 hover:bg-green-400 p-4 rounded-r-xl transition-colors font-bold flex items-center gap-2 h-full"
          >
            {copied ? <><CheckCircle2 size={20}/> Copiado</> : <><Copy size={20}/> Copiar</>}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Jugadores */}
        <div className="bg-white rounded-2xl shadow-xl p-6 h-fit">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Jugadores ({players.length}/6)</h2>
          </div>
          
          <div className="space-y-4">
            {players.map(p => (
              <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border-2 border-gray-100">
                <div className={\`w-10 h-10 rounded-full shadow-inner \${AVAILABLE_COLORS[p.color as keyof typeof AVAILABLE_COLORS]}\`} />
                <span className="font-semibold text-lg text-gray-800">
                  {p.name} {p.id === playerId ? '(Tú)' : ''}
                </span>
              </div>
            ))}
            {players.length === 0 && <p className="text-gray-500 text-center py-4">Esperando jugadores...</p>}
          </div>
        </div>

        {/* Reglas y Proponer */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Reglas de la Partida</h2>
          </div>

          <div className="space-y-4 mb-8">
            <label className="flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer hover:bg-gray-50">
              <span className="font-semibold text-gray-700">Robar Letras</span>
              <input type="checkbox" checked={rules.canSteal} onChange={() => toggleRule('canSteal')} className="w-6 h-6 rounded text-blue-600 focus:ring-blue-500" />
            </label>
            <label className="flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer hover:bg-gray-50">
              <span className="font-semibold text-gray-700">Desmarcar Letras</span>
              <input type="checkbox" checked={rules.canDeselect} onChange={() => toggleRule('canDeselect')} className="w-6 h-6 rounded text-blue-600 focus:ring-blue-500" />
            </label>
            <label className="flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer hover:bg-gray-50">
              <span className="font-semibold text-gray-700">Letras Doradas (Bonus x2)</span>
              <input type="checkbox" checked={rules.goldenLettersEnabled} onChange={() => toggleRule('goldenLettersEnabled')} className="w-6 h-6 rounded text-blue-600 focus:ring-blue-500" />
            </label>
            <label className="flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer hover:bg-gray-50">
              <span className="font-semibold text-gray-700">Penalización por Error</span>
              <input type="checkbox" checked={rules.penaltyEnabled} onChange={() => toggleRule('penaltyEnabled')} className="w-6 h-6 rounded text-blue-600 focus:ring-blue-500" />
            </label>
            
            <div className="p-4 rounded-xl border-2">
               <span className="block font-semibold text-gray-700 mb-2">Modo de Categorías</span>
               <select value={rules.mode} onChange={e => setRules(prev => ({...prev, mode: e.target.value as any}))} className="w-full p-2 rounded-lg border-2 border-gray-200">
                 <option value="normal">Familiar</option>
                 <option value="adult">Adultos (+18)</option>
                 <option value="mixed">Mixto</option>
               </select>
            </div>

            <div className="p-4 rounded-xl border-2">
               <span className="block font-semibold text-gray-700 mb-2">Tiempo de Ronda (Segundos)</span>
               <input 
                 type="number" 
                 value={rules.timerDuration} 
                 onChange={e => setRules(prev => ({...prev, timerDuration: parseInt(e.target.value) || 60}))} 
                 className="w-full p-2 rounded-lg border-2 border-gray-200"
               />
            </div>
          </div>

          <button 
            onClick={handlePropose}
            disabled={players.length < 1}
            className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-colors flex justify-center items-center gap-2 text-xl"
          >
            <Play className="w-6 h-6" />
            {players.length < 2 ? 'Iniciar (Práctica)' : 'Proponer Iniciar Partida'}
          </button>
        </div>

      </div>
    </div>
  );
};
`
fs.writeFileSync('components/Lobby.tsx', code);
