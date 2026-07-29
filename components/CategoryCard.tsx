
import React from 'react';
import { X, RefreshCw, Layers, Flame, Shuffle } from 'lucide-react';
import { GameMode } from '../types';

interface CategoryCardProps {
  isVisible: boolean;
  onClose: () => void;
  onDraw: () => void;
  currentCategory: string | null;
  mode: GameMode;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ isVisible, onClose, onDraw, currentCategory, mode }) => {
  if (!isVisible) return null;

  const getTheme = () => {
    switch(mode) {
      case 'adult': return {
        border: 'border-fuchsia-600',
        bg: 'radial-gradient(circle at center, #2d0b2e 0%, #1a061b 100%)',
        accent: 'text-fuchsia-400',
        text: 'text-white',
        btn: 'bg-fuchsia-600 hover:bg-fuchsia-700 shadow-[0_8px_0_#701a75]',
        btnActive: 'active:shadow-[0_4px_0_#701a75]',
        label: '+18 ADULTOS'
      };
      case 'mixed': return {
        border: 'border-pink-500',
        bg: 'radial-gradient(circle at center, #311b52 0%, #201135 100%)',
        accent: 'text-pink-300',
        text: 'text-white',
        btn: 'bg-pink-500 hover:bg-pink-600 shadow-[0_8px_0_#9d174d]',
        btnActive: 'active:shadow-[0_4px_0_#9d174d]',
        // Added missing quotes around string value
        label: 'MEZCLA CALIENTE'
      };
      default: return {
        border: 'border-amber-500',
        bg: 'radial-gradient(circle at center, #ffffff 0%, #fffbeb 100%)',
        accent: 'text-amber-500',
        text: 'text-blue-900',
        btn: 'bg-amber-500 hover:bg-amber-600 shadow-[0_8px_0_#d97706]',
        btnActive: 'active:shadow-[0_4px_0_#d97706]',
        label: 'NORMAL'
      };
    }
  };

  const theme = getTheme();

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300">
      <div 
        className={`relative w-full max-w-sm aspect-[3/4] rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-between p-8 border-[12px] ${theme.border} overflow-hidden animate-[scaleIn_0.3s_ease-out]`}
        style={{ backgroundImage: theme.bg }}
      >
        <style>
          {`
            @keyframes scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            @keyframes cardFlip { 0% { transform: rotateY(0deg); } 50% { transform: rotateY(90deg); } 100% { transform: rotateY(0deg); } }
            .animate-flip { animation: cardFlip 0.4s ease-in-out; }
          `}
        </style>

        {/* Header */}
        <div className="w-full flex justify-between items-center mb-4">
          <div className="flex gap-1">
            <div className={`w-3 h-3 rounded-full ${mode === 'normal' ? 'bg-amber-400' : 'bg-fuchsia-400'}`}></div>
            <div className={`w-3 h-3 rounded-full ${mode === 'normal' ? 'bg-amber-300' : 'bg-fuchsia-300'}`}></div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-full hover:bg-white/10 ${theme.accent} transition-colors`}>
            <X size={28} />
          </button>
        </div>

        {/* Card Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 w-full">
          {currentCategory ? (
            <div className="animate-flip">
              <span className={`${theme.accent} font-bold text-[10px] uppercase tracking-[0.2em] mb-4 block`}>Consigna {theme.label}</span>
              <h2 className={`text-3xl md:text-4xl font-black ${theme.text} leading-tight`}>
                {currentCategory}
              </h2>
            </div>
          ) : (
            <div className="flex flex-col items-center opacity-40">
              {mode === 'adult' ? <Flame size={80} className="text-fuchsia-400" /> : mode === 'mixed' ? <Shuffle size={80} className="text-pink-400" /> : <Layers size={80} className="text-amber-300" />}
              <p className={`${theme.text} font-bold text-xl mt-4`}>Toca para sacar carta</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-8 w-full">
          <button
            onClick={onDraw}
            className={`w-full py-5 ${theme.btn} text-white rounded-2xl font-black text-xl ${theme.btnActive} active:translate-y-1 transition-all flex items-center justify-center gap-3 group`}
          >
            <RefreshCw size={24} className="group-active:rotate-180 transition-transform duration-500" />
            {currentCategory ? "OTRA CARTA" : "EMPEZAR"}
          </button>
          <p className={`text-center ${theme.accent} text-[10px] font-bold uppercase mt-6 tracking-widest`}>
            MAZO {theme.label}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategoryCard;
