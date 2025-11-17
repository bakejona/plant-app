// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'; // ⬅️ UPDATED: Added connectFirestoreEmulator
import { getAuth, connectAuthEmulator } from 'firebase/auth';             // ⬅️ UPDATED: Added connectAuthEmulator
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
export const analytics = getAnalytics(app); 

// ----------------------------------------------------
// ⚠️ ENVIRONMENT CHECK: Connect to Local Emulators
// ----------------------------------------------------
// This block must run in development only.
if (import.meta.env.DEV) { 
  // Get ports from firebase.json for consistency (or use the known ports)
  const AUTH_PORT = 9101;    // Changed in the previous step
  const FIRESTORE_PORT = 8081; // Changed in the previous step

  // Connect Auth to local emulator
  connectAuthEmulator(auth, `http://localhost:${AUTH_PORT}`);

  // Connect Firestore to local emulator
  connectFirestoreEmulator(db, 'localhost', FIRESTORE_PORT);

  console.log(`Firebase SDK connected to local emulators: Auth:${AUTH_PORT}, Firestore:${FIRESTORE_PORT}`);
}

export default app;