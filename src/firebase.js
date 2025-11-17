// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'; 
import { getAuth, connectAuthEmulator } from 'firebase/auth';             
import { getStorage, connectStorageEmulator } from 'firebase/storage';     
import { getAnalytics } from 'firebase/analytics';

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
export const storage = getStorage(app); // ⬅️ NEW: Initialize Storage Service
// 2. INITIALIZE the service using the imported function
// Line 22 (or where you are calling it)
export const analytics = getAnalytics(app); 

// ----------------------------------------------------
// ⚠️ ENVIRONMENT CHECK: Connect to Local Emulators
// ----------------------------------------------------
// This critical block ensures all SDKs point to the local ports.
if (import.meta.env.DEV) { 
  const AUTH_PORT = 9102;      
  const FIRESTORE_PORT = 8082; 
  const STORAGE_PORT = 9199;   

  // Connect Auth to local emulator
  connectAuthEmulator(auth, `http://localhost:${AUTH_PORT}`);

  // Connect Firestore to local emulator
  connectFirestoreEmulator(db, 'localhost', FIRESTORE_PORT);

  // ⬅️ CRITICAL FIX: Connect Storage to local emulator
  connectStorageEmulator(storage, 'localhost', STORAGE_PORT);

  console.log(`Firebase SDK connected to local emulators: Auth:${AUTH_PORT}, Firestore:${FIRESTORE_PORT}, Storage:${STORAGE_PORT}`);
}

export default app;