const fs = require('fs');

let code = fs.readFileSync('components/Lobby.tsx', 'utf8');

code = code.replace(
  /const toggleRule = \(key: keyof typeof rules\) => \{ updateDoc\(doc\(db, 'rooms', room\.id\), \{ \[\`rules\.\$\{key\}\`\]: !rules\[key\] \}\); \};/g,
  "const toggleRule = (key: keyof typeof rules) => { updateDoc(doc(db, 'rooms', room.id), { [`rules.${String(key)}`]: !rules[key] }); };"
);

fs.writeFileSync('components/Lobby.tsx', code);
