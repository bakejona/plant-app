// src/profileMenu.js
// Floating profile button (fixed top-right) with an expanding dropdown menu.

import { signOutUser } from './authService.js';
import { updateUserProfile } from './userService.js';
import { fetchWeather, getCurrentBrowserLocation } from './weatherService.js';

// Compress an image File to a base64 JPEG data-URL (max 200×200px, quality 0.75)
function compressImage(file) {
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

let menuOpen    = false;
let activePanel = 'main'; // 'main' | 'edit' | 'location'

// Called once after login. Container is a fixed-position root div.
export function mountProfileMenu(container, profile, authUser) {

    function avatarHTML(small = false) {
        const cls = small ? 'pmenu-avatar pmenu-avatar--sm' : 'pmenu-avatar';
        if (profile.profilePicURL) {
            return `<img src="${profile.profilePicURL}" alt="Profile" class="${cls}">`;
        }
        const initial = (profile.displayName || profile.email || 'U')[0].toUpperCase();
        return `<div class="${cls} pmenu-avatar--initials">${initial}</div>`;
    }

    function displayName() {
        return profile.displayName || profile.email?.split('@')[0] || 'User';
    }

    // ── Main menu panel ───────────────────────────────────────────────────────
    function mainPanelHTML() {
        const unit = profile.temperatureUnit || 'C';
        return `
            <div class="pmenu-dropdown" id="pmenu-dropdown">
                <div class="pmenu-user-row">
                    <div class="pmenu-user-info">
                        <p class="pmenu-user-name">${displayName()}</p>
                        <p class="pmenu-user-email">${profile.email || ''}</p>
                    </div>
                    ${avatarHTML(true)}
                </div>
                <hr class="pmenu-divider">
                <button class="pmenu-item" id="pmenu-edit-btn">
                    <i class="fa-solid fa-pen-to-square"></i> Edit profile
                </button>
                <button class="pmenu-item" id="pmenu-location-btn">
                    <i class="fa-solid fa-location-dot"></i> Change location
                </button>
                <div class="pmenu-item pmenu-temp-row">
                    <i class="fa-solid fa-temperature-half"></i>
                    <span>Temperature</span>
                    <div class="pmenu-temp-toggle">
                        <button class="pmenu-temp-btn ${unit === 'C' ? 'active' : ''}" data-unit="C">°C</button>
                        <button class="pmenu-temp-btn ${unit === 'F' ? 'active' : ''}" data-unit="F">°F</button>
                    </div>
                </div>
                <hr class="pmenu-divider">
                <button class="pmenu-item pmenu-item--danger" id="pmenu-signout-btn">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i> Sign out
                </button>
            </div>
        `;
    }

    // ── Edit profile panel ────────────────────────────────────────────────────
    function editPanelHTML() {
        return `
            <div class="pmenu-dropdown" id="pmenu-dropdown">
                <div class="pmenu-panel-header">
                    <button class="pmenu-back-btn" id="pmenu-back-btn"><i class="fa-solid fa-arrow-left"></i></button>
                    <span>Edit profile</span>
                </div>
                <hr class="pmenu-divider">
                <div class="pmenu-edit-avatar-row" id="pmenu-upload-area">
                    ${avatarHTML()}
                    <span class="pmenu-edit-avatar-label">Change photo</span>
                </div>
                <input type="file" id="pmenu-pic-input" accept="image/*" style="display:none;">
                <p id="pmenu-upload-status" class="pmenu-status-text"></p>
                <div class="pmenu-field">
                    <label class="pmenu-field-label">Display name</label>
                    <input id="pmenu-name-input" class="pmenu-input" type="text" value="${displayName()}" placeholder="Your name">
                </div>
                <button class="pmenu-save-btn" id="pmenu-save-name-btn">Save name</button>
                <p id="pmenu-name-status" class="pmenu-status-text"></p>
            </div>
        `;
    }

    // ── Location panel ────────────────────────────────────────────────────────
    function locationPanelHTML() {
        return `
            <div class="pmenu-dropdown" id="pmenu-dropdown">
                <div class="pmenu-panel-header">
                    <button class="pmenu-back-btn" id="pmenu-back-btn"><i class="fa-solid fa-arrow-left"></i></button>
                    <span>Change location</span>
                </div>
                <hr class="pmenu-divider">
                <div class="pmenu-field">
                    <label class="pmenu-field-label">City, region, or zip</label>
                    <input id="pmenu-loc-input" class="pmenu-input" type="text" value="${profile.location || ''}" placeholder="e.g. London, UK">
                </div>
                <div class="pmenu-loc-btns">
                    <button class="pmenu-save-btn pmenu-save-btn--secondary" id="pmenu-gps-btn">
                        <i class="fa-solid fa-location-arrow"></i> Use my location
                    </button>
                    <button class="pmenu-save-btn" id="pmenu-save-loc-btn">Save</button>
                </div>
                <p id="pmenu-loc-status" class="pmenu-status-text"></p>
            </div>
        `;
    }

    // ── Render ────────────────────────────────────────────────────────────────
    function render() {
        let panelHTML = '';
        if (menuOpen) {
            if (activePanel === 'edit')     panelHTML = editPanelHTML();
            else if (activePanel === 'location') panelHTML = locationPanelHTML();
            else                            panelHTML = mainPanelHTML();
        }

        container.innerHTML = `
            <div class="pmenu-root">
                <button class="pmenu-btn ${menuOpen ? 'pmenu-btn--open' : ''}" id="pmenu-open-btn" aria-label="Profile menu">
                    ${avatarHTML()}
                </button>
                ${panelHTML}
            </div>
        `;

        bindEvents();
    }

    // ── Event binding ─────────────────────────────────────────────────────────
    function bindEvents() {
        // Toggle open/close
        document.getElementById('pmenu-open-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            menuOpen    = !menuOpen;
            activePanel = 'main';
            render();
        });

        // Stop dropdown clicks from propagating to the outside-click handler
        document.getElementById('pmenu-dropdown')?.addEventListener('click', (e) => e.stopPropagation());

        if (!menuOpen) return;

        if (activePanel === 'main') {
            // Sign out
            document.getElementById('pmenu-signout-btn')?.addEventListener('click', () => {
                menuOpen = false;
                render();
                signOutUser();
            });

            // Navigate to edit
            document.getElementById('pmenu-edit-btn')?.addEventListener('click', () => {
                activePanel = 'edit';
                render();
            });

            // Navigate to location
            document.getElementById('pmenu-location-btn')?.addEventListener('click', () => {
                activePanel = 'location';
                render();
            });

            // Temperature toggle — save and re-render menu without reloading
            document.querySelectorAll('.pmenu-temp-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const unit = btn.dataset.unit;
                    if (unit === profile.temperatureUnit) return;
                    profile.temperatureUnit = unit;
                    await updateUserProfile(authUser.uid, { temperatureUnit: unit });
                    render(); // stay open, just update the toggle state
                });
            });
        }

        if (activePanel === 'edit') {
            document.getElementById('pmenu-back-btn')?.addEventListener('click', () => {
                activePanel = 'main';
                render();
            });

            // Profile picture
            document.getElementById('pmenu-upload-area')?.addEventListener('click', () => {
                document.getElementById('pmenu-pic-input')?.click();
            });
            document.getElementById('pmenu-pic-input')?.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const status = document.getElementById('pmenu-upload-status');
                status.textContent = 'Processing…';
                try {
                    const dataUrl = await compressImage(file);
                    await updateUserProfile(authUser.uid, { profilePicURL: dataUrl });
                    status.textContent = 'Updated! Reloading…';
                    window.location.reload();
                } catch (err) {
                    status.textContent = `Failed: ${err.message}`;
                }
            });

            // Display name
            document.getElementById('pmenu-save-name-btn')?.addEventListener('click', async () => {
                const name   = document.getElementById('pmenu-name-input').value.trim();
                const status = document.getElementById('pmenu-name-status');
                if (!name) return;
                try {
                    await updateUserProfile(authUser.uid, { displayName: name });
                    status.textContent = 'Saved! Reloading…';
                    window.location.reload();
                } catch (err) {
                    status.textContent = `Failed: ${err.message}`;
                }
            });
        }

        if (activePanel === 'location') {
            document.getElementById('pmenu-back-btn')?.addEventListener('click', () => {
                activePanel = 'main';
                render();
            });

            // GPS location
            document.getElementById('pmenu-gps-btn')?.addEventListener('click', async () => {
                const status = document.getElementById('pmenu-loc-status');
                status.textContent = 'Getting location…';
                try {
                    const { lat, lon } = await getCurrentBrowserLocation();
                    const weather = await fetchWeather(`${lat.toFixed(4)},${lon.toFixed(4)}`, profile.temperatureUnit);
                    if (!weather?.city) throw new Error('Could not resolve location.');
                    const loc = `${weather.city}, ${weather.region}`;
                    await updateUserProfile(authUser.uid, { location: loc });
                    status.textContent = 'Location set! Reloading…';
                    window.location.reload();
                } catch (err) {
                    status.textContent = `Error: ${err.message}`;
                }
            });

            // Manual location
            document.getElementById('pmenu-save-loc-btn')?.addEventListener('click', async () => {
                const input  = document.getElementById('pmenu-loc-input').value.trim();
                const status = document.getElementById('pmenu-loc-status');
                if (!input) return;
                status.textContent = 'Validating…';
                try {
                    const weather = await fetchWeather(input, profile.temperatureUnit);
                    if (!weather?.city) throw new Error('Invalid location.');
                    const loc = `${weather.city}, ${weather.region}`;
                    await updateUserProfile(authUser.uid, { location: loc });
                    status.textContent = 'Saved! Reloading…';
                    window.location.reload();
                } catch (err) {
                    status.textContent = `Failed: ${err.message}. Check spelling.`;
                }
            });
        }
    }

    // Close on outside click
    document.addEventListener('click', () => {
        if (menuOpen) {
            menuOpen    = false;
            activePanel = 'main';
            render();
        }
    });

    render();
}
