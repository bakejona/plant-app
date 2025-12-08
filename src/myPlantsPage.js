// src/myPlantsPage.js

import { getMyPlants } from './plantService.js';
import { renderMyPlantDetailView } from './myPlantDetailView.js';

export async function renderMyPlantsPage(container, profile, authUser) {
    container.innerHTML = '<div style="padding: 20px;"><h1 style="margin-bottom:20px;">My Plants</h1><p class="loading-text">Loading...</p></div>';
    
    try {
        const plants = await getMyPlants(authUser.uid);
        
        if (plants.length === 0) {
            container.innerHTML = `
                <div class="account-page-wrapper">
                    <h1 style="margin-bottom:20px;">My Plants</h1>
                    <div class="empty-state-card">
                        <i class="fa-brands fa-pagelines"></i>
                        <h3>Your collection is empty</h3>
                        <p>Start your indoor jungle today.</p>
                        <a href="#search" class="primary-button" style="text-decoration:none; font-size: 0.9em;">Add Plant</a>
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
            const imageUrl = plant.profilePicURL || 'https://via.placeholder.com/300/41b883/FFFFFF?text=P';
            
            // Clean Card (Image Only)
            html += `
                <div class="gallery-card" data-id="${plant.id}">
                    <div class="gallery-image" style="background-image: url('${imageUrl}')"></div>
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