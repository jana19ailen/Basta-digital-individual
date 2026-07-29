import React, { useState } from 'react';

interface LetterButtonProps {
  letter: string;
  isUsed: boolean;
  ownerColor?: string;
  isActive: boolean;
  isGolden?: boolean;
  onClick: (letter: string) => void;
}

const LetterButton: React.FC<LetterButtonProps> = ({ 
  letter, 
  isUsed, 
  ownerColor,
  isActive, 
  isGolden = false,
  onClick
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (!isUsed) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }
    onClick(letter);
  };

  const baseStyles = "relative flex items-center justify-center rounded-xl text-base sm:text-xl md:text-2xl font-black transition-all duration-300 cursor-pointer shadow-md select-none border-2 aspect-square w-full h-full";
  
  let stateStyles = "";
  if (isUsed && ownerColor) {
    stateStyles = `${ownerColor} border-white text-white shadow-sm scale-[0.95] drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] z-0`;
  } else if (isUsed) {
    stateStyles = "bg-red-100 border-red-200 text-red-300 cursor-not-allowed shadow-inner scale-[0.95] z-0";
  } else {
    stateStyles = isGolden 
      ? "bg-gradient-to-br from-yellow-300 to-amber-500 border-yellow-200 text-yellow-900 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(251,191,36,0.8)] z-10"
      : "bg-white border-white text-blue-600 hover:text-blue-700 hover:scale-105 active:scale-95 shadow-[0_4px_10px_rgba(0,0,0,0.1)] z-10";
  }

  return (
    <button
      onClick={handleClick}
      className={`${baseStyles} ${stateStyles}`}
    >
      {isAnimating && (
        <span className="absolute inset-0 w-full h-full rounded-xl bg-blue-400 animate-ping opacity-30"></span>
      )}
      {letter}
    </button>
  );
};

export default LetterButton;
