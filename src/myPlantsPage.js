// src/myPlantsPage.js

import { getMyPlants } from './plantService.js';
import { renderMyPlantDetailView } from './myPlantDetailView.js';
import { logoSVG } from './logoSVG.js';
import { PLANT_IMAGES } from './plantImages.js';

export async function renderMyPlantsPage(container, profile, authUser) {
    container.innerHTML = '<div style="padding: 20px;"><h1 style="margin-bottom:20px;">My Plants</h1><p class="loading-text">Loading...</p></div>';
    
    try {
        const plants = await getMyPlants(authUser.uid);
        
        if (plants.length === 0) {
            container.innerHTML = `
                <div class="my-plants-wrapper" style="padding: 20px; padding-bottom: 100px;">
                    <h1 style="margin-bottom: 20px;">My Plants</h1>
                    <div class="home-empty-card">
                        <div class="home-empty-deco" aria-hidden="true">
                            <div class="home-empty-circle"></div>
                            ${logoSVG('home-empty-logo')}
                        </div>
                        <h3 class="home-empty-title">No Plants Yet</h3>
                        <p class="home-empty-sub">Start your indoor<br>jungle today.</p>
                        <a href="#search" class="home-empty-btn">
                            Add Plant <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                    <a href="#search" class="floating-add-btn"><i class="fa-solid fa-plus"></i></a>
                </div>
            `;
            return;
        }

        // 🏆 NEW: Simple Image Gallery
        let html = `
            <div class="my-plants-wrapper" style="padding: 20px; padding-bottom: 100px;">
                <h1 style="margin-bottom: 20px;">My Plants</h1>
                <div class="my-plant-gallery-grid">
        `;

        plants.forEach(plant => {
            const imageUrl = plant.profilePicURL || PLANT_IMAGES[plant.rtdb_id] || '';
            html += `
                <div class="gallery-card" data-id="${plant.id}">
                    ${imageUrl
                        ? `<div class="gallery-image" style="background-image:url('${imageUrl}'); background-size:cover; background-position:center;"></div>`
                        : `<div class="gallery-image gallery-image--empty">${logoSVG('gallery-empty-icon')}</div>`
                    }
                    <div class="gallery-card-label">
                        <span class="gallery-card-name">${plant.customName || 'My Plant'}</span>
                    </div>
                </div>
            `;
        });

        html += `</div>
            <a href="#search" class="floating-add-btn"><i class="fa-solid fa-plus"></i></a>
        </div>`;

        container.innerHTML = html;

        // Click Listeners
        container.querySelectorAll('.gallery-card').forEach(card => {
            card.addEventListener('click', () => {
                const plantId = card.dataset.id;
                const selectedPlant = plants.find(p => p.id === plantId);
                renderMyPlantDetailView(container, selectedPlant, profile, authUser);
            });
        });

    } catch (error) {
        console.error(error);
        container.innerHTML = `<h1 style="color: #f44336; padding: 20px;">Error loading plants.</h1>`;
    }
}