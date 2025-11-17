// src/weatherService.js (Using WeatherAPI.com)

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY; 
const BASE_URL = "https://api.weatherapi.com/v1";

/**
 * Gets the current weather for a location (by city name or zip code).
 * @param {string} locationQuery - City name, zip code, or 'lat,lon'.
 * @returns {Promise<object | null>} Weather data or throws an error on API failure.
 */
export async function fetchWeather(locationQuery, unit) {
    if (!API_KEY || !locationQuery) {
        throw new Error("Weather API key or location not defined.");
    }

    const url = `${BASE_URL}/current.json?key=${API_KEY}&q=${locationQuery}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || `Weather API failed: ${response.statusText}`);
        }
        const data = await response.json();
        
        // Return structured data for home page display and validation
        return {
            city: data.location.name,
            region: data.location.region,
            country: data.location.country,
            tempC: data.current.temp_c,
            tempF: data.current.temp_f,
            icon: data.current.condition.icon
        };
    } catch (error) {
        console.error('Failed to fetch weather data:', error);
        throw error;
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