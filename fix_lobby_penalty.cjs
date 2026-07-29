const fs = require('fs');
let code = fs.readFileSync('components/Lobby.tsx', 'utf8');
code = code.replace(/<label className="flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer hover:bg-gray-50">\s*<span className="font-semibold text-gray-700">Penalización por Error<\/span>\s*<input type="checkbox" checked=\{rules\.penaltyEnabled\} onChange=\{\(\) => toggleRule\('penaltyEnabled'\)\} className="w-6 h-6 rounded text-blue-600 focus:ring-blue-500" \/>\s*<\/label>/g, "");
fs.writeFileSync('components/Lobby.tsx', code);

let code2 = fs.readFileSync('components/VotingModal.tsx', 'utf8');
code2 = code2.replace(/<p>Penalización: \{room\.rules\.penaltyEnabled \? '✅' : '❌'\}<\/p>/g, "");
fs.writeFileSync('components/VotingModal.tsx', code2);
