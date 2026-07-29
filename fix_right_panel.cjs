const fs = require('fs');

let gameBoard = fs.readFileSync('components/GameBoard.tsx', 'utf8');

const oldPanelMatch = gameBoard.match(/\{\/\* Right: Controls Panel \*\/\}[\s\S]*?\{\/\* Floating Reset Button on Mobile when Finished \*\/\}/);
if (oldPanelMatch) {
  const newPanel = `{/* Right: Controls Panel */}
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
            
            {/* Reset */}
            {status === 'finished' ? (
               <button 
                  onClick={resetGame}
                  className="hidden lg:flex w-full py-4 bg-gray-800 text-white font-black rounded-2xl shadow-md justify-center items-center gap-2 hover:bg-gray-900 transition-colors"
               >
                   <RotateCcw size={20} /> Nueva Ronda
               </button>
            ) : null}

        </div>
      </div>

      {/* Floating Reset Button on Mobile when Finished */}`;
  
  gameBoard = gameBoard.replace(oldPanelMatch[0], newPanel);
  fs.writeFileSync('components/GameBoard.tsx', gameBoard);
} else {
  console.log("Could not find the panel to replace");
}
