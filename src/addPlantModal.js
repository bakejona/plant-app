// src/addPlantModal.js

import { addPlantToUser } from './plantService.js';
import { logoSVG } from './logoSVG.js';

// Compress an image File to a base64 JPEG (max 1600px on longest side, quality 0.92)
function compressImage(file, maxPx = 1600, quality = 0.92) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(maxPx / img.width, maxPx / img.height, 1);
                const canvas = document.createElement('canvas');
                canvas.width  = Math.round(img.width  * scale);
                canvas.height = Math.round(img.height * scale);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function openAddPlantModal(plant, authUser) {
    // 1. Create Modal Elements
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    
    const plantName = plant.name || plant.common_name || 'Plant';
    let finalImage = '';
    let selectedDateOffset = 0; // Default to Today (0 days ago)

    modalOverlay.innerHTML = `
        <div class="modal-card">
            <button class="modal-close-btn"><i class="fa-solid fa-xmark"></i></button>

            <div class="modal-header">
                <h2>Add Plant</h2>
                <p>${plantName}</p>
            </div>

            <div class="image-upload-wrapper">
                <div class="image-preview image-preview--empty">${logoSVG()}</div>
                <label class="upload-btn-label">
                    <i class="fa-solid fa-camera"></i> Add Photo
                    <input type="file" id="modal-image-input" accept="image/*">
                </label>
            </div>

            <div class="modal-form-group">
                <label>Nickname</label>
                <input type="text" id="modal-nickname" placeholder="${plantName}" value="${plantName}">
            </div>

            <div class="modal-form-group">
                <label>When was it last watered?</label>
                <div class="watering-options-grid">
                    <button class="water-opt-btn selected" data-days="0">Today</button>
                    <button class="water-opt-btn" data-days="1">Yesterday</button>
                    <button class="water-opt-btn" data-days="7">~1 Week Ago</button>
                    <button class="water-opt-btn" data-days="14">~2 Weeks Ago</button>
                    <button class="water-opt-btn full-width" data-days="30">Not Sure / Dry</button>
                </div>
            </div>

            <button id="modal-submit-btn" class="primary-button" style="margin-top: 10px; padding: 15px;">
                Add to My Plants
            </button>
        </div>
    `;

    document.body.appendChild(modalOverlay);

    // --- LOGIC ---

    const closeBtn = modalOverlay.querySelector('.modal-close-btn');
    const submitBtn = modalOverlay.querySelector('#modal-submit-btn');
    const imageInput = modalOverlay.querySelector('#modal-image-input');
    const preview = modalOverlay.querySelector('.image-preview');
    const waterBtns = modalOverlay.querySelectorAll('.water-opt-btn');

    // 1. Handle Watering Button Selection
    waterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove 'selected' from all
            waterBtns.forEach(b => b.classList.remove('selected'));
            // Add to clicked
            btn.classList.add('selected');
            // Update value
            selectedDateOffset = parseInt(btn.dataset.days);
        });
    });

    // 2. Handle Image Upload
    imageInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        preview.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        try {
            finalImage = await compressImage(file);
            preview.innerHTML = '';
            preview.classList.remove('image-preview--empty');
            preview.style.backgroundImage = `url('${finalImage}')`;
        } catch {
            preview.innerHTML = logoSVG();
        }
    });

    // 3. Submit
    submitBtn.addEventListener('click', async () => {
        const nickname = document.getElementById('modal-nickname').value || plantName;

        // Calculate Date based on offset
        const dateCalc = new Date();
        dateCalc.setDate(dateCalc.getDate() - selectedDateOffset);
        // Format as YYYY-MM-DD
        const lastWateredStr = dateCalc.toISOString().split('T')[0];

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        try {
            await addPlantToUser(authUser.uid, plant, {
                customName: nickname,
                customImage: finalImage || '',
                lastWatered: lastWateredStr
            });

            submitBtn.style.backgroundColor = '#4caf50'; // Green success
            submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Added!';
            
            setTimeout(() => {
                closeModal();
                window.location.hash = '#myplants'; // Redirect
            }, 1000);

        } catch (error) {
            console.error(error);
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Error. Try Again.';
            submitBtn.style.backgroundColor = '#f44336';
        }
    });

    const closeModal = () => modalOverlay.remove();
    closeBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
}