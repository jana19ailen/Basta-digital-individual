const fs = require('fs');

let code = fs.readFileSync('components/GameBoard.tsx', 'utf8');

// Replace handleLetterClick to update individual letters instead of replacing the whole object
code = code.replace(
  /updateGameState\(\{ usedLetters: \{ \.\.\.usedLetters, \[letter\]: activePlayerId \} \}\);/g,
  'updateDoc(doc(db, "rooms", room.id), { [`gameState.usedLetters.${letter}`]: activePlayerId });'
);

code = code.replace(
  /const newUsed = \{ \.\.\.usedLetters \};\n\s*delete newUsed\[letter\];\n\s*updateGameState\(\{ usedLetters: newUsed \}\);/g,
  'updateDoc(doc(db, "rooms", room.id), { [`gameState.usedLetters.${letter}`]: import("firebase/firestore").then(m => m.deleteField()) });'
);

fs.writeFileSync('components/GameBoard.tsx', code);
