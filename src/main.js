// src/main.js

import './style.scss';
import { auth } from './firebase.js'; 
import { onAuthStateChanged } from 'firebase/auth';
// ⬅️ NEW IMPORT for password reset
import { signUp, signIn, signInWithGoogle, sendPasswordReset } from './authService.js'; 
import { createOrUpdateUserProfile, getUserProfile } from './userService.js'; 
import { navigate } from './router.js'; 


// --------------------------------------------------
// 1. DOM ELEMENT REFERENCES
// --------------------------------------------------
const appContent = document.getElementById('app-content'); 
const bottomNav = document.getElementById('bottom-nav');


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
    bottomNav.style.display = 'none';

    // Listener to switch to the Sign Up screen
    document.getElementById('goto-signup')?.addEventListener('click', (e) => {
        e.preventDefault();
        renderSignUpPage();
    });

    // ⬅️ NEW: Forgot Password Listener
    document.getElementById('forgot-password-link')?.addEventListener('click', async (e) => {
        e.preventDefault();
        const authStatus = document.getElementById('auth-status');
        const email = document.getElementById('signin-email').value;

        if (!email) {
            authStatus.textContent = 'Please enter your email above to reset password.';
            return;
        }

        authStatus.textContent = `Sending reset email to ${email}...`;
        
        try {
            const result = await sendPasswordReset(email);
            authStatus.textContent = result.message;
        } catch (error) {
            authStatus.textContent = `Reset Failed: ${error.message}`;
        }
    });
}

function renderSignUpPage() {
    // ... (This function remains largely the same, but the authService calls now have better error handling) ...
    // ...
}

// ... (Rest of file remains the same) ...