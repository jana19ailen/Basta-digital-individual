const fs = require('fs');

const code = `
import React, { useState, useEffect, useRef } from 'react';
import { ALPHABET, TIMER_OPTIONS, CATEGORIES, CATEGORIES_ADULT } from '../constants';
import LetterButton from './LetterButton';
import BastaOverlay from './BastaOverlay';
import CategoryCard from './CategoryCard';
import { RotateCcw, Play, Volume2, VolumeX, Layers, Flame, Shuffle, Users, Shield, Sparkles, Undo2, Star, Timer, Home, Info, X, ArrowLeft, Settings } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const COLOR_MAP = { rojo: 'bg-red-500', azul: 'bg-blue-500', verde: 'bg-green-500', amarillo: 'bg-yellow-500', naranja: 'bg-orange-500', violeta: 'bg-purple-600' };

const GameBoard: React.FC<{ room: any, players: any[], playerId: string }> = ({ room, players, playerId }) => {
  // --- SYNCED STATE (via room.gameState and room.rules) ---
  const rules = room?.rules || {};
  const { mode = 'normal', timerDuration = 60, canSteal = false, canDeselect = false, goldenLettersEnabled = false, penaltyEnabled = true } = rules;
  
  const gameState = room?.gameState || {};
  const { status = 'idle', timerEndTime = 0, currentCategory = null, isCardVisible = false, usedLetters = {}, goldenLetters = [] } = gameState;

  // --- LOCAL STATE ---
  const [timeLeft, setTimeLeft] = useState<number>(timerDuration);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [blockedPlayers, setBlockedPlayers] = useState<Record<string, number>>({});
  
  // activePlayerId is always the local user in multiplayer mode!
  const activePlayerId = playerId;

  // --- LAYOUT STATE ---
  const [isLandscape, setIsLandscape] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false
  );

  useEffect(() => {
    const handleResize = () => setIsLandscape(window.innerWidth > window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const penaltyTimerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // --- SYNC HELPERS ---
  const updateGameState = (updates: any) => {
    updateDoc(doc(db, "rooms", room.id), {
      ...Object.entries(updates).reduce((acc, [k, v]) => ({ ...acc, [\`gameState.\${k}\`]: v }), {})
    });
  };

  // --- TIMER SYNC ---
  useEffect(() => {
    if (status === 'playing') {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          if (status === 'playing') { // Only update if we still think it's playing
             updateGameState({ status: 'finished' });
             playSound(200, 'sawtooth', 1.2, 0.15);
          }
        }
      }, 100); // Fast interval for smooth update
      return () => clearInterval(interval);
    } else {
      setTimeLeft(timerDuration);
    }
  }, [status, timerEndTime, timerDuration]);
  
  // Penalty tick
  useEffect(() => {
      const int = setInterval(() => {
        setBlockedPlayers(prev => {
          if (Object.keys(prev).length === 0) return prev;
          const next = { ...prev };
          let changed = false;
          for (const id in next) {
            if (next[id] > 1) { next[id] -= 1; changed = true; }
            else { delete next[id]; changed = true; }
          }
          return changed ? next : prev;
        });
      }, 1000);
      return () => clearInterval(int);
  }, []);

  // --- STYLES & THEMES ---
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

  // --- GAME HANDLERS ---
  const handleDrawCategory = () => {
    initAudio();
    playSound(400, 'sawtooth', 0.1, 0.03);
    let pool = mode === 'normal' ? CATEGORIES : mode === 'adult' ? CATEGORIES_ADULT : [...CATEGORIES, ...CATEGORIES_ADULT];
    updateGameState({ 
      currentCategory: pool[Math.floor(Math.random() * pool.length)],
      isCardVisible: true
    });
  };

  const handleLetterClick = (letter: string) => {
    if (blockedPlayers[activePlayerId]) {
       playSound(200, 'sawtooth', 0.1, 0.05);
       return;
    }

    if (penaltyTimerRef.current) {
      window.clearTimeout(penaltyTimerRef.current);
      penaltyTimerRef.current = null;
    }

    if (usedLetters[letter] !== undefined) {
      if (usedLetters[letter] === activePlayerId) {
        if (!canDeselect) return;
        const newUsed = { ...usedLetters };
        delete newUsed[letter];
        updateGameState({ usedLetters: newUsed });
        initAudio();
        playSound(300, 'square', 0.1, 0.05);
        return;
      } else {
        if (!canSteal) return;
        // Proceed to steal
      }
    }
    
    updateGameState({ usedLetters: { ...usedLetters, [letter]: activePlayerId } });
    initAudio(); 
    if (goldenLetters.includes(letter)) {
       playSound(1200, 'sine', 0.1, 0.1);
       setTimeout(() => playSound(1600, 'sine', 0.2, 0.1), 100);
    } else {
       playSound(1100); 
    }

    // Trigger local penalty if wrong click or something... wait, in original it was penaltyEnabled
    if (penaltyEnabled && status === 'playing') {
      penaltyTimerRef.current = window.setTimeout(() => {
        playSound(150, 'sawtooth', 0.5, 0.1); 
        setBlockedPlayers(prev => ({ ...prev, [activePlayerId]: 10 }));
      }, 3000);
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
        updateGameState({ 
          status: 'playing', 
          timerEndTime: Date.now() + timerDuration * 1000,
          usedLetters: {},
          goldenLetters: newGolden,
          isCardVisible: false
        });
        playSound(800, 'square', 0.1, 0.1);
    } else if (status === 'playing') {
        updateGameState({ status: 'finished' });
        playSound(200, 'sawtooth', 1.2, 0.15);
    }
  };

  const resetGame = () => {
    updateGameState({
       status: 'idle',
       usedLetters: {},
       currentCategory: null,
       isCardVisible: false
    });
    setBlockedPlayers({});
  };

  const leaveRoom = () => {
     updateDoc(doc(db, 'rooms', room.id), { status: 'lobby' }); // Let someone trigger go back to lobby
  };

  // --- SVG MATH HELPERS FOR DYNAMIC SLICES ---
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", x, y,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };

  const getPosition = (index: number) => {
    const angle = (index / ALPHABET.length) * 2 * Math.PI - Math.PI / 2;
    const radius = 42; 
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    const rotation = (index / ALPHABET.length) * 360;
    return { x, y, rotation };
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

  const getTeamScore = (tid: string) => {
    return Object.entries(usedLetters).reduce((score, [letter, id]) => {
      if (id === tid) {
        return score + (goldenLetters.includes(letter) ? 2 : 1);
      }
      return score;
    }, 0);
  };

  return (
    <div className={\`min-h-screen \${styles.bg} transition-colors duration-500 font-['Fredoka'] overflow-hidden select-none\`}>
      
      {/* Header */}
      <div className="absolute top-0 w-full p-4 flex justify-between items-center z-10">
         <button onClick={leaveRoom} className={\`w-10 h-10 flex items-center justify-center rounded-full \${styles.statsBg} shadow-sm hover:scale-110 active:scale-95 transition-transform\`}>
             <ArrowLeft size={20} className={styles.accent} />
         </button>
         <button onClick={() => setIsSoundEnabled(!isSoundEnabled)} className={\`w-10 h-10 flex items-center justify-center rounded-full \${styles.statsBg} shadow-sm hover:scale-110 active:scale-95 transition-transform\`}>
             {isSoundEnabled ? <Volume2 size={20} className={styles.text} /> : <VolumeX size={20} className="text-gray-400" />}
         </button>
      </div>

      <div className={\`w-full h-screen \${isLandscape ? 'flex flex-row p-6' : 'flex flex-col'}\`}>
        
        {/* --- LEFT / TOP: PLAYERS --- */}
        <div id={isLandscape ? "left-panel" : "top-players"} className={isLandscape ? "w-48 shrink-0 flex flex-col justify-center gap-4" : "w-full pt-16 px-4 pb-2 shrink-0 overflow-x-auto no-scrollbar"}>
            <div className={isLandscape ? "flex flex-col gap-3" : "flex gap-3 min-w-max pb-2"}>
                {players.map((player: any) => {
                   const isActive = activePlayerId === player.id;
                   const isBlocked = blockedPlayers[player.id] > 0;
                   return (
                     <div 
                        key={player.id} 
                        className={\`relative flex \${isLandscape ? 'flex-row' : 'flex-col'} items-center gap-2 p-2 rounded-2xl transition-all duration-300 \${isActive ? 'bg-white shadow-lg scale-110 z-10 ring-2 ring-blue-400' : 'bg-white/50 hover:bg-white/80'}\`}
                     >
                        <div className="relative">
                            <div className={\`w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md \${COLOR_MAP[player.color as keyof typeof COLOR_MAP]} \${isActive ? 'animate-bounce border-2 border-white' : ''}\`}>
                               {player.name.charAt(0).toUpperCase()}
                            </div>
                            {isBlocked && (
                                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse border border-white">
                                    {blockedPlayers[player.id]}
                                </div>
                            )}
                        </div>
                        <div className={\`flex flex-col \${isLandscape ? 'items-start' : 'items-center'}\`}>
                            <span className={\`text-[10px] font-black uppercase tracking-wider \${isActive ? 'text-gray-800' : 'text-gray-500'}\`}>
                                {player.name} {isActive ? '(Tú)' : ''}
                            </span>
                            <div className="flex items-center gap-1">
                                <span className={\`text-lg font-black leading-none \${isActive ? styles.accent : 'text-gray-400'}\`}>
                                    {getTeamScore(player.id)}
                                </span>
                                <span className="text-[9px] font-bold text-gray-400 uppercase">pts</span>
                            </div>
                        </div>
                     </div>
                   );
                })}
            </div>
        </div>

        {/* --- CENTER: BOARD --- */}
        <div id="board-area" className={\`relative flex-1 flex items-center justify-center \${isLandscape ? '' : 'my-2'}\`}>
            <div className={\`relative w-full max-w-[500px] aspect-square flex items-center justify-center\`}>
                
                {/* SVG Pizza Slices Background */}
                <div className="absolute inset-0 scale-[0.98] drop-shadow-xl">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        {ALPHABET.map((letter, index) => {
                            const anglePerSlice = 360 / ALPHABET.length;
                            const startAngle = index * anglePerSlice;
                            const endAngle = (index + 1) * anglePerSlice;
                            return (
                                <path 
                                    key={\`slice-\${letter}\`}
                                    d={describeArc(50, 50, 48, startAngle, endAngle)}
                                    fill={index % 2 === 0 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)"}
                                    stroke="rgba(0,0,0,0.05)"
                                    strokeWidth="0.5"
                                />
                            );
                        })}
                    </svg>
                </div>

                <div className="absolute inset-0 border-[6px] border-white/40 rounded-full pointer-events-none z-0"></div>

                {/* Letters */}
                {ALPHABET.map((letter, index) => {
                    const pos = getPosition(index);
                    const ownerId = usedLetters[letter];
                    const ownerColor = ownerId ? COLOR_MAP[players.find((p:any) => p.id === ownerId)?.color as keyof typeof COLOR_MAP] : undefined;
                    return (
                        <div 
                          key={letter}
                          className="absolute w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 -ml-4 -mt-4 sm:-ml-5 sm:-mt-5 md:-ml-6 md:-mt-6"
                          style={{
                              left: \`\${pos.x}%\`,
                              top: \`\${pos.y}%\`,
                          }}
                        >
                          <LetterButton 
                              letter={letter} 
                              isUsed={usedLetters[letter] !== undefined} 
                              ownerColor={ownerColor}
                              isGolden={goldenLetters.includes(letter)}
                              onClick={() => handleLetterClick(letter)} 
                              rotation={pos.rotation}
                          />
                        </div>
                    );
                })}

                {/* Center Control */}
                <div className="absolute w-[35%] h-[35%] bg-white rounded-full shadow-[0_0_30px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center z-20 border-4 border-gray-50 p-2">
                    <button 
                        onClick={() => status === 'playing' ? updateGameState({ status: 'finished' }) : handleTimerClick()}
                        className={\`w-full h-full rounded-full flex flex-col items-center justify-center transition-all \${status === 'playing' ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'}\`}
                    >
                        {status === 'playing' ? (
                            <>
                                <span className="text-3xl sm:text-4xl md:text-5xl font-black font-mono leading-none animate-pulse">{timeLeft}</span>
                            </>
                        ) : (
                            <>
                                <Play size={24} fill="currentColor" className="mb-1" />
                                <span className="text-[10px] font-black uppercase tracking-widest">INICIAR</span>
                            </>
                        )}
                    </button>
                    {status === 'finished' && (
                        <button 
                           onClick={resetGame}
                           className="absolute -bottom-4 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                        >
                            <RotateCcw size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* --- RIGHT / BOTTOM: CONTROLS --- */}
        <div id={isLandscape ? "right-panel" : "area-controls"} className={isLandscape ? "w-48 shrink-0 flex flex-col justify-center gap-6" : "w-full pb-6 px-4 shrink-0 flex gap-4 h-24"}>
            {/* Category Button */}
            <button 
                onClick={handleDrawCategory}
                className={\`flex-1 rounded-3xl \${mode === 'normal' ? 'bg-amber-400 hover:bg-amber-500' : mode === 'adult' ? 'bg-fuchsia-600 hover:bg-fuchsia-700' : 'bg-pink-500 hover:bg-pink-600'} text-white shadow-lg flex flex-col items-center justify-center border-4 border-white gap-1 active:scale-95 transition-all\`}
            >
                <Layers size={isLandscape ? 32 : 24} />
                <span className={\`font-black uppercase \${isLandscape ? 'text-sm' : 'text-[10px]'}\`}>Categoría</span>
            </button>
            
            {/* Big Timer Toggle */}
            <button 
                onClick={handleTimerClick}
                className={\`flex-1 rounded-3xl transition-all duration-300 shadow-lg flex flex-col items-center justify-center border-4 \${
                  status === 'playing' 
                   ? 'bg-red-50 border-red-500 hover:bg-red-100 shadow-red-200' 
                   : \`\${styles.statsBg} \${mode === 'normal' ? 'border-blue-200' : 'border-purple-500/30'} hover:scale-[1.02]\`
                }\`}
            >
                {status === 'playing' ? (
                    <div className="text-red-600 flex flex-col items-center">
                         <span className="text-4xl font-black font-mono leading-none">{timeLeft}</span>
                         <span className="text-[10px] font-black uppercase mt-0.5">SEGUNDOS</span>
                    </div>
                ) : (
                    <>
                        <Play size={28} className={\`\${styles.accent} mb-1\`} fill="currentColor" />
                        <span className="text-[10px] font-bold uppercase text-gray-400 mt-1 tracking-widest">JUGAR ({timerDuration}s)</span>
                    </>
                )}
            </button>
        </div>
      </div>

      <BastaOverlay 
         isVisible={status === 'finished'} 
         onClose={() => updateGameState({ status: 'idle' })} 
         winner={winner}
         isTie={isTie}
      />
      <CategoryCard 
         isVisible={isCardVisible} 
         onClose={() => updateGameState({ isCardVisible: false })} 
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
