// src/journalModal.js

import { addJournalEntry } from './plantService.js';
import { logoSVG } from './logoSVG.js';

function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1600 / img.width, 1600 / img.height, 1);
                const canvas = document.createElement('canvas');
                canvas.width  = Math.round(img.width  * scale);
                canvas.height = Math.round(img.height * scale);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.92));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function openJournalModal(plant, authUser, { onSaved } = {}) {
    const plantName = plant.customName || plant.common_name || 'My Plant';
    const hasCurrentPhoto = !!plant.profilePicURL;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-card journal-modal-card">
            <button class="modal-close-btn"><i class="fa-solid fa-xmark"></i></button>

            <div class="modal-header">
                <h2>Plant Journal</h2>
                <p>${plantName}</p>
            </div>

            <div class="journal-photo-section">
                <div class="journal-photo-preview ${hasCurrentPhoto ? '' : 'journal-photo-preview--empty'}"
                     id="journal-photo-preview"
                     ${hasCurrentPhoto ? `style="background-image:url('${plant.profilePicURL}')"` : ''}>
                    ${!hasCurrentPhoto ? logoSVG('journal-empty-icon') : ''}
                </div>
                <div class="journal-photo-actions">
                    <label class="upload-btn-label">
                        <i class="fa-solid fa-camera"></i> Upload Photo
                        <input type="file" id="journal-img-input" accept="image/*">
                    </label>
                    ${hasCurrentPhoto ? `
                    <label class="journal-replace-label" id="journal-replace-label" style="display:none;">
                        <input type="checkbox" id="journal-replace-check">
                        Replace current photo
                    </label>` : ''}
                </div>
            </div>

            <div class="modal-form-group">
                <label>How is it doing?</label>
                <textarea id="journal-comment" class="journal-textarea" placeholder="New growth, yellowing leaves, repotted…" rows="3"></textarea>
            </div>

            <div class="modal-form-group">
                <label>Health Rating</label>
                <div class="journal-rating-grid" id="journal-rating-grid">
                    ${Array.from({ length: 5 }, (_, i) => `
                        <button class="journal-rating-btn" data-rating="${i + 1}">${i + 1}</button>
                    `).join('')}
                </div>
            </div>

            <button id="journal-submit-btn" class="primary-button" style="margin-top:10px; padding:15px;" disabled>
                Save Entry
            </button>
        </div>
    `;

    document.body.appendChild(overlay);

    let newPhotoURL  = '';
    let selectedRating = 0;

    const preview       = overlay.querySelector('#journal-photo-preview');
    const imgInput      = overlay.querySelector('#journal-img-input');
    const replaceLabel  = overlay.querySelector('#journal-replace-label');
    const replaceCheck  = overlay.querySelector('#journal-replace-check');
    const ratingBtns    = overlay.querySelectorAll('.journal-rating-btn');
    const submitBtn     = overlay.querySelector('#journal-submit-btn');
    const commentEl     = overlay.querySelector('#journal-comment');

    function checkSubmitReady() {
        submitBtn.disabled = selectedRating === 0;
    }

    // Image upload
    imgInput?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        preview.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="font-size:1.5rem;color:#a8e063;"></i>';
        try {
            newPhotoURL = await compressImage(file);
            preview.style.backgroundImage = `url('${newPhotoURL}')`;
            preview.classList.remove('journal-photo-preview--empty');
            preview.innerHTML = '';
            if (replaceLabel) replaceLabel.style.display = 'flex';
        } catch {
            preview.innerHTML = logoSVG('journal-empty-icon');
        }
    });

    // Rating selection
    ratingBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            ratingBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedRating = parseInt(btn.dataset.rating);
            checkSubmitReady();
        });
    });

    // Submit
    submitBtn.addEventListener('click', async () => {
        const comment      = commentEl.value.trim();
        const replacedPhoto = replaceCheck?.checked && !!newPhotoURL;
        const photoURL     = newPhotoURL;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';

        try {
            await addJournalEntry(authUser.uid, plant.id, { comment, rating: selectedRating, photoURL, replacedPhoto });
            submitBtn.style.backgroundColor = '#4caf50';
            submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
            setTimeout(() => {
                overlay.remove();
                onSaved?.({ photoURL: replacedPhoto ? photoURL : null });
            }, 900);
        } catch (err) {
            console.error(err);
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Error. Try Again.';
            submitBtn.style.backgroundColor = '#f44336';
        }
    });

    // Close
    const closeModal = () => overlay.remove();
    overlay.querySelector('.modal-close-btn').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
}
