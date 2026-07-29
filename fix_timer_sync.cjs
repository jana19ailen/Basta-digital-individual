const fs = require('fs');

let gameBoard = fs.readFileSync('components/GameBoard.tsx', 'utf8');
gameBoard = gameBoard.replace(
  /const remaining = Math\.max\(0, Math\.ceil\(\(timerEndTime - Date\.now\(\)\) \/ 1000\)\);/g,
  "const remaining = Math.max(0, Math.min(timerDuration, Math.ceil((timerEndTime - Date.now()) / 1000)));"
);

fs.writeFileSync('components/GameBoard.tsx', gameBoard);
