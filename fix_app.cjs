const fs = require('fs');

let code = fs.readFileSync('App.tsx', 'utf8');

// Replace window.location.search = ... with replaceState so it doesn't reload and lose state
code = code.replace(
  /window\.location\.search = \`\?room=\$\{roomRef\.id\}\`;/g,
  "window.history.replaceState({}, '', `?room=${roomRef.id}`); setRoomId(roomRef.id);"
);

fs.writeFileSync('App.tsx', code);
