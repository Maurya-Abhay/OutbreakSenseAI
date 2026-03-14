import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

const OPEN_WEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const OPEN_WEATHER_ENDPOINT = "https://api.openweathermap.org/data/2.5/weather";
const OPEN_METEO_ENDPOINT = "https://api.open-meteo.com/v1/forecast";

const weatherSchema = z.object({
  main: z.object({
    temp: z.coerce.number(),
    humidity: z.coerce.number()
  }),
  rain: z
    .object({
      "1h": z.coerce.number().optional(),
      "3h": z.coerce.number().optional()
    })
    .optional()
});

const openMeteoSchema = z.object({
  current: z.object({
    temperature_2m: z.coerce.number(),
    relative_humidity_2m: z.coerce.number(),
    precipitation: z.coerce.number().optional()
  })
});

const getRainfall = (rain) => {
  if (!rain) return 0;
  if (typeof rain["1h"] === "number") return rain["1h"];
  if (typeof rain["3h"] === "number") return rain["3h"] / 3;
  return 0;
};

const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000
    });
  });

export const useGeolocation = () => {
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [fetchingWeather, setFetchingWeather] = useState(false);
  const weatherDebounceRef = useRef(null);

  useEffect(() => {
    return () => {
      if (weatherDebounceRef.current) {
        clearTimeout(weatherDebounceRef.current);
      }
    };
  }, []);

  const fetchWeather = useCallback(async (latitude, longitude) => {
    setFetchingWeather(true);

    try {
      if (OPEN_WEATHER_API_KEY) {
        const response = await fetch(
          `${OPEN_WEATHER_ENDPOINT}?lat=${latitude}&lon=${longitude}&units=metric&appid=${OPEN_WEATHER_API_KEY}`
        );

        if (response.ok) {
          const parsed = weatherSchema.parse(await response.json());
          return {
            temperature: Number(parsed.main.temp.toFixed(1)),
            humidity: Math.round(parsed.main.humidity),
            rainfall: Number(getRainfall(parsed.rain).toFixed(1))
          };
        }
      }

      // Fallback keeps weather autofill usable in demo environments without an API key.
      const fallbackResponse = await fetch(
        `${OPEN_METEO_ENDPOINT}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation`
      );

      if (!fallbackResponse.ok) {
        throw new Error("Unable to fetch weather data.");
      }

      const fallbackParsed = openMeteoSchema.parse(await fallbackResponse.json());
      return {
        temperature: Number(fallbackParsed.current.temperature_2m.toFixed(1)),
        humidity: Math.round(fallbackParsed.current.relative_humidity_2m),
        rainfall: Number((fallbackParsed.current.precipitation || 0).toFixed(1))
      };
    } finally {
      setFetchingWeather(false);
    }
  }, []);

  const detectLocationWithWeather = useCallback(async () => {
    setDetectingLocation(true);

    try {
      const position = await getCurrentPosition();
      const latitude = Number(position.coords.latitude.toFixed(6));
      const longitude = Number(position.coords.longitude.toFixed(6));
      const weather = await fetchWeather(latitude, longitude);

      return {
        latitude,
        longitude,
        weather
      };
    } finally {
      setDetectingLocation(false);
    }
  }, [fetchWeather]);

  const scheduleWeatherFetch = useCallback(
    (latitude, longitude, onWeather) => {
      if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
        return;
      }

      if (weatherDebounceRef.current) {
        clearTimeout(weatherDebounceRef.current);
      }

      weatherDebounceRef.current = setTimeout(async () => {
        try {
          const weather = await fetchWeather(latitude, longitude);
          onWeather(weather);
        } catch {
          // Ignore passive weather fetch failures; manual detect still reports explicit errors.
        }
      }, 650);
    },
    [fetchWeather]
  );

  return {
    detectingLocation,
    fetchingWeather,
    detectLocationWithWeather,
    scheduleWeatherFetch,
    fetchWeather
  };
};
