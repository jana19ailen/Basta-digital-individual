const fs = require('fs');

const code = `
import React, { useState, useEffect, useRef } from 'react';
import { ALPHABET, TIMER_OPTIONS, CATEGORIES, CATEGORIES_ADULT } from '../constants';
import LetterButton from './LetterButton';
import BastaOverlay from './BastaOverlay';
import CategoryCard from './CategoryCard';
import { RotateCcw, Play, Volume2, VolumeX, Layers, Flame, Shuffle, Users, Shield, Sparkles, Undo2, Star, Timer, Home, Info, X, ArrowLeft, Settings, Trophy } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc, deleteField } from 'firebase/firestore';

const COLOR_MAP = { rojo: 'bg-red-500', azul: 'bg-blue-500', verde: 'bg-green-500', amarillo: 'bg-yellow-500', naranja: 'bg-orange-500', violeta: 'bg-purple-600' };

const GameBoard: React.FC<{ room: any, players: any[], playerId: string }> = ({ room, players, playerId }) => {
  // --- SYNCED STATE ---
  const rules = room?.rules || {};
  const { mode = 'normal', timerDuration = 60, canSteal = false, canDeselect = false, goldenLettersEnabled = false } = rules;
  
  const gameState = room?.gameState || {};
  const { status = 'idle', timerEndTime = 0, currentCategory = null, isCardVisible = false, usedLetters = {}, goldenLetters = [] } = gameState;

  // --- LOCAL STATE ---
  const [timeLeft, setTimeLeft] = useState<number>(timerDuration);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  
  const activePlayerId = playerId;

  const audioCtxRef = useRef<AudioContext | null>(null);

  // --- TIMER LOGIC ---
  useEffect(() => {
    if (status === 'playing') {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          if (status === 'playing') {
             updateDoc(doc(db, "rooms", room.id), { 'gameState.status': 'finished' });
             playSound(200, 'sawtooth', 1.2, 0.15);
          }
        }
      }, 100);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(timerDuration);
    }
  }, [status, timerEndTime, timerDuration, room.id]);

  // --- STYLES ---
  const getAppStyles = () => {
    switch(mode) {
      case 'adult': return { bg: 'bg-slate-950', text: 'text-fuchsia-100', accent: 'text-fuchsia-500', btnPrimary: 'bg-fuchsia-600 hover:bg-fuchsia-700', statsBg: 'bg-slate-900 border-slate-800' };
      case 'mixed': return { bg: 'bg-purple-950', text: 'text-pink-50', accent: 'text-pink-400', btnPrimary: 'bg-pink-500 hover:bg-pink-600', statsBg: 'bg-purple-900 border-purple-800' };
      default: return { bg: 'bg-[#FDFBF0]', text: 'text-blue-900', accent: 'text-blue-600', btnPrimary: 'bg-blue-600 hover:bg-blue-700', statsBg: 'bg-white border-white' };
    }
  };
  const styles = getAppStyles();

  // --- AUDIO LOGIC ---
  const initAudio = () => {
    try {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
         if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume().catch(() => {});
         return;
      }
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) audioCtxRef.current = new AudioContextClass();
    } catch (e) {}
  };

  const playSound = (freq: number, type: OscillatorType = 'sine', duration = 0.1, gainVal = 0.08) => {
    if (!isSoundEnabled) return;
    try {
      if (!audioCtxRef.current) initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  const handleDrawCategory = () => {
    initAudio();
    playSound(400, 'sawtooth', 0.1, 0.03);
    let pool = mode === 'normal' ? CATEGORIES : mode === 'adult' ? CATEGORIES_ADULT : [...CATEGORIES, ...CATEGORIES_ADULT];
    
    updateDoc(doc(db, "rooms", room.id), {
       'gameState.currentCategory': pool[Math.floor(Math.random() * pool.length)],
       'gameState.isCardVisible': true
    });
  };

  const handleLetterClick = (letter: string) => {
    if (usedLetters[letter] !== undefined) {
      if (usedLetters[letter] === activePlayerId) {
        if (!canDeselect) return;
        updateDoc(doc(db, "rooms", room.id), { [\`gameState.usedLetters.\${letter}\`]: deleteField() });
        initAudio();
        playSound(300, 'square', 0.1, 0.05);
        return;
      } else {
        if (!canSteal) return;
      }
    }
    
    // We update via firestore directly
    updateDoc(doc(db, "rooms", room.id), { [\`gameState.usedLetters.\${letter}\`]: activePlayerId });
    
    initAudio(); 
    if (goldenLetters.includes(letter)) {
       playSound(1200, 'sine', 0.1, 0.1);
       setTimeout(() => playSound(1600, 'sine', 0.2, 0.1), 100);
    } else {
       playSound(1100); 
    }
  };

  const handleTimerClick = () => {
    if (status === 'idle') {
        initAudio();
        let newGolden = [];
        if (goldenLettersEnabled) {
           const shuffled = [...ALPHABET].sort(() => 0.5 - Math.random());
           newGolden = shuffled.slice(0, 3);
        }
        updateDoc(doc(db, "rooms", room.id), {
          'gameState.status': 'playing',
          'gameState.timerEndTime': Date.now() + timerDuration * 1000,
          'gameState.usedLetters': {},
          'gameState.goldenLetters': newGolden,
          'gameState.isCardVisible': false
        });
        playSound(800, 'square', 0.1, 0.1);
    } else if (status === 'playing') {
        updateDoc(doc(db, "rooms", room.id), { 'gameState.status': 'finished' });
        playSound(200, 'sawtooth', 1.2, 0.15);
    }
  };

  const resetGame = () => {
    updateDoc(doc(db, "rooms", room.id), {
       'gameState.status': 'idle',
       'gameState.usedLetters': {},
       'gameState.currentCategory': null,
       'gameState.isCardVisible': false
    });
  };

  const leaveRoom = () => {
     updateDoc(doc(db, 'rooms', room.id), { status: 'lobby' }); 
  };

  const getTeamScore = (tid: string) => {
    return Object.entries(usedLetters).reduce((score, [letter, id]) => {
      if (id === tid) {
        return score + (goldenLetters.includes(letter) ? 2 : 1);
      }
      return score;
    }, 0);
  };

  const getGameResult = () => {
    const scores: Record<string, number> = {};
    Object.entries(usedLetters).forEach(([letter, pid]) => {
      if (pid) {
        scores[pid as string] = (scores[pid as string] || 0) + (goldenLetters.includes(letter) ? 2 : 1);
      }
    });
    const maxScore = Math.max(0, ...Object.values(scores));
    const winners = Object.entries(scores).filter(([id, score]) => score === maxScore && score > 0).map(([id]) => id);
    if (winners.length === 1) { 
        const wp = players.find((p:any)=>p.id===winners[0]); 
        return { winner: { label: wp?.name, color: COLOR_MAP[wp?.color as keyof typeof COLOR_MAP] }, isTie: false }; 
    }
    return { winner: null, isTie: true };
  };

  const { winner, isTie } = getGameResult();

  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => getTeamScore(b.id) - getTeamScore(a.id));

  return (
    <div className={\`min-h-screen \${styles.bg} transition-colors duration-500 font-['Fredoka'] flex flex-col\`}>
      
      {/* Header & Scoreboard */}
      <div className={\`w-full p-4 \${styles.statsBg} shadow-md z-10 flex flex-col md:flex-row gap-4 justify-between items-center\`}>
         <div className="flex items-center gap-4">
           <button onClick={leaveRoom} className={\`w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm hover:scale-110 active:scale-95 transition-transform\`}>
               <ArrowLeft size={20} className={styles.accent} />
           </button>
           <button onClick={() => setIsSoundEnabled(!isSoundEnabled)} className={\`w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm hover:scale-110 active:scale-95 transition-transform\`}>
               {isSoundEnabled ? <Volume2 size={20} className={styles.text} /> : <VolumeX size={20} className="text-gray-400" />}
           </button>
         </div>

         {/* Scoreboard List */}
         <div className="flex flex-1 items-center justify-center overflow-x-auto no-scrollbar max-w-full px-2">
            <div className="flex items-center gap-3 min-w-max">
                <Trophy size={20} className="text-yellow-500 hidden sm:block" />
                {sortedPlayers.map((player: any, idx) => {
                   const isActive = activePlayerId === player.id;
                   const score = getTeamScore(player.id);
                   return (
                     <div 
                        key={player.id} 
                        className={\`flex items-center gap-2 p-1.5 pr-3 rounded-full transition-all duration-300 \${isActive ? 'bg-white shadow-md ring-2 ring-blue-400 scale-105' : 'bg-white/40 opacity-80'}\`}
                     >
                        <div className={\`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm \${COLOR_MAP[player.color as keyof typeof COLOR_MAP]}\`}>
                           {player.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col items-start leading-tight">
                            <span className={\`text-[10px] font-black uppercase tracking-wider \${isActive ? 'text-gray-800' : 'text-gray-600'}\`}>
                                {player.name}
                            </span>
                            <span className={\`text-sm font-black \${isActive ? styles.accent : 'text-gray-500'}\`}>
                                {score} pts
                            </span>
                        </div>
                     </div>
                   );
                })}
            </div>
         </div>
         
         <div className="hidden md:flex w-20"></div> {/* Spacer for balance */}
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col lg:flex-row p-4 md:p-6 gap-6 w-full max-w-7xl mx-auto min-h-0">
        
        {/* Left: Keyboard Grid */}
        <div className="flex-1 flex flex-col justify-center items-center min-h-0 overflow-y-auto">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2 md:gap-3 lg:gap-4 w-full p-2 auto-rows-fr">
                {ALPHABET.map((letter, index) => {
                    const ownerId = usedLetters[letter];
                    const ownerColor = ownerId ? COLOR_MAP[players.find((p:any) => p.id === ownerId)?.color as keyof typeof COLOR_MAP] : undefined;
                    return (
                        <LetterButton 
                            key={letter}
                            letter={letter} 
                            isUsed={usedLetters[letter] !== undefined} 
                            ownerColor={ownerColor}
                            isActive={true}
                            isGolden={goldenLetters.includes(letter)}
                            onClick={() => handleLetterClick(letter)} 
                        />
                    );
                })}
            </div>
        </div>

        {/* Right: Controls Panel */}
        <div className="w-full lg:w-72 shrink-0 flex flex-row lg:flex-col gap-4">
            
            {/* Category Button */}
            <button 
                onClick={handleDrawCategory}
                className={\`flex-1 lg:flex-none lg:h-32 rounded-3xl \${mode === 'normal' ? 'bg-amber-400 hover:bg-amber-500' : mode === 'adult' ? 'bg-fuchsia-600 hover:bg-fuchsia-700' : 'bg-pink-500 hover:bg-pink-600'} text-white shadow-lg flex flex-col items-center justify-center border-4 border-white gap-2 active:scale-95 transition-all p-4\`}
            >
                <Layers size={32} />
                <span className="font-black uppercase text-sm">Categoría</span>
            </button>
            
            {/* Timer Toggle */}
            <button 
                onClick={handleTimerClick}
                className={\`flex-1 lg:flex-none lg:h-48 rounded-3xl transition-all duration-300 shadow-lg flex flex-col items-center justify-center border-4 p-4 \${
                  status === 'playing' 
                   ? 'bg-red-50 border-red-500 hover:bg-red-100 shadow-red-200' 
                   : \`\${styles.statsBg} \${mode === 'normal' ? 'border-blue-200' : 'border-purple-500/30'} hover:scale-[1.02]\`
                }\`}
            >
                {status === 'playing' ? (
                    <div className="text-red-600 flex flex-col items-center">
                         <span className="text-6xl font-black font-mono leading-none">{timeLeft}</span>
                         <span className="text-xs font-black uppercase mt-2 tracking-widest">SEGUNDOS</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-gray-400">
                        <Play size={40} className={\`\${styles.accent} mb-2\`} fill="currentColor" />
                        <span className="text-xs font-bold uppercase tracking-widest">INICIAR ({timerDuration}s)</span>
                    </div>
                )}
            </button>
            
            {/* Reset / Finish Early */}
            {status === 'playing' ? (
               <button 
                  onClick={() => updateDoc(doc(db, "rooms", room.id), { 'gameState.status': 'finished' })}
                  className="hidden lg:flex w-full py-4 bg-gray-800 text-white font-black rounded-2xl shadow-md justify-center items-center gap-2 hover:bg-gray-900 transition-colors"
               >
                   ¡Basta! (Terminar)
               </button>
            ) : status === 'finished' ? (
               <button 
                  onClick={resetGame}
                  className="hidden lg:flex w-full py-4 bg-gray-800 text-white font-black rounded-2xl shadow-md justify-center items-center gap-2 hover:bg-gray-900 transition-colors"
               >
                   <RotateCcw size={20} /> Nueva Ronda
               </button>
            ) : null}

        </div>
      </div>

      {/* Floating Basta Button on Mobile when Playing */}
      {status === 'playing' && (
         <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-sm">
             <button 
                onClick={() => updateDoc(doc(db, "rooms", room.id), { 'gameState.status': 'finished' })}
                className="w-full py-4 bg-red-600 text-white font-black text-xl rounded-full shadow-2xl justify-center items-center animate-bounce border-4 border-red-400"
             >
                 ¡BASTA PARA MÍ!
             </button>
         </div>
      )}

      {/* Floating Reset Button on Mobile when Finished */}
      {status === 'finished' && (
         <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-sm">
             <button 
                onClick={resetGame}
                className="w-full py-4 bg-gray-900 text-white font-black text-xl rounded-full shadow-2xl justify-center items-center flex gap-2 border-4 border-gray-700"
             >
                 <RotateCcw size={24} /> NUEVA RONDA
             </button>
         </div>
      )}

      <BastaOverlay 
         isVisible={status === 'finished'} 
         onClose={() => updateDoc(doc(db, "rooms", room.id), { 'gameState.status': 'idle' })} 
         winner={winner}
         isTie={isTie}
      />
      <CategoryCard 
         isVisible={isCardVisible} 
         onClose={() => updateDoc(doc(db, "rooms", room.id), { 'gameState.isCardVisible': false })} 
         onDraw={handleDrawCategory} 
         currentCategory={currentCategory} 
         mode={mode as any} 
      />

    </div>
  );
};

export default GameBoard;
`
fs.writeFileSync('components/GameBoard.tsx', code);
