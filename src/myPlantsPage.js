// src/myPlantsPage.js

import { getMyPlants } from './plantService.js';

export async function renderMyPlantsPage(container, profile, authUser) {
    container.innerHTML = '<div style="padding: 20px;"><h1>My Plants</h1><p>Loading...</p></div>';
    
    try {
        const plants = await getMyPlants(authUser.uid);
        
        if (plants.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px;">
                    <h1>No Plants Yet!</h1>
                    <p style="color: #aaa; margin-bottom: 20px;">Start building your collection.</p>
                    <a href="#search" class="upload-pic-button" style="text-decoration: none; padding: 10px 20px;">Find Plants</a>
                </div>
            `;
            return;
        }

        // Group plants by roomLocation
        const groupedPlants = plants.reduce((groups, plant) => {
            const location = plant.roomLocation || 'Unsorted';
            if (!groups[location]) groups[location] = [];
            groups[location].push(plant);
            return groups;
        }, {});

        container.innerHTML = generateGalleryHTML(groupedPlants);

    } catch (error) {
        container.innerHTML = `<h1 style="color: #f44336; padding: 20px;">Error: ${error.message}</h1>`;
        console.error(error);
    }
}

function generateGalleryHTML(groupedPlants) {
    let html = `
        <div class="my-plants-wrapper" style="padding: 20px; padding-bottom: 100px;">
        <header>
            <h1>My Plants</h1>
        </header>
        <div class="plant-gallery">
    `;

    for (const location in groupedPlants) {
        html += `<h2 class="location-header" style="margin-top: 20px; font-size: 1.2em; color: #41b883;">${location}</h2>`;
        html += `<div class="plant-grid-layout">`; // Reuse grid from search page
        
        groupedPlants[location].forEach(plant => {
            const plantName = plant.customName || plant.common_name || 'Unknown Plant';
            const imageUrl = plant.profilePicURL || plant.image_url || 'https://via.placeholder.com/150/41b883/FFFFFF?text=P'; 
            
            html += `
                <div class="plant-card">
                    <div class="card-image" style="background-image: url('${imageUrl}')"></div>
                    <div class="card-info">
                        <h3>${plantName}</h3>
                    </div>
                </div>
            `;
        });
        html += `</div>`; 
    }

    html += `
        <a href="#search" class="floating-add-btn">
            <i class="fa-solid fa-plus"></i>
        </a>
    </div></div>`; 
    
    return html;
}