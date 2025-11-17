// src/authService.js

// Import the 'auth' instance you initialized in firebase.js
import { auth } from './firebase'; 
import { createOrUpdateUserProfile } from './userService'; // ⬅️ NEW IMPORT

// Import the necessary Auth functions from the modular SDK
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,     
  signInWithPopup         
} from 'firebase/auth';

/**
 * Signs up a new user with email and password and creates a Firestore profile.
 * @param {string} email 
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
export async function signUp(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // CALL FIRESTORE FUNCTION AFTER SUCCESSFUL SIGN UP
    await createOrUpdateUserProfile(userCredential.user);
    
    console.log('User signed up successfully:', userCredential.user);
    return userCredential;
  } catch (error) {
    console.error('Sign up error:', error.message);
    throw error; // Re-throw the error for the component to handle
  }
}

/**
 * Signs in an existing user with email and password and ensures a Firestore profile exists.
 * @param {string} email 
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // ⬅️ CALL FIRESTORE FUNCTION AFTER SUCCESSFUL SIGN IN
    await createOrUpdateUserProfile(userCredential.user);

    console.log('User signed in successfully:', userCredential.user);
    return userCredential;
  } catch (error) {
    console.error('Sign in error:', error.message);
    throw error;
  }
}

/**
 * Signs in a user using a Google pop-up window and ensures a Firestore profile exists.
 * @returns {Promise<UserCredential>}
 */
export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    // ⬅️ CALL FIRESTORE FUNCTION AFTER SUCCESSFUL GOOGLE SIGN IN
    await createOrUpdateUserProfile(result.user);
    
    console.log('Google Sign In successful:', result.user);
    return result;
  } catch (error) {
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