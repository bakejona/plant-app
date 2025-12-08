// src/homePage.js

export function renderHomePage(container, profile, weatherData) {
    let tempDisplay = '--°';
    let iconHTML = '<i class="fa-solid fa-house"></i>';

    if (weatherData) {
        const tempUnit = profile.temperatureUnit || 'C';
        const tempValue = tempUnit === 'F' ? weatherData.tempF : weatherData.tempC;
        tempDisplay = `${Math.round(tempValue)}°${tempUnit}`;
        if (weatherData.icon) {
             iconHTML = `<img src="https:${weatherData.icon}" alt="Weather Icon" style="width: 40px; height: 40px;">`;
        }
    }

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
                <h2>Your Tasks</h2>
                <div style="background-color: #333; padding: 20px; border-radius: 12px; margin-top: 10px; text-align: center;">
                    <p style="color: #aaa; margin-bottom: 15px;">Your plants are happy for now!</p>
                    <p style="font-size: 0.9em;">(Task logic coming soon)</p>
                </div>
            </section>

            <a href="#search" class="floating-add-btn">
                <i class="fa-solid fa-plus"></i>
            </a>
        </div>
    `;
}