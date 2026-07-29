const fs = require('fs');

let code = fs.readFileSync('components/LetterButton.tsx', 'utf8');
code = code.replace(/text-xl sm:text-2xl md:text-3xl/g, "text-base sm:text-xl md:text-2xl");
code = code.replace(/rounded-2xl/g, "rounded-xl");
fs.writeFileSync('components/LetterButton.tsx', code);

let gameBoard = fs.readFileSync('components/GameBoard.tsx', 'utf8');
gameBoard = gameBoard.replace(/grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2 md:gap-3 lg:gap-4 w-full p-2 auto-rows-fr/g, "grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-1 sm:gap-2 md:gap-3 w-full p-1 auto-rows-fr max-w-3xl mx-auto");

// Remove the Basta button from Right controls
gameBoard = gameBoard.replace(/{status === 'playing' \? \([\s\S]*?\) : status === 'finished' \? \(/g, "{status === 'finished' ? (");

// Remove the mobile floating Basta button
gameBoard = gameBoard.replace(/{\/\* Floating Basta Button on Mobile when Playing \*\/}[\s\S]*?{\/\* Floating Reset Button on Mobile when Finished \*\/}/, "{/* Floating Reset Button on Mobile when Finished */}");

fs.writeFileSync('components/GameBoard.tsx', gameBoard);
