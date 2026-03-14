import { clampNumber } from "../utils/sanitize";

/**
 * Weather Service: Dengue prediction ke liye sahi environmental markers fetch karta hai.
 * Hum 'precipitation_sum' ka use karte hain kyunki dengue risk ke liye 
 * pichle 24 ghante ki baarish zyada matter karti hai.
 */
export const fetchCurrentWeather = async (latitude, longitude) => {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("Invalid GPS coordinates for weather sync.");
  }

  // Timeout logic: 8 seconds se zyada wait nahi karenge
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    // Note: Dengue models usually need 24h precipitation sum or current relative humidity
    const endpoint = 
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation` +
      `&daily=precipitation_sum&timezone=auto&forecast_days=1`;

    const response = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Weather server error: ${response.status}`);
    }

    const data = await response.json();
    
    // Safety Check: Agar API empty response de
    if (!data.current) {
      throw new Error("Weather data not found for this location.");
    }

    const { current, daily } = data;

    return {
      // Temperature: Mosquito activity 15°C - 40°C ke beech peak karti hai
      temperature: clampNumber(current.temperature_2m, -10, 55, 28),
      
      // Humidity: High humidity (>60%) mosquito survival badha deti hai
      humidity: clampNumber(current.relative_humidity_2m, 0, 100, 65),
      
      // Rainfall: Current precipitation ya Daily sum (dono ka max le rahe hain safety ke liye)
      rainfall: clampNumber(
        daily?.precipitation_sum?.[0] || current.precipitation || 0, 
        0, 1000, 0
      ),
      
      timestamp: new Date().toISOString(),
      source: "open-meteo-v2"
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error("Weather request timed out. Check connection.");
    }
    
    console.error("Weather Service Error:", error.message);
    throw error;
  }
};