// src/accountPage.js

import { signOutUser } from './authService.js';
import { updateUserProfile } from './userService.js';
import { uploadProfilePicture } from './storageService.js'; // For profile pic upload
import { getCurrentBrowserLocation } from './weatherService.js'; // For location update

/**
 * Renders the Account Page UI and attaches event listeners.
 * @param {HTMLElement} container - The DOM element to render into.
 * @param {object} profile - The user's profile data from Firestore.
 * @param {object} authUser - The Firebase Auth user object.
 */
export function renderAccountPage(container, profile, authUser) {
    container.innerHTML = generateAccountHTML(profile);

    // --- Event Listeners ---
    
    // 1. Sign Out
    document.getElementById('signout-button')?.addEventListener('click', signOutUser);
    
    // 2. Upload Picture
    document.getElementById('upload-pic-input')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadStatus = document.getElementById('upload-status');
        uploadStatus.textContent = 'Uploading...'; 

        try {
            const downloadURL = await uploadProfilePicture(authUser.uid, file);
            
            // CRITICAL: Update the user's profile document with the new URL
            await updateUserProfile(authUser.uid, { profilePicURL: downloadURL });

            uploadStatus.textContent = 'Picture updated successfully! Reloading...';
            // Reload the current page to display the new picture
            window.location.reload(); 

        } catch (error) {
            uploadStatus.textContent = `Upload failed: ${error.message}`;
        }
    });

    // 3. Location Link (Uses Geolocation API)
    document.getElementById('location-link')?.addEventListener('click', async () => {
        const locationElement = document.getElementById('current-location-display');
        locationElement.textContent = 'Getting location...';

        try {
            const { lat, lon } = await getCurrentBrowserLocation();
            
            // In a production app, you would reverse-geocode lat/lon to get a city name
            // For now, we save the coordinates as the location string.
            const newLocation = `Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`;
            
            // Update the profile with the new location
            await updateUserProfile(authUser.uid, { location: newLocation });

            locationElement.textContent = newLocation + ' >';
            alert(`Location updated to ${newLocation}.`);

        } catch (error) {
            locationElement.textContent = profile.location + ' >'; // Revert on fail
            alert(`Location retrieval failed: ${error.message}`);
        }
    });
    
    // 4. Theme Toggle Listener (Dark Mode)
    document.getElementById('dark-mode-toggle')?.addEventListener('change', (e) => {
        const newTheme = e.target.checked ? 'dark' : 'light';
        // Apply theme to the whole document
        document.documentElement.setAttribute('data-theme', newTheme);
        // Update Firestore
        updateUserProfile(authUser.uid, { theme: newTheme });
    });

    // 5. Temperature Unit Listener
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
    // Determine avatar source
    const profilePicURL = profile.profilePicURL;
    const initials = profile.email ? profile.email[0].toUpperCase() : 'P';
    const username = profile.email ? profile.email.split('@')[0] : 'PlantPal User';

    return `
        <div style="padding: 20px;">
            <header style="text-align: center; padding: 20px 0;">
                
                <div class="profile-avatar-container">
                    ${profilePicURL 
                        ? `<img src="${profilePicURL}" alt="Profile Picture" class="profile-avatar-img">`
                        : `<div class="profile-avatar-initials">${initials}</div>`
                    }
                </div>
                
                <label for="upload-pic-input" class="upload-pic-label">
                    <button class="upload-pic-button">Upload Picture</button>
                    <input type="file" id="upload-pic-input" accept="image/*" style="display: none;">
                </label>
                <div id="upload-status" style="font-size: 0.8em; color: var(--color-green-accent); margin-top: 5px;"></div>

                <h2>${username}</h2>
                <p>${profile.email}</p>
            </header>

            <section class="settings-list" style="max-width: 400px; margin: 0 auto;">
                <h3 style="margin-top: 30px;">Settings</h3>
                
                <div class="setting-item">
                    <span class="setting-label">Change Location</span>
                    <a href="#" id="location-link" class="setting-action">
                        <span id="current-location-display">${profile.location}</span> &gt;
                    </a>
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
                        <input type="radio" id="temp-f" name="temp-unit" value="F" style="display: none;">
                        <label for="temp-f" class="temp-label">°F</label>
                        <input type="radio" id="temp-c" name="temp-unit" value="C" style="display: none;">
                        <label for="temp-c" class="temp-label">°C</label>
                    </div>
                </div>
                <hr>

                <div style="margin-top: 30px;">
                    <button id="signout-button" style="background-color: #f44336; color: white; width: 100%;">Sign Out</button>
                </div>
            </section>
        </div>

        <style>
             .settings-list { text-align: left; }
             .setting-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; }
             .setting-label { font-weight: 500; }
             .setting-action { color: var(--color-green-accent, #41b883); text-decoration: none; }
             
             /* Avatar Styles */
             .profile-avatar-container {
                 width: 100px; height: 100px; border-radius: 50%; 
                 margin: 0 auto 10px; 
                 overflow: hidden;
                 background-color: #333;
                 border: 3px solid var(--color-green-accent, #41b883);
             }
             .profile-avatar-img { width: 100%; height: 100%; object-fit: cover; }
             .profile-avatar-initials {
                 width: 100%; height: 100%; 
                 display: flex; align-items: center; justify-content: center;
                 font-size: 40px; color: white;
                 background-color: #555;
             }
             .upload-pic-button { 
                 padding: 5px 10px;
                 font-size: 0.8em;
                 background-color: #333;
                 color: var(--color-green-accent, #41b883);
                 border-color: var(--color-green-accent, #41b883);
             }

             /* Switch CSS */
             .switch { position: relative; display: inline-block; width: 40px; height: 24px; }
             .switch input { opacity: 0; width: 0; height: 0; }
             .slider { 
                 position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; 
                 background-color: #555; transition: .4s; border-radius: 24px;
             }
             .slider:before {
                 position: absolute; content: ""; height: 16px; width: 16px; 
                 left: 4px; bottom: 4px; background-color: white; 
                 transition: .4s; border-radius: 50%;
             }
             input:checked + .slider { background-color: var(--color-green-accent, #41b883); }
             input:checked + .slider:before { transform: translateX(16px); }

             /* Radio Toggle Switch CSS (for Temp Unit) */
             .toggle-switch { display: flex; border: 1px solid #555; border-radius: 20px; overflow: hidden; }
             .temp-label {
                 padding: 5px 10px;
                 cursor: pointer;
                 transition: background-color 0.2s, color 0.2s;
             }
             input[type="radio"]:checked + .temp-label {
                 background-color: var(--color-green-accent, #41b883);
                 color: #242424;
                 border-color: var(--color-green-accent, #41b883);
             }
             .toggle-switch input[type="radio"] { display: none; }
        </style>
    `;
}