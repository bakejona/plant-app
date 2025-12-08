// src/firebase.js

import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'; 
import { getAuth, connectAuthEmulator } from 'firebase/auth';             
import { getStorage, connectStorageEmulator } from 'firebase/storage';     
// import { getAnalytics } from 'firebase/analytics'; // 1. Comment out Analytics for now (it causes noise in dev)

const firebaseConfig = {
  apiKey: "AIzaSyBf_phvC_Iu-C1p5MWsGI5jJJqBOCmoiKU",
  authDomain: "fir-setup-f2b47.firebaseapp.com",
  projectId: "fir-setup-f2b47",
  storageBucket: "fir-setup-f2b47.firebasestorage.app",
  messagingSenderId: "148801068267",
  appId: "1:148801068267:web:bb6bfe18f1ce56c04bb2ae",
  measurementId: "G-8FYP9F0TTD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export services
export const db = getFirestore(app); 
export const auth = getAuth(app);
export const storage = getStorage(app); 
// export const analytics = getAnalytics(app); // Disabled for local dev

// ----------------------------------------------------
// ⚠️ ENVIRONMENT CHECK: Connect to Local Emulators
// ----------------------------------------------------
// We check if we are in dev mode (npm run dev)
if (import.meta.env.DEV) { 
  // 2. THESE PORTS MUST MATCH YOUR TERMINAL OUTPUT EXACTLY
  const AUTH_PORT = 9102;      
  const FIRESTORE_PORT = 8085; 
  const STORAGE_PORT = 9199;   

  // 3. 🏆 CRITICAL FIX: Use '127.0.0.1' instead of 'localhost'
  // This prevents the SDK from getting confused and hitting the real internet.
  
  // Auth needs the full URL
  connectAuthEmulator(auth, `http://127.0.0.1:${AUTH_PORT}`);

  // Firestore needs host and port separate
  connectFirestoreEmulator(db, '127.0.0.1', FIRESTORE_PORT);

  // Storage needs host and port separate
  connectStorageEmulator(storage, '127.0.0.1', STORAGE_PORT);

  console.log(`✅ Connected to Emulators on 127.0.0.1: Auth:${AUTH_PORT}, Firestore:${FIRESTORE_PORT}`);
}

export default app;