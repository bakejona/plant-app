// src/firebase.js

import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
// import { getAnalytics } from 'firebase/analytics'; // 1. Comment out Analytics for now (it causes noise in dev)

const firebaseConfig = {
  apiKey: "AIzaSyBf_phvC_Iu-C1p5MWsGI5jJJqBOCmoiKU",
  authDomain: "fir-setup-f2b47.firebaseapp.com",
  databaseURL: "https://fir-setup-f2b47-default-rtdb.firebaseio.com",
  projectId: "fir-setup-f2b47",
  storageBucket: "fir-setup-f2b47.firebasestorage.app",
  messagingSenderId: "148801068267",
  appId: "1:148801068267:web:bb6bfe18f1ce56c04bb2ae",
  measurementId: "G-8FYP9F0TTD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Separate app instance for RTDB — no auth attached, so emulator tokens
// are never sent to production RTDB (which would cause an auth warning).
const rtdbApp = initializeApp(firebaseConfig, 'rtdb');

// Initialize and export services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(rtdbApp);
// export const analytics = getAnalytics(app); // Disabled for local dev

// ----------------------------------------------------
// ⚠️ ENVIRONMENT CHECK: Connect to Local Emulators
// ----------------------------------------------------
// We check if we are in dev mode (npm run dev)
if (import.meta.env.DEV) { 
  // 2. THESE PORTS MUST MATCH YOUR TERMINAL OUTPUT EXACTLY
  const FIRESTORE_PORT = 8085;

  connectFirestoreEmulator(db, '127.0.0.1', FIRESTORE_PORT);

  // Auth, Storage, RTDB → production
  console.log(`✅ Firestore → emulator :${FIRESTORE_PORT}`);
  console.log(`✅ Auth, Storage, RTDB → production`);
}

export default app;