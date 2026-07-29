import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0844601084",
  appId: "1:475116779700:web:f1938f016d4e19bb523fe1",
  apiKey: "AIzaSyBtZ_0q1g_hlXUI8-ttT5CH4RnhbE08-BU",
  authDomain: "gen-lang-client-0844601084.firebaseapp.com",
  storageBucket: "gen-lang-client-0844601084.firebasestorage.app",
  messagingSenderId: "475116779700",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-bastadigitalpara-ccf4a384-744a-4184-b755-507b80bbd628");
