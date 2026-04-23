// src/main.js

// 1. Import configured instances from your firebase.js file
import { auth, db } from './firebase.js';

import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { navigate } from './router.js';
import { mountProfileMenu } from './profileMenu.js';
import { signInWithGoogle, signInWithApple, sendPasswordReset } from './authService.js';
import { updateUserProfile } from './userService.js';
import { fetchWeather, getCurrentBrowserLocation } from './weatherService.js';
import { initNotifications } from './notificationService.js';
import { logoSVG } from './logoSVG.js';
import './style.scss';

// Set to true only at the moment of account creation — never on login
let _pendingSetup = false;

// ----------------------------------------------------
// AUTHENTICATION UI & LOGIC
// ----------------------------------------------------

// ── Onboarding slides data ─────────────────────────────────────────────────────
const SLIDES = [
    {
        tag:   'Welcome to PlantPal',
        title: 'Your plants,\nperfectly cared for.',
        desc:  'Everything your plants need — care schedules, reminders, and detailed plant info — all in one place.',
        img:   '/pp-plantcare.jpeg',
        mockup: `
            <div class="ob-mockup ob-mockup--plant">
                <div class="ob-mp-header">
                    <div class="ob-mp-avatar" style="background-image:url('/plants/ficusben.jpeg');background-size:cover;background-position:center;"></div>
                    <div class="ob-mp-title">
                        <div class="ob-mp-name">Ficus Benjamina</div>
                        <div class="ob-mp-sci">Ficus benjamina</div>
                        <span class="ob-mp-badge">Moderate Care</span>
                    </div>
                </div>
            </div>`,
    },
    {
        tag:   'Smart Reminders',
        title: 'Never miss\na watering again.',
        desc:  'Watering, fertilizing, and monthly progress updates sorted into tasks — checked off with a tap.',
        img:   '/pp-plantwatering.jpeg',
        mockup: `
            <div class="ob-mockup ob-mockup--tasks">
                <div class="ob-mt-task ob-mt-task--done">
                    <div class="ob-mt-task-img" style="background-image:url('/plants/dieffenbachia.jpeg');background-size:cover;background-position:center;"></div>
                    <div class="ob-mt-task-info">
                        <span class="ob-mt-task-name">Dieffenbachia</span>
                        <span class="ob-mt-task-label">Needs Water</span>
                    </div>
                    <div class="ob-mt-task-circle ob-mt-task-circle--done">
                        <i class="fa-solid fa-check"></i>
                    </div>
                </div>
                <div class="ob-mt-task ob-mt-task--faded">
                    <div class="ob-mt-task-img" style="background-image:url('/plants/dieffenbachia.jpeg');background-size:cover;background-position:center;"></div>
                    <div class="ob-mt-task-info">
                        <span class="ob-mt-task-name">Dieffenbachia</span>
                        <span class="ob-mt-task-label">Fertilize Due</span>
                    </div>
                    <div class="ob-mt-task-circle"></div>
                </div>
            </div>`,
    },
    {
        tag:   'Smart Pot Tracker',
        title: 'Live data,\nhealthier plants.',
        desc:  'Monitor soil moisture, light, temperature, and humidity in real time with the PlantPal smart pot.',
        img:   '/pp-plantpro.jpeg',
        mockup: `
            <div class="ob-sensor-wrap">
                <div class="ob-sensor-col">
                    <div class="ob-sensor-card">
                        <i class="fa-solid fa-droplet ob-sc-icon"></i>
                        <span class="ob-sc-val">62<small>%</small></span>
                        <span class="ob-sc-lbl">Moisture</span>
                        <div class="ob-sc-bar"><div class="ob-sc-fill" style="width:62%"></div></div>
                    </div>
                    <div class="ob-sensor-card">
                        <i class="fa-solid fa-temperature-half ob-sc-icon"></i>
                        <span class="ob-sc-val">72<small>°F</small></span>
                        <span class="ob-sc-lbl">Temp</span>
                        <div class="ob-sc-bar"><div class="ob-sc-fill" style="width:55%"></div></div>
                    </div>
                </div>
                <div class="ob-sensor-col">
                    <div class="ob-sensor-card">
                        <i class="fa-solid fa-sun ob-sc-icon"></i>
                        <span class="ob-sc-val">72<small>%</small></span>
                        <span class="ob-sc-lbl">Light</span>
                        <div class="ob-sc-bar"><div class="ob-sc-fill" style="width:72%"></div></div>
                    </div>
                    <div class="ob-sensor-card">
                        <i class="fa-solid fa-wind ob-sc-icon"></i>
                        <span class="ob-sc-val">58<small>%</small></span>
                        <span class="ob-sc-lbl">Humidity</span>
                        <div class="ob-sc-bar"><div class="ob-sc-fill" style="width:58%"></div></div>
                    </div>
                </div>
            </div>`,
        cta:   true,
    },
];

