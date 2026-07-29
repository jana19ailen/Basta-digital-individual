
import React from 'react';

interface BastaOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  winner: any | null; // Receives the Team object
  isTie: boolean;
}

const BastaOverlay: React.FC<BastaOverlayProps> = ({ isVisible, onClose, winner, isTie }) => {
  if (!isVisible) return null;

  // Determine background color based on winner
  // Default to a dark slate for ties, otherwise use the winner's background color
  const bgColor = isTie || !winner ? 'bg-slate-800' : winner.color;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center ${bgColor} bg-opacity-95 animate-[pulse_0.5s_infinite] transition-colors duration-500`}
      onClick={onClose}
    >
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
          }
          .animate-shake {
            animation: shake 0.2s ease-in-out infinite;
          }
        `}
      </style>
      <div className="text-center px-4 animate-shake w-full">
        {isTie ? (
           <h1 className="text-6xl md:text-9xl font-black text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] leading-tight">
             ¡EMPATE!
           </h1>
        ) : (
           <div className="flex flex-col items-center gap-4">
              <h2 className="text-3xl md:text-4xl font-black text-white/90 drop-shadow-md uppercase tracking-widest">
                GANÓ EL COLOR
              </h2>
              <h1 className="text-6xl md:text-9xl font-black text-white drop-shadow-[0_6px_0_rgba(0,0,0,0.3)] leading-none stroke-black">
                {winner?.label}
              </h1>
           </div>
        )}
        
        <div className="mt-12">
          <span className="bg-white text-black px-8 py-3 rounded-full text-xl md:text-2xl font-black shadow-2xl animate-bounce inline-block cursor-pointer hover:scale-105 transition-transform">
            TOCA PARA CONTINUAR
          </span>
        </div>
      </div>
    </div>
  );
};

export default BastaOverlay;