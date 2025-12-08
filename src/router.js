// src/router.js

import { renderAccountPage } from './accountPage.js'; 
import { renderHomePage } from './homePage.js'; 
import { renderMyPlantsPage } from './myPlantsPage.js';
import { renderSearchPage } from './searchPage.js';
import { renderPlantDetailPage } from './plantDetailPage.js'; 
import { fetchWeather } from './weatherService.js'; 

const appContent = document.getElementById('app-content');

export async function navigate(userProfile, userAuth) { 
    if (!appContent) {
        console.error("Navigation failed: #app-content element not found.");
        return; 
    }

    const hash = window.location.hash;
    let page = 'home';
    let param = null;

    if (hash.startsWith('#plantdetail/')) {
        page = 'plantdetail';
        param = hash.split('/')[1]; 
    } else if (hash === '' || hash === '#home') {
        page = 'home';
    } else if (hash === '#myplants') {
        page = 'myplants';
    } else if (hash === '#search') {
        page = 'search';
    } else if (hash === '#account') {
        page = 'account';
    } else {
        page = '404';
    }

    // Clear content 
    appContent.innerHTML = ''; 
    let weatherData = null; 

    // Fetch Weather for Home
    if (page === 'home' && userProfile.location) {
        try {
            weatherData = await fetchWeather(userProfile.location, userProfile.temperatureUnit);
        } catch (error) {
            console.warn('Could not load weather for home page:', error);
        }
    }

    // Render Page
    switch (page) {
        case 'home':
            // 🏆 FIXED: Passed 'userAuth' as the 4th argument
            renderHomePage(appContent, userProfile, weatherData, userAuth); 
            break;

        case 'myplants':
            await renderMyPlantsPage(appContent, userProfile, userAuth);
            break;
            
        case 'search':
            await renderSearchPage(appContent, userProfile, userAuth);
            break;

        case 'plantdetail':
            await renderPlantDetailPage(appContent, param, userProfile, userAuth); 
            break;

        case 'account':
            renderAccountPage(appContent, userProfile, userAuth);
            break;
            
        default:
            appContent.innerHTML = '<h1>404 - Page Not Found</h1><p>The requested page could not be found.</p>';
    }

    highlightActiveNav(hash.split('/')[0] || '#home');
}

function highlightActiveNav(currentHash) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        const linkHash = link.getAttribute('href');
        if (linkHash === currentHash) {
            link.classList.add('active');
        }
    });
}