function renderAuth(container) {
    const seen = localStorage.getItem('plantpal_onboarded');
    if (!seen) {
        renderOnboarding(container);
    } else {
        renderAuthForm(container);
    }
}

// ── Onboarding ─────────────────────────────────────────────────────────────────
function renderOnboarding(container) {
    let current = 0;

    container.innerHTML = `
        <div class="ob-wrapper" id="ob-wrapper">
            <div class="ob-track" id="ob-track">
                ${SLIDES.map((s, i) => `
                    <div class="ob-slide ob-slide--${i + 1}">
                        <div class="ob-upper ob-upper--photo" style="background-image:url('${s.img}')">
                            <div class="ob-upper-overlay"></div>
                        </div>
                        ${s.mockup || ''}
                        <div class="ob-lower">
                            <span class="ob-tag">${s.tag}</span>
                            <h2 class="ob-title">${s.title.replace('\n', '<br>')}</h2>
                            <p class="ob-desc">${s.desc}</p>
                            ${s.cta ? `<button class="primary-button ob-cta-btn" id="ob-getstarted">Get Started</button>` : ''}
                        </div>
                    </div>`).join('')}
            </div>

            <div class="ob-footer">
                <button class="ob-skip-btn" id="ob-skip">Skip</button>
                <div class="ob-dots" id="ob-dots">
                    ${SLIDES.map((_, i) => `<div class="ob-dot ${i === 0 ? 'ob-dot--active' : ''}"></div>`).join('')}
                </div>
                <button class="ob-next-btn" id="ob-next">Next</button>
            </div>
        </div>
    `;

    const track   = container.querySelector('#ob-track');
    const dots    = container.querySelectorAll('.ob-dot');
    const nextBtn = container.querySelector('#ob-next');
    const skipBtn = container.querySelector('#ob-skip');

    function goTo(idx) {
        current = idx;
        const isLast = current === SLIDES.length - 1;
        track.style.transform = `translateX(-${current * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle('ob-dot--active', i === current));
        nextBtn.textContent   = isLast ? '' : 'Next';
        nextBtn.style.visibility = isLast ? 'hidden' : 'visible';
        skipBtn.style.visibility = isLast ? 'hidden' : 'visible';
    }

    function finish() {
        localStorage.setItem('plantpal_onboarded', '1');
        const wrapper = container.querySelector('#ob-wrapper');
        if (wrapper) {
            // Fade the photo slides to dark green, then fade entire wrapper out
            const slides = wrapper.querySelectorAll('.ob-upper--photo');
            slides.forEach(s => {
                s.style.transition = 'opacity 0.5s ease';
                s.style.opacity = '0';
            });
            const overlay = wrapper.querySelector('.ob-upper-overlay');
            if (overlay) {
                overlay.style.transition = 'background 0.5s ease';
                overlay.style.background = '#0a1a10';
            }
            setTimeout(() => {
                wrapper.style.transition = 'opacity 0.35s ease';
                wrapper.style.opacity = '0';
                setTimeout(() => renderAuthForm(container), 350);
            }, 300);
        } else {
            renderAuthForm(container);
        }
    }

    nextBtn.addEventListener('click', () => {
        if (current < SLIDES.length - 1) goTo(current + 1);
    });
    container.querySelector('#ob-skip').addEventListener('click', finish);
    container.querySelector('#ob-getstarted')?.addEventListener('click', finish);

    // Touch swipe
    let touchStartX = 0;
    track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (dx < -50 && current < SLIDES.length - 1) goTo(current + 1);
        if (dx >  50 && current > 0)                  goTo(current - 1);
    });
}

// ── Auth form ──────────────────────────────────────────────────────────────────
function renderAuthForm(container) {
    container.innerHTML = `
        <div class="auth-wrapper auth-slide-up">

            <div class="auth-form-container">
                <div class="auth-title-row" id="auth-title-row">
                    <div class="auth-title-icon-circle">
                        <i class="fa-solid fa-user-plus" id="auth-title-icon"></i>
                    </div>
                    <h2 id="auth-title" class="auth-title-left">Create Account</h2>
                </div>
                <p id="auth-subtext" class="auth-subtext">Create an account and start your plant care journey.</p>

                <div id="auth-error-box" class="auth-error-message"></div>

                <input type="email"    id="auth-email"    class="auth-input" placeholder="Email">
                <input type="password" id="auth-password" class="auth-input" placeholder="Password">

                <a href="#" id="forgot-link" class="auth-forgot" style="visibility:hidden">Forgot password?</a>

                <button id="auth-action-btn" class="primary-button auth-button">Sign Up</button>

                <div class="auth-or-divider"><span>or</span></div>

                <button id="btn-google" class="social-auth-btn social-auth-btn--google">
                    <svg class="social-icon-g" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Continue with Google
                </button>

                <div class="auth-footer">
                    <span id="auth-footer-text">Already have an account?</span>
                    <a href="#" id="auth-toggle-btn">Login</a>
                </div>

                <div class="auth-logo-bottom">
                    ${logoSVG('auth-logo-icon')}
                </div>
            </div>
        </div>
    `;

    const emailInput    = container.querySelector('#auth-email');
    const passwordInput = container.querySelector('#auth-password');
    const actionBtn     = container.querySelector('#auth-action-btn');
    const toggleBtn     = container.querySelector('#auth-toggle-btn');
    const title         = container.querySelector('#auth-title');
    const subtext       = container.querySelector('#auth-subtext');
    const titleRow      = container.querySelector('#auth-title-row');
    const titleIcon     = container.querySelector('#auth-title-icon');
    const errorBox      = container.querySelector('#auth-error-box');
    const forgotLink    = container.querySelector('#forgot-link');
    const footerText    = container.querySelector('#auth-footer-text');
    const formCard      = container.querySelector('.auth-form-container');

    let isLogin = false;

    function shake() {
        formCard.classList.remove('auth-shake');
        void formCard.offsetWidth; // reflow to restart animation
        formCard.classList.add('auth-shake');
        formCard.addEventListener('animationend', () => formCard.classList.remove('auth-shake'), { once: true });
    }

    function showError(msg, { emailErr = false, passwordErr = false } = {}) {
        errorBox.className = 'auth-error-message';
        errorBox.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${msg}`;
        errorBox.style.display = 'flex';
        emailInput.classList.toggle('auth-input--error', emailErr);
        passwordInput.classList.toggle('auth-input--error', passwordErr);
        shake();
    }

    function showSuccess(msg) {
        errorBox.className = 'auth-error-message auth-error-message--success';
        errorBox.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${msg}`;
        errorBox.style.display = 'flex';
    }

    function clearError() {
        errorBox.style.display = 'none';
        emailInput.classList.remove('auth-input--error');
        passwordInput.classList.remove('auth-input--error');
    }

    // Clear field errors on input
    emailInput.addEventListener('input', () => emailInput.classList.remove('auth-input--error'));
    passwordInput.addEventListener('input', () => passwordInput.classList.remove('auth-input--error'));

    // Toggle login ↔ signup
    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        isLogin = !isLogin;

        // Animate title row out, swap content, animate back in
        titleRow.classList.add('auth-header-out');
        setTimeout(() => {
            title.textContent   = isLogin ? 'Login' : 'Create Account';
            subtext.textContent = isLogin
                ? 'Welcome back, your plants have been missing you.'
                : 'Create an account and start your plant care journey.';
            titleIcon.className = `fa-solid ${isLogin ? 'fa-user' : 'fa-user-plus'}`;
            titleRow.classList.remove('auth-header-out');
            titleRow.classList.add('auth-header-in');
            titleRow.addEventListener('animationend', () => titleRow.classList.remove('auth-header-in'), { once: true });
        }, 180);

        actionBtn.textContent  = isLogin ? 'Login' : 'Sign Up';
        footerText.textContent = isLogin ? "Don't have an account?" : 'Already have an account?';
        toggleBtn.textContent  = isLogin ? 'Sign Up' : 'Login';
        forgotLink.style.visibility = isLogin ? 'visible' : 'hidden';
        clearError();
    });

    forgotLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        if (!email) {
            showError('Enter your email address first.', { emailErr: true });
            return;
        }
        forgotLink.textContent = 'Sending…';
        try {
            await sendPasswordReset(email);
            showSuccess(`Reset link sent to ${email}`);
        } catch (err) {
            showError(err.message, { emailErr: true });
        } finally {
            forgotLink.textContent = 'Forgot password?';
        }
    });

    // Email / password submit
    actionBtn.addEventListener('click', async () => {
        const email    = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email && !password) {
            showError('Please enter your email and password.', { emailErr: true, passwordErr: true });
            return;
        }
        if (!email) { showError('Please enter your email address.', { emailErr: true }); return; }
        if (!password) { showError('Please enter your password.', { passwordErr: true }); return; }

        actionBtn.disabled = true;
        actionBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        clearError();

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                // Set flag synchronously BEFORE any await so onAuthStateChanged
                // always sees it set when it fires during the async operations below
                _pendingSetup = true;
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, 'users', cred.user.uid), {
                    email, joined: new Date().toISOString(), temperatureUnit: 'F',
                });
            }
        } catch (error) {
            _pendingSetup = false;
            const code = error.code || '';
            const isEmailErr    = code.includes('email') || code.includes('user');
            const isPasswordErr = code.includes('password') || code.includes('credential');
            showError(getFriendlyErrorMessage(code), {
                emailErr:    isEmailErr,
                passwordErr: isPasswordErr || (!isEmailErr),
            });
            actionBtn.disabled = false;
            actionBtn.textContent = isLogin ? 'Login' : 'Sign Up';
        }
    });

    // Google
    container.querySelector('#btn-google').addEventListener('click', async () => {
        clearError();
        try {
            const isNewUser = await signInWithGoogle();
            if (isNewUser) _pendingSetup = true;
        }
        catch (err) { showError(err.message); shake(); }
    });
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
// PROFILE SETUP (shown to new users after signup)
// ----------------------------------------------------

function renderProfileSetup(container, user, onComplete) {
    let newPhotoURL = '';

    container.innerHTML = `
        <div class="auth-wrapper auth-slide-up">
            <div class="auth-form-container">
                <div class="auth-title-row">
                    <div class="auth-title-icon-circle">
                        <i class="fa-solid fa-leaf"></i>
                    </div>
                    <h2 class="auth-title-left">Set Up Your Profile</h2>
                </div>
                <p class="auth-subtext">Personalize PlantPal before you start.</p>

                <div class="setup-avatar-row" id="setup-avatar-row">
                    <div class="setup-avatar-preview" id="setup-avatar-preview">
                        <i class="fa-solid fa-user"></i>
                    </div>
                    <span class="setup-avatar-label">Add profile photo</span>
                    <input type="file" id="setup-pic-input" accept="image/*" style="display:none">
                </div>

                <input type="text" id="setup-name" class="auth-input" placeholder="Display name (optional)">

                <div class="setup-field-label">Location <span style="color:#f44336;margin-left:2px;">*</span></div>
                <div class="setup-loc-row">
                    <input type="text" id="setup-location" class="auth-input" placeholder="City or zip code" style="flex:1">
                    <button id="setup-gps-btn" class="setup-gps-btn" title="Use my location">
                        <i class="fa-solid fa-location-arrow"></i>
                    </button>
                </div>
                <p id="setup-loc-status" class="auth-subtext" style="margin-top:4px;font-size:0.75rem;min-height:16px;"></p>

                <div class="setup-field-label">Temperature Unit</div>
                <div class="setup-temp-row">
                    <button class="setup-temp-btn setup-temp-btn--active" data-unit="F">°F</button>
                    <button class="setup-temp-btn" data-unit="C">°C</button>
                </div>

                <button id="setup-submit-btn" class="primary-button auth-button" style="margin-top:20px;">
                    Get Started <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `;

    let selectedUnit = 'F';

    // Avatar preview
    function compressProfileImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const MAX = 200;
                    const scale = Math.min(MAX / img.width, MAX / img.height, 1);
                    const canvas = document.createElement('canvas');
                    canvas.width  = Math.round(img.width  * scale);
                    canvas.height = Math.round(img.height * scale);
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', 0.75));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    const avatarRow     = container.querySelector('#setup-avatar-row');
    const avatarPreview = container.querySelector('#setup-avatar-preview');
    const picInput      = container.querySelector('#setup-pic-input');
    const locStatus     = container.querySelector('#setup-loc-status');

    avatarRow.addEventListener('click', () => picInput.click());
    picInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            newPhotoURL = await compressProfileImage(file);
            avatarPreview.innerHTML = '';
            avatarPreview.style.backgroundImage = `url('${newPhotoURL}')`;
            avatarPreview.style.backgroundSize  = 'cover';
            avatarPreview.style.backgroundPosition = 'center';
        } catch (err) { console.error(err); }
    });

    // Temperature toggle
    container.querySelectorAll('.setup-temp-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.setup-temp-btn').forEach(b => b.classList.remove('setup-temp-btn--active'));
            btn.classList.add('setup-temp-btn--active');
            selectedUnit = btn.dataset.unit;
        });
    });

    // GPS location
    container.querySelector('#setup-gps-btn').addEventListener('click', async () => {
        locStatus.textContent = 'Getting location…';
        try {
            const { lat, lon } = await getCurrentBrowserLocation();
            const weather = await fetchWeather(`${lat.toFixed(4)},${lon.toFixed(4)}`, selectedUnit);
            if (!weather?.city) throw new Error('Could not resolve location.');
            container.querySelector('#setup-location').value = `${weather.city}, ${weather.region}`;
            locStatus.textContent = '';
        } catch (err) {
            locStatus.textContent = `Could not get location.`;
        }
    });

    // Submit
    container.querySelector('#setup-submit-btn').addEventListener('click', async () => {
        const submitBtn   = container.querySelector('#setup-submit-btn');
        const name        = container.querySelector('#setup-name').value.trim();
        const location    = container.querySelector('#setup-location').value.trim();
        const locInput    = container.querySelector('#setup-location');

        if (!location) {
            locInput.classList.add('auth-input--error');
            locInput.focus();
            locStatus.textContent = 'Location is required.';
            locStatus.style.color = '#f44336';
            return;
        }
        locInput.classList.remove('auth-input--error');
        locStatus.textContent = '';
        locStatus.style.color = '';

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

        try {
            const updates = {
                temperatureUnit: selectedUnit,
                setupComplete:   true,
            };
            if (name)        updates.displayName  = name;
            if (location)    updates.location      = location;
            if (newPhotoURL) updates.profilePicURL = newPhotoURL;

            await updateUserProfile(user.uid, updates);
            onComplete();
        } catch (err) {
            console.error(err);
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Get Started <i class="fa-solid fa-arrow-right"></i>';
        }
    });
}

// ----------------------------------------------------
// APP INITIALIZATION
// ----------------------------------------------------

const appContent = document.getElementById('app-content');
const bottomNav  = document.getElementById('bottom-nav');
const profileMenuRoot = document.getElementById('profile-menu-root');

// Listen for Auth State Changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
        bottomNav.style.display = 'flex';

        // Fetch User Profile
        let userProfile = {};
        try {
            const docSnap = await getDoc(doc(db, 'users', user.uid));
            if (docSnap.exists()) {
                userProfile = docSnap.data();
            } else {
                // No doc yet (e.g. race condition) — create a minimal one
                await setDoc(doc(db, 'users', user.uid), {
                    email: user.email,
                    joined: new Date().toISOString(),
                    temperatureUnit: 'F',
                });
            }
        } catch (e) {
            console.error("Error fetching profile", e);
        }

        // Only show setup when explicitly triggered at account-creation time
        if (_pendingSetup) {
            _pendingSetup = false;
            bottomNav.style.display = 'none';
            renderProfileSetup(appContent, user, () => {
                window.location.reload();
            });
            return;
        }

        // Mount the persistent profile menu (inside bottom nav)
        mountProfileMenu(profileMenuRoot, userProfile, user);

        // Request notification permission + register FCM (non-blocking)
        initNotifications(user.uid);

        if (window.location.hash === '' || window.location.hash === '#') {
            window.location.hash = '#home';
        }

        navigate(userProfile, user);
        window.onhashchange = () => navigate(userProfile, user);

    } else {
        bottomNav.style.display = 'none';
        renderAuth(appContent);
    }
});