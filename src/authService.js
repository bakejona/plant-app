// src/authService.js

// Import the 'auth' instance you initialized in firebase.js
import { auth } from './firebase'; 
import { createOrUpdateUserProfile } from './userService'; 

// Import the necessary Auth functions from the modular SDK
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,     
  signInWithPopup,
  sendPasswordResetEmail, // ⬅️ NEW IMPORT
} from 'firebase/auth';

/**
 * Maps Firebase error codes to user-friendly messages.
 * @param {string} code - Firebase error code (e.g., 'auth/user-not-found').
 * @returns {string} User-friendly message.
 */
function getErrorMessage(code) {
    switch (code) {
        case 'auth/user-not-found':
            return 'No user found with that email address.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/invalid-credential':
             return 'Invalid email or password.';
        case 'auth/email-already-in-use':
            return 'This email is already in use.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        default:
            return 'An unknown error occurred. Please try again.';
    }
}

/**
 * Sends a password reset email to the user.
 * @param {string} email 
 * @returns {Promise<void>}
 */
export async function sendPasswordReset(email) { // ⬅️ NEW FUNCTION
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true, message: `Password reset email sent to ${email}!` };
    } catch (error) {
        const message = getErrorMessage(error.code);
        console.error('Password reset error:', error.message);
        throw new Error(message);
    }
}

/**
 * Signs up a new user with email and password and creates a Firestore profile.
 * @param {string} email 
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
export async function signUp(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await createOrUpdateUserProfile(userCredential.user);
    console.log('User signed up successfully:', userCredential.user);
    return userCredential;
  } catch (error) {
    // ⬅️ UPDATED: Use helper function for user-friendly error
    throw new Error(getErrorMessage(error.code));
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
    await createOrUpdateUserProfile(userCredential.user);
    console.log('User signed in successfully:', userCredential.user);
    return userCredential;
  } catch (error) {
    // ⬅️ UPDATED: Use helper function for user-friendly error
    throw new Error(getErrorMessage(error.code));
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
    await createOrUpdateUserProfile(result.user);
    console.log('Google Sign In successful:', result.user);
    return result;
  } catch (error) {
    // ⬅️ UPDATED: Use helper function for user-friendly error
    throw new Error(getErrorMessage(error.code));
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