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
        temperature: Math.round(item.main.temp),
        tempMin: Math.round(item.main.temp_min),
        tempMax: Math.round(item.main.temp_max),
        humidity: item.main.humidity,
        windSpeed: item.wind.speed,
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

executePipeline("Atlanta");