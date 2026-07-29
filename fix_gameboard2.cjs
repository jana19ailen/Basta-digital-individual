const fs = require('fs');
let code = fs.readFileSync('components/GameBoard.tsx', 'utf8');

// Add deleteField to imports
code = code.replace(
  /import \{ doc, updateDoc \} from 'firebase\/firestore';/,
  "import { doc, updateDoc, deleteField } from 'firebase/firestore';"
);

// Fix the deleteField usage
code = code.replace(
  /import\("firebase\/firestore"\)\.then\(m => m\.deleteField\(\)\)/g,
  "deleteField()"
);

fs.writeFileSync('components/GameBoard.tsx', code);
