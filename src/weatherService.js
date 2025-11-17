// src/weatherService.js

// NOTE: Replace YOUR_API_KEY with your actual OpenWeatherMap key in the .env file!
const API_KEY = import.meta.env.VITE_WEATHER_API_KEY; 

/**
 * Gets the current weather for a location (by city name or zip code).
 * @param {string} location - City name or zip code.
 */
export async function fetchWeather(location) {
    if (!API_KEY) {
        console.error("Weather API key not defined. Cannot fetch weather.");
        return null;
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}&units=metric`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Weather API failed: ${response.statusText}`);
        }
        const data = await response.json();
        
        // Return structured data relevant to your app (e.g., temp and condition)
        return {
            temperature: data.main.temp,
            condition: data.weather[0].main,
            city: data.name
        };
    } catch (error) {
        console.error('Failed to fetch weather data:', error);
        return null;
    }
}

/**
 * Asks the user for their current browser location using the Geolocation API.
 * @returns {Promise<object>} Returns latitude and longitude.
 */
export function getCurrentBrowserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            return reject(new Error('Geolocation not supported by this browser.'));
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                });
            },
            (error) => {
                reject(new Error(`Geolocation error: ${error.message}`));
            }
        );
    });
}