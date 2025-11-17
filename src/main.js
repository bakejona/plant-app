import './style.css' 
// main.js

// --------------------------------------------------
// 1. IMPORTS
// --------------------------------------------------

// Import the necessary Auth instance from your initialized firebase file
import { auth } from './firebase.js'; 

// Import the specific authentication functions, including the new one
import { signUp, signIn, signOutUser, signInWithGoogle } from './authService.js';

// Import the state listener
import { onAuthStateChanged } from 'firebase/auth';

// --------------------------------------------------
// 2. DOM ELEMENT REFERENCES
// --------------------------------------------------

const authForms = document.getElementById('auth-forms');
const userControls = document.getElementById('user-controls');
const authStatus = document.getElementById('auth-status');
const userEmailDisplay = document.getElementById('user-email-display');

const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const signinEmailInput = document.getElementById('signin-email');
const signinPasswordInput = document.getElementById('signin-password');

// ADDED REFERENCE FOR GOOGLE BUTTON
const googleSignInButton = document.getElementById('google-signin-button');


// --------------------------------------------------
// 3. EVENT LISTENERS
// --------------------------------------------------

// --- SIGN UP ---
document.getElementById('signup-button')?.addEventListener('click', async () => {
    const email = signupEmailInput.value;
    const password = signupPasswordInput.value;
    authStatus.textContent = 'Signing up...';
    try {
        await signUp(email, password);
        // Success handled by onAuthStateChanged
    } catch (error) {
        authStatus.textContent = `Sign Up Failed: ${error.message}`;
    }
});

// --- SIGN IN ---
document.getElementById('signin-button')?.addEventListener('click', async () => {
    const email = signinEmailInput.value;
    const password = signinPasswordInput.value;
    authStatus.textContent = 'Signing in...';
    try {
        await signIn(email, password);
        // Success handled by onAuthStateChanged
    } catch (error) {
        authStatus.textContent = `Sign In Failed: ${error.message}`;
    }
});

// --- SIGN OUT ---
document.getElementById('signout-button')?.addEventListener('click', async () => {
    authStatus.textContent = 'Signing out...';
    await signOutUser();
    // Success handled by onAuthStateChanged
});

// --- GOOGLE SIGN IN ---
googleSignInButton?.addEventListener('click', async () => {
    authStatus.textContent = 'Signing in with Google...';
    try {
        await signInWithGoogle();
        // Success handled by onAuthStateChanged
    } catch (error) {
        authStatus.textContent = `Google Sign In Failed: ${error.message}`;
    }
});


// --------------------------------------------------
// 4. AUTH STATE CHANGE HANDLER
// --------------------------------------------------

/**
 * Listens for authentication state changes and updates the UI accordingly.
 */
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in: HIDE forms, SHOW user controls
        authForms.style.display = 'none';
        userControls.style.display = 'block';
        
        userEmailDisplay.textContent = user.email;
        authStatus.textContent = `Signed in as ${user.email}`;

        // Clear forms on successful sign-in
        signupEmailInput.value = '';
        signupPasswordInput.value = '';
        signinEmailInput.value = '';
        signinPasswordInput.value = '';

    } else {
        // User is signed out: SHOW forms, HIDE user controls
        authForms.style.display = 'block';
        userControls.style.display = 'none';
        
        userEmailDisplay.textContent = '';    }
});