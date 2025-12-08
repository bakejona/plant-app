// src/addPlantModal.js

import { addPlantToUser } from './plantService.js';

export function openAddPlantModal(plant, authUser) {
    // 1. Create Modal Elements
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    
    const defaultImage = plant.default_image?.thumbnail || 'https://via.placeholder.com/150/41b883/FFFFFF?text=P';
    let finalImage = defaultImage;
    let selectedDateOffset = 0; // Default to Today (0 days ago)

    modalOverlay.innerHTML = `
        <div class="modal-card">
            <button class="modal-close-btn"><i class="fa-solid fa-xmark"></i></button>
            
            <div class="modal-header">
                <h2>Add Plant</h2>
                <p>${plant.common_name}</p>
            </div>

            <div class="image-upload-wrapper">
                <div class="image-preview" style="background-image: url('${defaultImage}')"></div>
                <label class="upload-btn-label">
                    <i class="fa-solid fa-camera"></i> Change Photo
                    <input type="file" id="modal-image-input" accept="image/*">
                </label>
            </div>

            <div class="modal-form-group">
                <label>Nickname</label>
                <input type="text" id="modal-nickname" placeholder="${plant.common_name}" value="${plant.common_name}">
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
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                finalImage = e.target.result;
                preview.style.backgroundImage = `url('${finalImage}')`;
            };
            reader.readAsDataURL(file);
        }
    });

    // 3. Submit
    submitBtn.addEventListener('click', async () => {
        const nickname = document.getElementById('modal-nickname').value || plant.common_name;

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
                customImage: finalImage,
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