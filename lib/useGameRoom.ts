import { useState, useEffect } from 'react';
import { db } from './firebase';
import { 
  collection, doc, onSnapshot, setDoc, updateDoc, 
  serverTimestamp, getDoc, deleteDoc
} from 'firebase/firestore';

export interface RoomState {
  id: string;
  status: 'lobby' | 'voting' | 'playing';
  rules: {
    canSteal: boolean;
    canDeselect: boolean;
    goldenLettersEnabled: boolean;
    penaltyEnabled: boolean;
    mode: 'normal' | 'adult' | 'mixed';
    timerDuration: number;
  };
  proposerId: string | null;
  gameState?: any;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  vote: 'pending' | 'yes' | 'no';
}

export function useGameRoom(roomId: string | null, playerId: string | null) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const roomRef = doc(db, 'rooms', roomId);
    
    // Subscribe to room
    const unsubRoom = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        setRoom({ id: docSnap.id, ...docSnap.data() } as RoomState);
      } else {
        setRoom(null);
      }
      setLoading(false);
    });

    // Subscribe to players
    const playersRef = collection(db, 'rooms', roomId, 'players');
    const unsubPlayers = onSnapshot(playersRef, (snapshot) => {
      const ps: Player[] = [];
      snapshot.forEach(d => {
        ps.push({ id: d.id, ...d.data() } as Player);
      });
      setPlayers(ps);
    });

    return () => {
      unsubRoom();
      unsubPlayers();
    };
  }, [roomId]);

  return { room, players, loading };
}
