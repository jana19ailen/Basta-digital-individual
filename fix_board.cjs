const fs = require('fs');
let code = fs.readFileSync('components/GameBoard.tsx', 'utf8');

code = code.replace(/if \(activePlayerId === null\) \{/g, 'if (!activePlayerId) {');
code = code.replace(/\{currentTeams\.slice\(0, numPlayers\)/g, '{players');
code = code.replace(/team =>/g, 'player =>');
code = code.replace(/const isActive = activePlayerId === team\.id;/g, 'const isActive = activePlayerId === player.id;');
code = code.replace(/<div className=\{\`w-6 h-6 rounded-full \$\{team\.color\} \$\{isActive \? 'animate-bounce shadow-md border-2 border-white' : ''\}\`\} \/>/g, '<div className={`w-6 h-6 rounded-full ${COLOR_MAP[player.color as keyof typeof COLOR_MAP]} ${isActive ? "animate-bounce shadow-md border-2 border-white" : ""}`} />');
code = code.replace(/<span className=\{\`text-xs font-black uppercase \$\{isActive \? 'text-gray-800' : 'text-gray-400'\}\`\}>/g, '<span className={`text-xs font-black uppercase ${isActive ? "text-gray-800" : "text-gray-400"}`}>');
code = code.replace(/\{team\.label\}/g, '{player.name}');
code = code.replace(/ownerColor=\{ownerId !== undefined \? currentTeams\[ownerId\]\.color : undefined\}/g, 'ownerColor={ownerId ? COLOR_MAP[players.find((p:any) => p.id === ownerId)?.color as keyof typeof COLOR_MAP] : undefined}');
code = code.replace(/const currentTeams = mode === 'adult' \? TEAMS_ADULT : TEAMS;/g, "const COLOR_MAP = { rojo: 'bg-red-500', azul: 'bg-blue-500', verde: 'bg-green-500', amarillo: 'bg-yellow-500', naranja: 'bg-orange-500', violeta: 'bg-purple-600' };");
code = code.replace(/<div className=\{\`w-3 h-3 rounded-full \$\{currentTeams\[activePlayerId\]\.color\} animate-pulse\`\}><\/div>/g, '<div className={`w-3 h-3 rounded-full ${COLOR_MAP[players.find((p:any) => p.id === activePlayerId)?.color as keyof typeof COLOR_MAP]} animate-pulse`}></div>');
code = code.replace(/if \(playerId < numPlayers\) \{/g, 'if (playerId) {');
code = code.replace(/scores\[playerId\] \+= goldenLetters\.includes\(letter\) \? 2 : 1;/g, 'scores[playerId] = (scores[playerId] || 0) + (goldenLetters.includes(letter) ? 2 : 1);');
code = code.replace(/const scores = new Array\(numPlayers\)\.fill\(0\);/g, 'const scores: Record<string, number> = {};');
code = code.replace(/const maxScore = Math\.max\(\.\.\.scores\);/g, 'const maxScore = Math.max(0, ...Object.values(scores));');
code = code.replace(/const winners = scores\s*\n\s*\.map\(\(score, index\) => score === maxScore \? index : -1\)\s*\n\s*\.filter\(index => index !== -1\);/g, 'const winners = Object.entries(scores).filter(([id, score]) => score === maxScore).map(([id]) => id);');
code = code.replace(/if \(winners\.length === 1\) return \{ winner: currentTeams\[winners\[0\]\], isTie: false \};/g, 'if (winners.length === 1) { const wp = players.find((p:any)=>p.id===winners[0]); return { winner: { label: wp?.name, color: COLOR_MAP[wp?.color as keyof typeof COLOR_MAP] }, isTie: false }; }');
code = code.replace(/return \{ winner: currentTeams\[0\], isTie: true \};/g, 'return { winner: { label: "Empate", color: "bg-gray-500" }, isTie: true };');
code = code.replace(/key=\{team\.id\}/g, 'key={player.id}');

fs.writeFileSync('components/GameBoard.tsx', code);
