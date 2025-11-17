// src/main.js
import './style.css';
import { auth } from './firebase.js'; 
import { onAuthStateChanged } from 'firebase/auth';
import { signUp, signIn, signInWithGoogle } from './authService.js';
import { createOrUpdateUserProfile, getUserProfile } from './userService.js'; 
import { navigate } from './router.js'; 
// NOTE: This file assumes router.js and accountPage.js exist and are configured.


// --------------------------------------------------
// 1. DOM ELEMENT REFERENCES (CORRECTED)
// --------------------------------------------------
// Target the main content area for page injection
const appContent = document.getElementById('app-content'); 
// Target the persistent navigation bar
const bottomNav = document.getElementById('bottom-nav');


// --- Unauthenticated Content Rendering ---

function renderSignInPage() {
    // ⬇️ CRITICAL FIX: Only target appContent, preserving the navigation bar.
    if (!appContent) return; 

    appContent.innerHTML = `
        <div id="auth-screen" style="text-align: center; max-width: 400px; margin: 0 auto; padding: 20px;">
            <h1 style="color: var(--color-green-accent, #41b883);">PlantPal</h1>
            <div id="auth-status" style="margin-bottom: 20px;">Please sign in or sign up.</div>
            
            <div id="auth-forms">
                <h2>Sign Up</h2>
                <input type="email" id="signup-email" placeholder="Email" style="width: 100%; margin-bottom: 10px; padding: 10px;">
                <input type="password" id="signup-password" placeholder="Password" style="width: 100%; margin-bottom: 20px; padding: 10px;">
                <button id="signup-button" style="width: 100%; margin-bottom: 20px;">Sign Up</button>

                <hr style="margin: 20px 0;">

                <h2>Sign In</h2>
                <input type="email" id="signin-email" placeholder="Email" style="width: 100%; margin-bottom: 10px; padding: 10px;">
                <input type="password" id="signin-password" placeholder="Password" style="width: 100%; margin-bottom: 20px; padding: 10px;">
                <button id="signin-button" style="width: 100%; margin-bottom: 20px;">Sign In</button>
                
                <hr style="margin: 20px 0;">

                <p>Or sign in with</p>
                <button id="google-signin-button" style="width: 100%;">Sign In with Google</button>
            </div>
        </div>
    `;

    // CRITICAL: Attach listeners immediately after rendering the HTML
    attachAuthListeners(); 
    
    // Hide the bottom navigation bar when on the sign-in screen
    if (bottomNav) { 
        bottomNav.style.display = 'none';
    }
}


// --- Event Listener Attachment (Auth Logic) ---

function attachAuthListeners() {
    const authStatus = document.getElementById('auth-status');
    const getVal = (id) => document.getElementById(id)?.value;

    const handleAuthAction = async (actionFn, ...args) => {
        if (authStatus) authStatus.textContent = 'Processing...';
        try {
            await actionFn(...args);
            // On success, onAuthStateChanged handles the rest
        } catch (error) {
            if (authStatus) authStatus.textContent = `Error: ${error.message}`; 
        }
    };

    // --- Wire up the Buttons ---
    document.getElementById('signup-button')?.addEventListener('click', () => 
        handleAuthAction(signUp, getVal('signup-email'), getVal('signup-password'))
    );

    document.getElementById('signin-button')?.addEventListener('click', () => 
        handleAuthAction(signIn, getVal('signin-email'), getVal('signin-password'))
    );

    document.getElementById('google-signin-button')?.addEventListener('click', () => 
        handleAuthAction(signInWithGoogle)
    );
}


// --- Authenticated App Rendering Logic ---

async function renderAuthenticatedApp(user) {
    try {
        // 1. Fetch user profile data from Firestore
        let userProfile = await getUserProfile(user.uid);
        
        if (!userProfile) {
            // If profile is missing, create it.
            userProfile = await createOrUpdateUserProfile(user);
        }

        // 2. Start the main routing and navigation for the app
        startAppNavigation(userProfile, user);
        
    } catch (error) {
        console.error('Failed to load user profile or start app:', error);
        // If critical failure, render Sign-In Page
        renderSignInPage();
    }
}

function startAppNavigation(userProfile, userAuth) {
    // ⬇️ CRITICAL FIX: Show the bottom navigation bar (the check prevents null error)
    if (bottomNav) { 
        bottomNav.style.display = 'flex';
    }
    
    // Initial page render based on the current URL hash, passing user data
    navigate(userProfile, userAuth);

    // Set up listener for hash changes (for internal navigation)
    window.addEventListener('hashchange', () => navigate(userProfile, userAuth));
}


// --------------------------------------------------
// 5. AUTH STATE CHANGE HANDLER (The Main Controller)
// --------------------------------------------------

onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in: Fetch Profile & Render App
        renderAuthenticatedApp(user);
    } else {
        // User is signed out: Render Sign-In Page
        renderSignInPage();
    }
});