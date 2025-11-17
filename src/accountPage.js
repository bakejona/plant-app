// src/accountPage.js

import { signOutUser } from './authService.js';
import { updateUserProfile } from './userService.js';

/**
 * Renders the Account Page UI and attaches event listeners.
 * @param {HTMLElement} container - The DOM element to render into.
 * @param {object} profile - The user's profile data from Firestore.
 * @param {object} authUser - The Firebase Auth user object.
 */
export function renderAccountPage(container, profile, authUser) {
    container.innerHTML = generateAccountHTML(profile);

    // --- Event Listeners ---
    document.getElementById('signout-button')?.addEventListener('click', signOutUser);
    
    // Location Link (Placeholder for routing to a location edit screen)
    document.getElementById('location-link')?.addEventListener('click', () => {
        alert('Location change interface coming soon!');
    });
    
    // Theme Toggle Listener (Dark Mode)
    document.getElementById('dark-mode-toggle')?.addEventListener('change', (e) => {
        const newTheme = e.target.checked ? 'dark' : 'light';
        // Apply theme to the whole document
        document.documentElement.setAttribute('data-theme', newTheme);
        // Update Firestore
        updateUserProfile(authUser.uid, { theme: newTheme });
    });

    // Temperature Unit Listener
    document.querySelectorAll('input[name="temp-unit"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const newUnit = e.target.value;
            // Update Firestore
            updateUserProfile(authUser.uid, { temperatureUnit: newUnit });
        });
    });
    
    // --- Initial State Population ---
    
    // Set Dark Mode Toggle state and initial theme
    const themeToggle = document.getElementById('dark-mode-toggle');
    if (themeToggle) {
        themeToggle.checked = profile.theme === 'dark';
        document.documentElement.setAttribute('data-theme', profile.theme);
    }
    
    // Set Temperature Unit Radio button state
    const tempRadio = document.querySelector(`input[name="temp-unit"][value="${profile.temperatureUnit}"]`);
    if (tempRadio) {
        tempRadio.checked = true;
    }
}


/**
 * Generates the HTML string for the Account page based on the wireframe.
 */
function generateAccountHTML(profile) {
    // Generate simple initials for the avatar placeholder
    const initials = profile.email ? profile.email[0].toUpperCase() : 'P';
    const username = profile.email ? profile.email.split('@')[0] : 'PlantPal User';

    return `
        <header style="text-align: center; padding: 20px 0;">
            <div style="
                width: 100px; height: 100px; border-radius: 50%; 
                background-color: var(--color-green-accent, #41b883); 
                margin: 0 auto 10px; 
                display: flex; align-items: center; justify-content: center;
                font-size: 40px; color: #242424;
            ">${initials}</div>
            <h2>${username}</h2>
            <p>${profile.email}</p>
        </header>

        <section class="settings-list" style="max-width: 400px; margin: 0 auto;">
            <h3 style="margin-top: 30px;">Settings</h3>
            
            <div class="setting-item">
                <span class="setting-label">Change Location</span>
                <a href="#" id="location-link" class="setting-action">${profile.location} &gt;</a>
            </div>
            <hr>

            <div class="setting-item">
                <span class="setting-label">Dark Mode</span>
                <label class="switch">
                    <input type="checkbox" id="dark-mode-toggle">
                    <span class="slider round"></span>
                </label>
            </div>
            <hr>
            
            <div class="setting-item">
                <span class="setting-label">Temperature Unit</span>
                <div class="toggle-switch">
                    <input type="radio" id="temp-f" name="temp-unit" value="F">
                    <label for="temp-f">°F</label>
                    <input type="radio" id="temp-c" name="temp-unit" value="C">
                    <label for="temp-c">°C</label>
                </div>
            </div>
            <hr>

            <div style="margin-top: 30px;">
                <button id="signout-button" style="background-color: #f44336; color: white; width: 100%;">Sign Out</button>
            </div>
        </section>
        
        <style>
             .settings-list { text-align: left; }
             .setting-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; }
             .setting-label { font-weight: 500; }
             .setting-action { color: var(--color-green-accent, #41b883); text-decoration: none; }
             
             /* Simple Switch CSS */
             .switch { position: relative; display: inline-block; width: 60px; height: 34px; }
             .switch input { opacity: 0; width: 0; height: 0; }
             .slider { background-color: #ccc; transition: .4s; border-radius: 34px; }
             .slider:before { background-color: white; transition: .4s; }
             input:checked + .slider { background-color: var(--color-green-accent, #41b883); }
             /* ... other slider styles truncated for brevity ... */
             
             /* Radio Toggle Switch CSS */
             .toggle-switch label {
                 padding: 5px 15px;
                 border: 1px solid #555;
                 border-radius: 20px;
                 cursor: pointer;
                 transition: background-color 0.2s, color 0.2s;
             }
             .toggle-switch input[type="radio"]:checked + label {
                 background-color: var(--color-green-accent, #41b883);
                 color: #242424;
                 border-color: var(--color-green-accent, #41b883);
             }
        </style>
    `;
}