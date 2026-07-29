const fs = require('fs');

let code = fs.readFileSync('components/GameBoard.tsx', 'utf8');

const oldMap = `{ALPHABET.map((letter, index) => {
                    const pos = getPosition(index);
                    const ownerId = usedLetters[letter];
                    const ownerColor = ownerId ? COLOR_MAP[players.find((p:any) => p.id === ownerId)?.color as keyof typeof COLOR_MAP] : undefined;
                    return (
                        <div 
                          key={letter}
                          className="absolute w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 -ml-4 -mt-4 sm:-ml-5 sm:-mt-5 md:-ml-6 md:-mt-6"
                          style={{
                              left: \`\${pos.x}%\`,
                              top: \`\${pos.y}%\`,
                          }}
                        >
                          <LetterButton 
                              letter={letter} 
                              isUsed={usedLetters[letter] !== undefined} 
                              ownerColor={ownerColor}
                              isGolden={goldenLetters.includes(letter)}
                              onClick={() => handleLetterClick(letter)} 
                              rotation={pos.rotation}
                          />
                        </div>
                    );
                })}`;

const newMap = `{ALPHABET.map((letter, index) => {
                    const pos = getPosition(index);
                    const ownerId = usedLetters[letter];
                    const ownerColor = ownerId ? COLOR_MAP[players.find((p:any) => p.id === ownerId)?.color as keyof typeof COLOR_MAP] : undefined;
                    return (
                        <LetterButton 
                            key={letter}
                            letter={letter} 
                            isUsed={usedLetters[letter] !== undefined} 
                            ownerColor={ownerColor}
                            isActive={true}
                            isGolden={goldenLetters.includes(letter)}
                            onClick={() => handleLetterClick(letter)} 
                            position={pos}
                            rotation={pos.rotation}
                        />
                    );
                })}`;

code = code.replace(oldMap, newMap);
fs.writeFileSync('components/GameBoard.tsx', code);
