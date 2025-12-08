// src/homePage.js

import { getMyPlants, waterPlant } from './plantService.js';

export async function renderHomePage(container, profile, weatherData, authUser) {
    let plants = [];
    
    // 1. Fetch User Plants
    if (authUser) {
        try {
            plants = await getMyPlants(authUser.uid);
        } catch (e) { console.error(e); }
    }

    // 2. Weather & Header Logic
    let tempDisplay = '--°';
    let iconHTML = '<i class="fa-solid fa-house"></i>';

    if (weatherData) {
        const tempUnit = profile.temperatureUnit || 'C';
        const tempValue = tempUnit === 'F' ? weatherData.tempF : weatherData.tempC;
        tempDisplay = `${Math.round(tempValue)}°${tempUnit}`;
        if (weatherData.icon) {
             iconHTML = `<img src="https:${weatherData.icon}" alt="Weather" style="width: 40px; height: 40px;">`;
        }
    }

    // 3. 🏆 TASK LOGIC: Find Due Plants
    const today = new Date();
    today.setHours(0,0,0,0); // Compare dates, ignore time

    // Filter: Plant is due if nextWatering <= Today
    const duePlants = plants.filter(plant => {
        if (!plant.nextWatering) return false;
        const nextDate = new Date(plant.nextWatering);
        nextDate.setHours(0,0,0,0); 
        return nextDate <= today;
    });

    // 4. Generate Task HTML
    let tasksHTML = '';

    if (plants.length === 0) {
        // Empty State (No plants at all)
        tasksHTML = `
            <div class="empty-state-card">
                <i class="fa-solid fa-seedling"></i>
                <h3>No plants yet</h3>
                <p>Add your first plant to generate care tasks.</p>
                <a href="#search" class="primary-button" style="text-decoration:none; font-size: 0.9em;">Find a Plant</a>
            </div>
        `;
    } else if (duePlants.length === 0) {
        // Success State (Plants exist, but none due)
        tasksHTML = `
            <div style="background-color: #325651; padding: 30px; border-radius: 24px; margin-top: 10px; text-align: center;">
                <i class="fa-solid fa-check-circle" style="color: #def39b; font-size: 3em; margin-bottom: 15px;"></i>
                <h3 style="margin:0 0 5px 0; color:white;">All caught up!</h3>
                <p style="font-size: 0.9em; opacity: 0.7; margin:0;">Your plants are happy for today.</p>
            </div>
        `;
    } else {
        // Render List of Tasks
        tasksHTML = `<div class="task-list">`;
        
        duePlants.forEach(plant => {
            const imageUrl = plant.profilePicURL || 'https://via.placeholder.com/150';
            
            tasksHTML += `
                <div class="task-card fade-in" id="task-${plant.id}">
                    <div class="task-img" style="background-image: url('${imageUrl}')"></div>
                    <div class="task-info">
                        <h4>${plant.customName}</h4>
                        <p><i class="fa-solid fa-droplet" style="color:#64b5f6;"></i> Needs Water</p>
                    </div>
                    <button class="task-done-btn" data-id="${plant.id}" data-interval="${plant.intervalDays}">
                        <i class="fa-solid fa-check"></i>
                    </button>
                </div>
            `;
        });
        tasksHTML += `</div>`;
    }

    // 5. Render Full Page
    container.innerHTML = `
        <div style="padding: 20px; padding-bottom: 100px;">
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h1>Today</h1>
                <div style="display: flex; align-items: center; gap: 10px; font-size: 1.5em; font-weight: bold;">
                    ${iconHTML}
                    <span>${tempDisplay}</span>
                </div>
            </header>

            <section>
                <h2>Your Tasks <span style="font-size:0.6em; opacity:0.6; font-weight:400;">(${duePlants.length})</span></h2>
                ${tasksHTML}
            </section>

            <a href="#search" class="floating-add-btn">
                <i class="fa-solid fa-plus"></i>
            </a>
        </div>
    `;

    // 6. Attach Event Listeners to "Done" Buttons
    container.querySelectorAll('.task-done-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const plantId = btn.dataset.id;
            const interval = btn.dataset.interval;
            const card = document.getElementById(`task-${plantId}`);

            // UI Feedback immediately
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            
            try {
                if (authUser) {
                    await waterPlant(authUser.uid, plantId, interval);
                    
                    // Animate removal
                    card.style.opacity = '0';
                    card.style.transform = 'translateX(20px)';
                    setTimeout(() => {
                        card.remove();
                        // If no tasks left, re-render to show "All caught up"
                        if (document.querySelectorAll('.task-card').length === 0) {
                            renderHomePage(container, profile, weatherData, authUser);
                        }
                    }, 300);
                }
            } catch (error) {
                console.error("Task failed", error);
                btn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            }
        });
    });
}