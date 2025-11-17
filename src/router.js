// src/router.js

import { renderAccountPage } from './accountPage.js'; 

const routes = {
    '': 'home', // Default route
    '#home': 'home',
    '#myplants': 'myplants',
    '#search': 'search',
    '#account': 'account'
};

// ⬇️ CRITICAL FIX: Target the #app-content element that exists in index.html
const appContent = document.getElementById('app-content');

/**
 * Handles navigation by loading content into the app-content div.
 * @param {object} userProfile - The user's Firestore profile data.
 * @param {object} userAuth - The Firebase Auth user object.
 */
export function navigate(userProfile, userAuth) {
    if (!appContent) {
        console.error("Navigation failed: #app-content element not found.");
        return; 
    }

    const route = window.location.hash || '#home';
    const page = routes[route];

    // This is the line that was failing (Line 25 in the old version)
    appContent.innerHTML = ''; 

    // Handle pages based on route
    switch (page) {
        case 'home':
            appContent.innerHTML = '<h1>Home Screen (PlantPal)</h1><p>Checklist and Weather will go here.</p>';
            break;

        case 'myplants':
            appContent.innerHTML = '<h1>My Plants</h1><p>Gallery of your plants goes here.</p>';
            break;
            
        case 'search':
            appContent.innerHTML = '<h1>Plant Search</h1><p>Search and API filtering goes here.</p>';
            break;

        case 'account':
            // Render the Account Page, passing user data for display/updates
            renderAccountPage(appContent, userProfile, userAuth);
            break;
            
        default:
            appContent.innerHTML = '<h1>404 - Page Not Found</h1>';
    }

    highlightActiveNav(route);
}

function highlightActiveNav(currentHash) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        const linkHash = link.getAttribute('href');

        if (linkHash === currentHash) {
            link.classList.add('active');
        } else if (currentHash === '' && linkHash === '#home') {
             link.classList.add('active');
        }
    });
}