// src/searchPage.js

import { searchPlantSpecies, fetchTrendingPlants } from './plantService.js';

// MODULE STATE
let savedFilters = { indoor: 1 };
let savedQuizStep = 0;
let isQuizActive = true; 

export async function renderSearchPage(container, profile, authUser) {
    container.innerHTML = generateSearchHTML();
    
    // DOM Elements
    const searchInput = document.getElementById('plant-search-input');
    const resultsContainer = document.getElementById('search-results-list');
    const sectionTitle = document.getElementById('section-title');
    const quizContainer = document.getElementById('plant-quiz-container');
    const quizContent = document.getElementById('quiz-content');
    
    // Quiz Data
    const quizSteps = [
        {
            question: "How much light does your space get?",
            icon: "fa-sun",
            options: [
                { label: "Bright Direct Sun", value: "full_sun", type: "sunlight" },
                { label: "Bright Indirect", value: "part_shade", type: "sunlight" },
                { label: "Low / Artificial", value: "shade", type: "sunlight" }
            ]
        },
        {
            question: "How busy are you?",
            icon: "fa-user-clock",
            options: [
                { label: "Very Busy (Hard to Kill)", value: "low", type: "maintenance" },
                { label: "I have some time", value: "moderate", type: "maintenance" },
                { label: "Plant Expert", value: "high", type: "maintenance" }
            ]
        },
        {
            question: "How often will you water?",
            icon: "fa-droplet",
            options: [
                { label: "Daily / Weekly", value: "frequent", type: "watering" },
                { label: "Every 1-2 Weeks", value: "average", type: "watering" },
                { label: "Ideally Never (Monthly)", value: "minimum", type: "watering" }
            ]
        },
        {
            question: "Do you have pets?",
            icon: "fa-paw",
            options: [
                { label: "Yes (Pet Safe Only)", value: "0", type: "poisonous" }, 
                { label: "No (Any Plant)", value: "1", type: "poisonous" } 
            ]
        }
    ];

    // --- RENDER START SCREEN ---
    const renderQuizStart = () => {
        if(sectionTitle) sectionTitle.style.display = 'none';
        
        quizContent.innerHTML = `
            <div class="quiz-start-card fade-in">
                <div class="quiz-start-content">
                    <h2>Find Your Perfect Plant</h2>
                    <p>Answer 4 simple questions to discover your best match.</p>
                </div>
                <div class="quiz-btn-container">
                    <button id="start-quiz-btn" class="start-btn">
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;

        document.getElementById('start-quiz-btn').addEventListener('click', () => {
            savedQuizStep = 0;
            renderQuizStep(0);
        });
    };

    // --- RENDER QUIZ STEP ---
    const renderQuizStep = (stepIndex) => {
        if (stepIndex >= quizSteps.length) {
            finishQuiz();
            return;
        }

        if(sectionTitle) sectionTitle.style.display = 'none';

        const step = quizSteps[stepIndex];
        
        let html = `
            <div class="quiz-step-card fade-in">
                <div class="quiz-header-row">
                    <div class="quiz-icon"><i class="fa-solid ${step.icon}"></i></div>
                    <h3>${step.question}</h3>
                </div>
                <div class="quiz-options">
        `;

        step.options.forEach(opt => {
            html += `
                <button class="quiz-btn" data-type="${opt.type}" data-value="${opt.value}">
                    ${opt.label}
                </button>
            `;
        });

        html += `</div>
            <div class="quiz-progress">Step ${stepIndex + 1} of ${quizSteps.length}</div>
        </div>`;

        quizContent.innerHTML = html;

        quizContent.querySelectorAll('.quiz-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                const val = e.target.dataset.value;
                
                if (type === 'poisonous' && val === '1') {
                    // Do nothing
                } else {
                    savedFilters[type] = val;
                }
                
                savedQuizStep++;
                renderQuizStep(savedQuizStep);
            });
        });
    };

    const finishQuiz = () => {
        isQuizActive = false;
        quizContainer.style.display = 'none';
        updateResults(); 
    };

    const resetQuiz = () => {
        savedFilters = { indoor: 1 }; 
        savedQuizStep = 0;
        isQuizActive = true;
        searchInput.value = ''; 
        
        resultsContainer.style.display = 'none';
        quizContainer.style.display = 'block';
        
        renderQuizStart(); 
    };

    // --- 🏆 UPDATED: LOGIC TO SEPARATE MODES ---
    const updateResults = async () => {
        const query = searchInput.value.trim();
        const hasQuizFilters = Object.keys(savedFilters).length > 1;

        // MODE 1: MANUAL SEARCH (Prioritize this if user types anything)
        if (query.length > 0) {
            isQuizActive = false; // We are searching, not quizzing
            
            sectionTitle.style.display = 'block';
            sectionTitle.textContent = `Results for "${query}"`;

            quizContainer.style.display = 'none';
            resultsContainer.style.display = 'block';
            resultsContainer.innerHTML = '<p class="loading-text">Finding plants...</p>';

            try {
                // 🔒 Search ALL Indoor Plants (Ignore Quiz Filters)
                const results = await searchPlantSpecies(query, { indoor: 1 });
                
                if (results.length === 0) {
                    resultsContainer.innerHTML = `<p class="no-results">No plants found.</p>`;
                } else {
                    // Just Render List (NO Retake Buttons)
                    resultsContainer.innerHTML = renderGroupedPlantList(results);
                }
            } catch (error) {
                resultsContainer.innerHTML = `<p class="error-text">Error: ${error.message}</p>`;
            }
        } 
        // MODE 2: QUIZ RESULTS (No text, but user finished quiz)
        else if (hasQuizFilters) {
            isQuizActive = false;
            
            sectionTitle.style.display = 'block';
            sectionTitle.textContent = "Your Matches";

            quizContainer.style.display = 'none';
            resultsContainer.style.display = 'block';
            
            // Show Retake Button at TOP
            resultsContainer.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <button id="retake-quiz-btn-top" class="primary-button" style="font-size: 0.9em; padding: 8px 16px;">
                        <i class="fa-solid fa-rotate-left"></i> Retake Quiz
                    </button>
                </div>
                <p class="loading-text">Finding matches...</p>
            `;
            
            document.getElementById('retake-quiz-btn-top').addEventListener('click', resetQuiz);

            try {
                // Search with SAVED QUIZ FILTERS
                const results = await searchPlantSpecies('', savedFilters);
                
                if (results.length === 0) {
                    resultsContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fa-solid fa-leaf" style="font-size: 3em; color: #444; margin-bottom: 10px;"></i>
                            <p>No plants found. Try different filters.</p>
                            <button id="retake-quiz-btn-empty" class="primary-button" style="margin-top:20px;">Retake Quiz</button>
                        </div>`;
                    document.getElementById('retake-quiz-btn-empty').addEventListener('click', resetQuiz);
                } else {
                    let html = renderGroupedPlantList(results);
                    
                    // Show Retake Button at BOTTOM too
                    html += `
                        <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
                            <button id="retake-quiz-btn-bottom" class="primary-button outline">
                                <i class="fa-solid fa-rotate-left"></i> Retake Quiz
                            </button>
                        </div>
                    `;
                    
                    // Append list after the top button
                    resultsContainer.innerHTML += html;
                    document.getElementById('retake-quiz-btn-bottom').addEventListener('click', resetQuiz);
                }
            } catch (error) {
                resultsContainer.innerHTML = `<p class="error-text">Error: ${error.message}</p>`;
            }
        } 
        // MODE 3: DEFAULT START SCREEN
        else {
            isQuizActive = true;
            sectionTitle.style.display = 'none'; // Hide header for cleaner start screen
            resultsContainer.style.display = 'none';
            quizContainer.style.display = 'block';
            renderQuizStart();
        }
    };

    // Listeners
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => updateResults(), 500);
    });

    container.addEventListener('click', (e) => {
        const card = e.target.closest('.plant-list-item');
        if (card && !e.target.closest('.add-btn')) {
            window.location.hash = `#plantdetail/${card.dataset.id}`;
        }
    });

    // Initial Check
    if (!isQuizActive || Object.keys(savedFilters).length > 1) {
        updateResults();
    } else {
        renderQuizStart();
    }
}

