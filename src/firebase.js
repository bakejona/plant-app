// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; 
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

// 2. INITIALIZE the service using the imported function
// Line 22 (or where you are calling it)
export const analytics = getAnalytics(app); 

export default app;