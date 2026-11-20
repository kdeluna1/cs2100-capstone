const API_KEY = "53632f7030cac32ed1df9f8a19010344";
const BASE_URL = "https://api.openweathermap.org/data/2.5/forecast";

class WeatherDataModel {
  constructor(rawApiResponse) {
    this.city = rawApiResponse.city.name;
    this.country = rawApiResponse.city.country;
    this.forecast = this.cleanForecastList(rawApiResponse.list);
  }

  cleanForecastList(listArray) {
    return listArray.map(item => {
      return {
        timestamp: item.dt,
        formattedTime: new Date(item.dt * 1000).toLocaleString(),
        feelsLike: Math.round(item.main.feels_like),
        temperature: Math.round(item.main.temp),
        tempMin: Math.round(item.main.temp_min),
        tempMax: Math.round(item.main.temp_max),
        humidity: item.main.humidity,
        windSpeed: Math.round(item.wind.speed),
        windDeg: item.wind.deg,
        condition: item.weather[0].description,
        iconCode: item.weather[0].icon
      };
    });
  }
}

const elements = {
  cityForm: document.querySelector("#city-form"),
  cityInput: document.querySelector("#city-input"),
  cityError: document.querySelector("#city-error"),
  status: document.querySelector("#status-message"),
  cityName: document.querySelector("#detail-city-name"),
  temperature: document.querySelector("#detail-temp"),
  condition: document.querySelector("#detail-condition"),
  feelsLike: document.querySelector("#detail-feels-like"),
  humidityWind: document.querySelector("#detail-humidity-wind"),
  forecastList: document.querySelector("#forecast-list"),
  resultsCount: document.querySelector("#results-count"),
  filterForm: document.querySelector("#filter-form"),
  conditionFilter: document.querySelector("#condition-filter"),
  conditionError: document.querySelector("#condition-error"),
  minTemp: document.querySelector("#min-temp"),
  minError: document.querySelector("#min-error"),
  maxTemp: document.querySelector("#max-temp"),
  maxError: document.querySelector("#max-error"),
  sortOrder: document.querySelector("#sort-order"),
  clearFilters: document.querySelector("#clear-filters"),
  saveButton: document.querySelector("#save-button"),
  imperialButton: document.querySelector("#unit-imperial"),
  metricButton: document.querySelector("#unit-metric")
};

let weatherData = null;
let selectedUnit = "imperial";
let hourlyChart = null;
let dailyChart = null;
let savedCities = JSON.parse(localStorage.getItem("horizonSavedCities") || "[]");

function getUnitSymbols() {
  return selectedUnit === "imperial"
    ? { temp: "°F", speed: "mph" }
    : { temp: "°C", speed: "m/s" };
}

function getWindDirection(deg) {
  if (deg === undefined || deg === null)
    {
      return "";
    } 
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(deg / 45) % 8];
}

async function fetchWeather(city) {
  const url = `${BASE_URL}?q=${encodeURIComponent(city)}&units=${selectedUnit}&appid=${API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`City "${city}" not found. Check the spelling and try again.`);
    }
    throw new Error(`Unable to fetch weather data (Status: ${response.status}).`);
  }

  const rawData = await response.json();
  return new WeatherDataModel(rawData);
}

function renderSelectedCity(model) {
  const current = model.forecast[0];
  const units = getUnitSymbols();
  const windDir = getWindDirection(current.windDeg);

  elements.cityName.textContent = `${model.city.toUpperCase()}, ${model.country.toUpperCase()}`;
  elements.temperature.textContent = `${current.temperature}${units.temp}`;
  elements.condition.textContent = current.condition;
  elements.feelsLike.textContent = `Feels Like ${current.feelsLike}${units.temp}`;
  elements.humidityWind.textContent = `Humidity ${current.humidity}% | Wind ${current.windSpeed} ${units.speed} ${windDir}`.trim();
}

async function executePipeline(city) {
  elements.status.textContent = `Loading forecast for ${city}…`;
  elements.cityError.textContent = "";

  try {
    weatherData = await fetchWeather(city);
    renderSelectedCity(weatherData);
    elements.status.textContent = `Showing forecast for ${weatherData.city}, ${weatherData.country}.`;
  } catch (error) {
    elements.status.textContent = error.message;
  }
}

executePipeline("Anchorage");