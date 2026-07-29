
export type GameStatus = 'idle' | 'playing' | 'finished';
export type GameMode = 'normal' | 'adult' | 'mixed';

export interface GameState {
  usedLetters: string[];
  activeLetter: string | null;
  status: GameStatus;
  timerDuration: number;
  timeLeft: number;
  mode: GameMode;
}
