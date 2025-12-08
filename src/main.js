// src/main.js

import './style.scss';
import { auth } from './firebase.js'; 
import { onAuthStateChanged } from 'firebase/auth';
// Added sendPasswordReset for password recovery flow
import { signUp, signIn, signInWithGoogle, sendPasswordReset } from './authService.js'; 
import { createOrUpdateUserProfile, getUserProfile } from './userService.js'; 
import { navigate } from './router.js'; 


// --------------------------------------------------
// 1. DOM ELEMENT REFERENCES (Consolidated and checked for existence)
// --------------------------------------------------
const appContent = document.getElementById('app-content'); 
const bottomNav = document.getElementById('bottom-nav');

if (!appContent) {
    console.error("CRITICAL ERROR: Main content container (#app-content) not found in DOM.");
}

// --------------------------------------------------
// 2. AUTHENTICATION PAGE RENDERING
// --------------------------------------------------

function renderSignInPage() {
    if (!appContent) return; 

    appContent.innerHTML = `
        <div id="auth-screen" class="auth-wrapper">
            <h1 class="auth-header">PlantPal</h1>
            <div id="auth-status" class="auth-status">Please sign in.</div>
            
            <div id="auth-forms" class="auth-form-container">
                <h2>Sign In</h2>
                <input type="email" id="signin-email" placeholder="Email" class="auth-input">
                <input type="password" id="signin-password" placeholder="Password" class="auth-input">
                
                <div class="forgot-password-container">
                    <a href="#" id="forgot-password-link" class="auth-link">Forgot Password?</a>
                </div>

                <button id="signin-button" class="auth-button primary-button">Sign In</button>
                
                <hr class="auth-separator">

                <button id="google-signin-button" class="auth-button google-button">Sign In with Google</button>
            </div>

            <div class="auth-footer">
                <p>New to PlantPal? <a href="#" id="goto-signup" class="auth-link">Sign Up</a></p>
            </div>
        </div>
    `;

    // Attach listeners after rendering
    attachAuthListeners('signin'); 
    if (bottomNav) bottomNav.style.display = 'none';

    // Listener to switch to the Sign Up screen
    document.getElementById('goto-signup')?.addEventListener('click', (e) => {
        e.preventDefault();
        renderSignUpPage();
    });

    // Forgot Password Listener
    document.getElementById('forgot-password-link')?.addEventListener('click', async (e) => {
        e.preventDefault();
        const authStatus = document.getElementById('auth-status');
        const email = document.getElementById('signin-email')?.value;

        if (!email) {
            if (authStatus) authStatus.textContent = 'Please enter your email above to reset password.';
            return;
        }

        if (authStatus) authStatus.textContent = `Sending reset email to ${email}...`;
        
        try {
            const result = await sendPasswordReset(email);
            if (authStatus) authStatus.textContent = result.message;
        } catch (error) {
            if (authStatus) authStatus.textContent = `Reset Failed: ${error.message}`;
        }
    });
}

function renderSignUpPage() {
    if (!appContent) return; 

    appContent.innerHTML = `
        <div id="auth-screen" class="auth-wrapper">
            <h1 class="auth-header">PlantPal</h1>
            <div id="auth-status" class="auth-status">Create your account.</div>
            
            <div id="auth-forms" class="auth-form-container">
                <h2>Sign Up</h2>
                <input type="email" id="signup-email" placeholder="Email" class="auth-input">
                <input type="password" id="signup-password" placeholder="Password" class="auth-input">
                <button id="signup-button" class="auth-button primary-button">Sign Up</button>
                
                <hr class="auth-separator">

                <button id="google-signin-button" class="auth-button google-button">Sign Up with Google</button>
            </div>

            <div class="auth-footer">
                <p>Already have an account? <a href="#" id="goto-signin" class="auth-link">Sign In</a></p>
            </div>
        </div>
    `;

    // Attach listeners for sign up action
    attachAuthListeners('signup');
    if (bottomNav) bottomNav.style.display = 'none';

    // Listener to switch back to the Sign In screen
    document.getElementById('goto-signin')?.addEventListener('click', (e) => {
        e.preventDefault();
        renderSignInPage();
    });
}


// --- Event Listener Attachment (Auth Logic) ---

function attachAuthListeners(mode) {
    const authStatus = document.getElementById('auth-status');
    // Ensure all DOM lookups use the optional chaining operator (?) for safety
    const getVal = (id) => document.getElementById(id)?.value;
    
    // --- Determine Primary Action Button ---
    if (mode === 'signin') {
        const signinButton = document.getElementById('signin-button');
        if (signinButton) {
             signinButton.addEventListener('click', () => 
                handleAuthAction(signIn, getVal('signin-email'), getVal('signin-password'))
            );
        }
    } else if (mode === 'signup') {
        const signupButton = document.getElementById('signup-button');
        if (signupButton) {
            signupButton.addEventListener('click', () => 
                handleAuthAction(signUp, getVal('signup-email'), getVal('signup-password'))
            );
        }
    }

    // Google button handles BOTH sign in and sign up automatically via Firebase Auth
    document.getElementById('google-signin-button')?.addEventListener('click', () => 
        handleAuthAction(signInWithGoogle)
    );

    // Helper for Auth Action
    const handleAuthAction = async (actionFn, ...args) => {
        if (authStatus) authStatus.textContent = 'Processing...';
        try {
            await actionFn(...args);
        } catch (error) {
            // Error handling is now delegated to authService.js for user-friendly messages
            if (authStatus) authStatus.textContent = `Error: ${error.message}`; 
        }
    };
}


// --------------------------------------------------
// 3. AUTHENTICATED APP CONTROLLER
// --------------------------------------------------

async function renderAuthenticatedApp(user) {
    try {
        let userProfile = await getUserProfile(user.uid);
        
        if (!userProfile) {
            userProfile = await createOrUpdateUserProfile(user);
        }

        startAppNavigation(userProfile, user);
        
    } catch (error) {
        console.error('Failed to load user profile or start app:', error);
        renderSignInPage();
    }
}

function startAppNavigation(userProfile, userAuth) {
    if (bottomNav) { 
        bottomNav.style.display = 'flex';
    }
    
    navigate(userProfile, userAuth);
    window.addEventListener('hashchange', () => navigate(userProfile, userAuth));
}


// --------------------------------------------------
// 4. AUTH STATE CHANGE HANDLER (The Main Controller)
// --------------------------------------------------

onAuthStateChanged(auth, (user) => {
    if (user) {
        renderAuthenticatedApp(user);
    } else {
        renderSignInPage();
    }
});