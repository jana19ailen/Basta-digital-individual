const fs = require('fs');

let code = fs.readFileSync('components/Lobby.tsx', 'utf8');

// Remove local state rules and use room.rules directly
code = code.replace(
  /const \[rules, setRules\] = useState\(room\.rules\);/g,
  "const rules = room.rules;"
);

// Update toggleRule to update firestore directly
code = code.replace(
  /const toggleRule = \(key: keyof typeof rules\) => \{\n\s*setRules\(prev => \(\{ \.\.\.prev, \[key\]: !prev\[key\] \}\)\);\n\s*\};/g,
  "const toggleRule = (key: keyof typeof rules) => { updateDoc(doc(db, 'rooms', room.id), { [`rules.${key}`]: !rules[key] }); };"
);

// Update select to update firestore
code = code.replace(
  /onChange=\{e => setRules\(prev => \(\{\.\.\.prev, mode: e\.target\.value as any\}\)\)\}/g,
  "onChange={e => updateDoc(doc(db, 'rooms', room.id), { 'rules.mode': e.target.value })}"
);

code = code.replace(
  /onChange=\{e => setRules\(prev => \(\{\.\.\.prev, timerDuration: parseInt\(e\.target\.value\) \|\| 60\}\)\)\}/g,
  "onChange={e => updateDoc(doc(db, 'rooms', room.id), { 'rules.timerDuration': parseInt(e.target.value) || 60 })}"
);

// Update handlePropose since rules is now live
code = code.replace(
  /rules: rules,\n\s*proposerId: playerId/g,
  "proposerId: playerId"
);

fs.writeFileSync('components/Lobby.tsx', code);