// ... (Rest of Helper Functions: renderGroupedPlantList, createPlantListItem, generateSearchHTML remain the same) ...
function renderGroupedPlantList(plants) {
    if (!plants || !Array.isArray(plants)) return '';
    const groups = plants.reduce((acc, plant) => {
        const firstLetter = (plant.common_name || "U").charAt(0).toUpperCase();
        if (!acc[firstLetter]) acc[firstLetter] = [];
        acc[firstLetter].push(plant);
        return acc;
    }, {});

    return Object.keys(groups).sort().map(letter => `
        <div class="alphabet-section">
            <h3 class="alphabet-header">${letter}</h3>
            <div class="plant-list-layout">
                ${groups[letter].map(plant => createPlantListItem(plant)).join('')}
            </div>
        </div>
    `).join('');
}

function createPlantListItem(plant) {
    const imageUrl = plant.default_image?.thumbnail || 'https://via.placeholder.com/150/41b883/FFFFFF?text=No+Image';
    const name = plant.common_name || 'Unknown Plant';
    const scientific = Array.isArray(plant.scientific_name) ? plant.scientific_name[0] : plant.scientific_name;
    
    let sunIcon = '';
    if (plant.sunlight?.includes('full_sun')) sunIcon = '<i class="fa-solid fa-sun" title="Bright"></i>';
    else if (plant.sunlight?.includes('part_shade')) sunIcon = '<i class="fa-solid fa-cloud-sun" title="Indirect"></i>';
    
    let waterIcon = '';
    if (plant.watering === 'Frequent') waterIcon = '<i class="fa-solid fa-droplet" style="color:#64b5f6" title="Frequent"></i>';
    else if (plant.watering === 'Minimum') waterIcon = '<i class="fa-solid fa-leaf" style="color:#a5d6a7" title="Low Water"></i>';

    return `
        <div class="plant-list-item" data-id="${plant.id}">
            <div class="list-image" style="background-image: url('${imageUrl}')"></div>
            <div class="list-info">
                <h3 class="list-name">${name}</h3>
                <p class="list-scientific">${scientific}</p>
            </div>
            <div class="list-meta">
                <div class="meta-icons">${sunIcon} ${waterIcon}</div>
                <i class="fa-solid fa-chevron-right list-arrow"></i>
            </div>
        </div>
    `;
}

function generateSearchHTML() {
    return `
        <div class="search-page-wrapper">
            <header class="search-header">
                <h1>Discover</h1>
                <div class="search-bar-container">
                    <i class="fa-solid fa-magnifying-glass search-icon"></i>
                    <input type="text" id="plant-search-input" placeholder="Search plants directly...">
                </div>
            </header>

            <section class="content-section">
                <h2 id="section-title">Plant Finder</h2>
                
                <div id="plant-quiz-container">
                    <div id="quiz-content"></div>
                </div>

                <div id="search-results-list" style="display: none;"></div>
            </section>
        </div>
    `;
}