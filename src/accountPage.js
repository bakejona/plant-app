// src/accountPage.js

import { signOutUser } from './authService.js';
import { updateUserProfile } from './userService.js';
import { uploadProfilePicture } from './storageService.js';
import { fetchWeather, getCurrentBrowserLocation } from './weatherService.js'; 

/**
 * Renders the Account Page UI and attaches event listeners.
 * @param {HTMLElement} container - The DOM element to render into.
 * @param {object} profile - The user's profile data from Firestore.
 * @param {object} authUser - The Firebase Auth user object.
 */
export function renderAccountPage(container, profile, authUser) {
    container.innerHTML = generateAccountHTML(profile);

    // --- DOM REFERENCES ---
    const locationInput = document.getElementById('location-text-input');
    const saveLocationButton = document.getElementById('save-location-button');
    const locationStatus = document.getElementById('location-status');
    const uploadStatus = document.getElementById('upload-status'); // Re-reference

    // --- Event Listeners ---
    
    // 1. Sign Out
    document.getElementById('signout-button')?.addEventListener('click', signOutUser);

    // 2. ⬅️ CRITICAL FIX: Profile Picture Upload Listener (Click anywhere on the container)
    document.getElementById('upload-trigger-area')?.addEventListener('click', () => {
        document.getElementById('upload-pic-input')?.click();
    });

    // 3. File Input Change Listener (Handles Upload)
    document.getElementById('upload-pic-input')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        uploadStatus.textContent = 'Uploading...'; 

        try {
            const downloadURL = await uploadProfilePicture(authUser.uid, file);
            
            await updateUserProfile(authUser.uid, { profilePicURL: downloadURL });

            uploadStatus.textContent = 'Picture updated successfully! Reloading...';
            window.location.reload(); 

        } catch (error) {
            uploadStatus.textContent = `Upload failed: ${error.message}`;
        }
    });
    
    // 4. Location Save Button (Text Input and Validation)
    saveLocationButton?.addEventListener('click', async () => {
        const newLocationString = locationInput.value.trim();
        
        const originalLocation = profile.location || 'Set Location';
        if (!newLocationString || newLocationString === originalLocation) {
            locationStatus.textContent = '';
            return;
        }

        locationStatus.textContent = 'Validating...';

        try {
            const weatherData = await fetchWeather(newLocationString, profile.temperatureUnit);
            
            if (!weatherData || !weatherData.city) {
                 throw new Error("Invalid location or API error.");
            }

            const savedLocation = `${weatherData.city}, ${weatherData.region}`;
            await updateUserProfile(authUser.uid, { location: savedLocation });

            locationStatus.textContent = 'Location saved! Reloading...';
            window.location.reload(); 
            
        } catch (error) {
            locationStatus.textContent = `Update failed: ${error.message}. Please check spelling.`;
        }
    });
    
    // 5. Use Current Location Button (Geolocation)
    document.getElementById('use-current-location-button')?.addEventListener('click', async () => {
        locationStatus.textContent = 'Getting coordinates...';
        
        try {
            const { lat, lon } = await getCurrentBrowserLocation();
            const coords = `${lat.toFixed(4)},${lon.toFixed(4)}`; 
            
            const weatherData = await fetchWeather(coords, profile.temperatureUnit);
            
            if (!weatherData || !weatherData.city) {
                throw new Error("Could not validate location from coordinates.");
            }

            const savedLocation = `${weatherData.city}, ${weatherData.region}`;
            await updateUserProfile(authUser.uid, { location: savedLocation });

            locationInput.value = savedLocation;
            locationStatus.textContent = 'Location set by GPS! Reloading...';
            
            window.location.reload(); 
            
        } catch (error) {
            locationStatus.textContent = `Location Error: ${error.message}.`;
        }
    });


    // 6. Theme Toggle Listener (Dark Mode)
    document.getElementById('dark-mode-toggle')?.addEventListener('change', (e) => {
        const newTheme = e.target.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        updateUserProfile(authUser.uid, { theme: newTheme });
    });

    // 7. Temperature Unit Listener
    document.querySelectorAll('input[name="temp-unit"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const newUnit = e.target.value;
            updateUserProfile(authUser.uid, { temperatureUnit: newUnit });
        });
    });
    
    // --- Initial State Population ---
    
    const themeToggle = document.getElementById('dark-mode-toggle');
    if (themeToggle) {
        themeToggle.checked = profile.theme === 'dark';
        document.documentElement.setAttribute('data-theme', profile.theme);
    }
    
    const tempRadio = document.querySelector(`input[name="temp-unit"][value="${profile.temperatureUnit}"]`);
    if (tempRadio) {
        tempRadio.checked = true;
    }
    locationInput.value = profile.location || 'Set Location';
}


/**
 * Generates the HTML string for the Account page based on the wireframe.
 */
function generateAccountHTML(profile) {
    const profilePicURL = profile.profilePicURL;
    const initials = profile.email ? profile.email[0].toUpperCase() : 'P';
    const username = profile.email ? profile.email.split('@')[0] : 'PlantPal User';
    const locationDisplay = profile.location || 'Set Location';

    return `
        <div class="account-page-wrapper">
            <header class="account-header">
                
                <div id="upload-trigger-area" class="profile-avatar-container">
                    ${profilePicURL 
                        ? `<img src="${profilePicURL}" alt="Profile Picture" class="profile-avatar-img">`
                        : `<div class="profile-avatar-initials">${initials}</div>`
                    }
                    <div class="profile-edit-overlay">
<i class="fa-solid fa-pen-to-square"></i>                    </div>
                </div>
                
                <input type="file" id="upload-pic-input" accept="image/*" style="display: none;">
                
                <div id="upload-status" class="upload-status"></div>

                <h2>${username}</h2>
                <p>${profile.email}</p>
            </header>

            <section class="settings-list">
                <h3>Settings</h3>
                
                <div class="setting-item-stack">
                    <span class="setting-label">Change Location</span>
                    <div class="location-input-group">
                        <input type="text" 
                               id="location-text-input" 
                               placeholder="City, Region, or Zip Code" 
                               value="${locationDisplay}"
                               class="location-input-field">
                        
                        <div class="location-buttons">
                            <button id="use-current-location-button" class="upload-pic-button location-arrow-button">
<i class="fa-solid fa-location-arrow"></i>                       </button>
                            <button id="save-location-button" class="upload-pic-button location-save-button">Save</button>
                        </div>
                    </div>
                    <div id="location-status" class="location-status"></div>
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

                <div class="signout-container">
                    <button id="signout-button" class="signout-button">Sign Out</button>
                </div>
            </section>
        </div>
    `;
}