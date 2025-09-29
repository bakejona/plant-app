// src/authService.js

// Import the 'auth' instance you initialized in firebase.js
import { auth } from './firebase'; 

// Import the necessary Auth functions from the modular SDK
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  // New imports for Google Sign-In
  GoogleAuthProvider,     
  signInWithPopup         
} from 'firebase/auth';

/**
 * Signs up a new user with email and password.
 * @param {string} email 
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
export async function signUp(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User signed up successfully:', userCredential.user);
    return userCredential;
  } catch (error) {
    console.error('Sign up error:', error.message);
    throw error; // Re-throw the error for the component to handle
  }
}

/**
 * Signs in an existing user with email and password.
 * @param {string} email 
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User signed in successfully:', userCredential.user);
    return userCredential;
  } catch (error) {
    console.error('Sign in error:', error.message);
    throw error;
  }
}

/**
 * Signs in a user using a Google pop-up window.
 * @returns {Promise<UserCredential>}
 */
export async function signInWithGoogle() {
  try {
    // 1. Create a Google Auth Provider instance
    const provider = new GoogleAuthProvider();
    
    // 2. Open the sign-in pop-up
    const result = await signInWithPopup(auth, provider);
    
    // The signed-in user info.
    const user = result.user; 
    
    console.log('Google Sign In successful:', user);
    return result;
  } catch (error) {
    // Handle specific errors like the pop-up being closed or permission denied
    console.error('Google Sign In error:', error.message);
    throw error;
  }
}

/**
 * Signs out the currently signed-in user.
 * @returns {Promise<void>}
 */
export async function signOutUser() {
  try {
    await signOut(auth);
    console.log('User signed out successfully.');
  } catch (error) {
    console.error('Sign out error:', error.message);
    throw error;
  }
}