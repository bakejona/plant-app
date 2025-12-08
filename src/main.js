// src/main.js

// 1. Import configured instances from your firebase.js file
import { auth, db } from './firebase.js'; 

// 2. Import specific functions needed for logic
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { navigate } from './router.js';
import './style.scss';

// ----------------------------------------------------
// AUTHENTICATION UI & LOGIC
// ----------------------------------------------------

function renderAuth(container) {
    container.innerHTML = `
        <div class="auth-wrapper">
            <h1 class="auth-header">PlantPal</h1>
            
            <div id="auth-error-box" class="auth-error-message"></div>

            <div class="auth-form-container fade-in">
                <h2 id="auth-title">Sign In</h2>
                
                <input type="email" id="auth-email" class="auth-input" placeholder="Email" required>
                <input type="password" id="auth-password" class="auth-input" placeholder="Password" required>
                
                <button id="auth-action-btn" class="primary-button auth-button">Sign In</button>
                
                <div class="auth-footer">
                    <span id="auth-footer-text">Don't have an account?</span>
                    <a href="#" id="auth-toggle-btn" style="margin-left: 5px;">Sign Up</a>
                </div>
            </div>
        </div>
    `;

    const emailInput = document.getElementById('auth-email');
    const passwordInput = document.getElementById('auth-password');
    const actionBtn = document.getElementById('auth-action-btn');
    const toggleBtn = document.getElementById('auth-toggle-btn');
    const title = document.getElementById('auth-title');
    const errorBox = document.getElementById('auth-error-box');

    let isLogin = true;

    // Toggle between Login and Signup
    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        isLogin = !isLogin;
        title.textContent = isLogin ? 'Sign In' : 'Create Account';
        actionBtn.textContent = isLogin ? 'Sign In' : 'Sign Up';
        document.getElementById('auth-footer-text').textContent = isLogin ? "Don't have an account?" : "Already have an account?";
        toggleBtn.textContent = isLogin ? 'Sign Up' : 'Sign In';
        errorBox.style.display = 'none';
    });

    // Handle Form Submit
    actionBtn.addEventListener('click', async () => {
        const email = emailInput.value;
        const password = passwordInput.value;
        
        // Basic Validation
        if (!email || !password) {
            showError("Please enter both email and password.");
            return;
        }

        // UI Loading State
        actionBtn.disabled = true;
        actionBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
        errorBox.style.display = 'none';

        try {
            if (isLogin) {
                // --- LOGIN ---
                await signInWithEmailAndPassword(auth, email, password);
                // Redirect happens in onAuthStateChanged
            } else {
                // --- SIGN UP ---
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                // Create empty user profile
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    email: email,
                    joined: new Date().toISOString(),
                    temperatureUnit: 'F'
                });
            }
        } catch (error) {
            console.error("Auth Error:", error);
            showError(getFriendlyErrorMessage(error.code));
            actionBtn.disabled = false;
            actionBtn.textContent = isLogin ? 'Sign In' : 'Sign Up';
        }
    });

    function showError(msg) {
        errorBox.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${msg}`;
        errorBox.style.display = 'block';
    }
}

// Helper: Convert Firebase Error Codes to Human Text
function getFriendlyErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/invalid-email': return 'Invalid email address format.';
        case 'auth/user-disabled': return 'This account has been disabled.';
        case 'auth/user-not-found': return 'No account found with this email.';
        case 'auth/wrong-password': return 'Incorrect password.';
        case 'auth/email-already-in-use': return 'This email is already in use.';
        case 'auth/weak-password': return 'Password should be at least 6 characters.';
        case 'auth/invalid-credential': return 'Invalid login credentials.';
        default: return 'An unknown error occurred. Please try again.';
    }
}

// ----------------------------------------------------
// APP INITIALIZATION
// ----------------------------------------------------

const appContent = document.getElementById('app-content');
const bottomNav = document.getElementById('bottom-nav');

// Listen for Auth State Changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in
        bottomNav.style.display = 'flex';
        
        // Fetch User Profile
        let userProfile = {};
        try {
            const docSnap = await getDoc(doc(db, 'users', user.uid));
            if (docSnap.exists()) {
                userProfile = docSnap.data();
            }
        } catch (e) {
            console.error("Error fetching profile", e);
        }

        // REDIRECT LOGIC:
        // If we are currently at the root (empty hash), go to home.
        if (window.location.hash === '' || window.location.hash === '#') {
             window.location.hash = '#home';
        }
        
        // Start Navigation
        navigate(userProfile, user);

        // Listen for hash changes
        window.onhashchange = () => navigate(userProfile, user);

    } else {
        // User is signed out
        bottomNav.style.display = 'none';
        renderAuth(appContent);
    }
});