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
  metricButton: document.querySelector("#unit-metric"),
  hourlyCanvas: document.querySelector("#hourlyChart"),
  dailyCanvas: document.querySelector("#dailyChart")
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

function formatCondition(condition) {
  return condition.replace(/\b\w/g, char => char.toUpperCase());
}

function createEmptyMessage(text) {
  const message = document.createElement("p");
  message.className = "empty-state";
  message.textContent = text;
  return message;
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
  elements.condition.textContent = current.condition.replace(/\b\w/g, char => char.toUpperCase());
  elements.feelsLike.textContent = `Feels Like ${current.feelsLike}${units.temp}`;
  elements.humidityWind.textContent = `Humidity ${current.humidity}% | Wind ${current.windSpeed} ${units.speed} ${windDir}`.trim();
}

function renderCharts(model = weatherData) {
  if (!model || typeof Chart === "undefined") {
    return;
  }

  const units = getUnitSymbols();

  const upcoming = model.forecast.slice(0, 8);
  const hourlyLabels = upcoming.map(item =>
    new Date(item.timestamp * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  );
  const hourlyTemps = upcoming.map(item => item.temperature);

  const dailyMap = new Map();
  model.forecast.forEach(item => {
    const date = new Date(item.timestamp * 1000).toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { min: item.tempMin, max: item.tempMax });
    } else {
      const currDay = dailyMap.get(date);
      currDay.min = Math.min(currDay.min, item.tempMin);
      currDay.max = Math.max(currDay.max, item.tempMax);
    }
  });

  const dailyLabels = Array.from(dailyMap.keys()).slice(0, 5);
  const dailyHighs = dailyLabels.map(day => dailyMap.get(day).max);
  const dailyLows = dailyLabels.map(day => dailyMap.get(day).min);

  if (hourlyChart) {
    hourlyChart.destroy();
  }

  if (dailyChart) {
    dailyChart.destroy();
  }

  if (elements.hourlyCanvas) {
    hourlyChart = new Chart(elements.hourlyCanvas, {
      type: "line",
      data: {
        labels: hourlyLabels,
        datasets: [
          {
            label: `Temperature (${units.temp})`,
            data: hourlyTemps,
            borderColor: "#818cf8",
            backgroundColor: "rgba(129, 140, 248, 0.2)",
            borderWidth: 2,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: "#f8fafc",
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: "#f8fafc" }
          }
        },
        scales: {
          x: {
            ticks: { color: "#cbd5e1" },
            grid: { color: "rgba(148, 163, 184, 0.15)" }
          },
          y: {
            ticks: {
              color: "#cbd5e1",
              callback: value => `${value}${units.temp}`
            },
            grid: { color: "rgba(148, 163, 184, 0.15)" }
          }
        }
      }
    });
  }

  if (elements.dailyCanvas) {
    dailyChart = new Chart(elements.dailyCanvas, {
      type: "bar",
      data: {
        labels: dailyLabels,
        datasets: [
          {
            label: `High (${units.temp})`,
            data: dailyHighs,
            backgroundColor: "#818cf8",
            borderRadius: 6
          },
          {
            label: `Low (${units.temp})`,
            data: dailyLows,
            backgroundColor: "#475569",
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: "#f8fafc" }
          }
        },
        scales: {
          x: {
            ticks: { color: "#cbd5e1" },
            grid: { display: false }
          },
          y: {
            ticks: {
              color: "#cbd5e1",
              callback: value => `${value}${units.temp}`
            },
            grid: { color: "rgba(148, 163, 184, 0.15)" }
          }
        }
      }
    });
  }
}
async function executePipeline(city) {
  elements.status.textContent = `Loading forecast for ${city}…`;
  elements.cityError.textContent = "";

  try {
    weatherData = await fetchWeather(city);
    renderSelectedCity(weatherData);
    renderForecastCards(weatherData.forecast);
    renderCharts(weatherData);
    elements.status.textContent = `Showing forecast for ${weatherData.city}, ${weatherData.country}.`;
  } catch (error) {
    elements.status.textContent = error.message;
    elements.resultsCount.textContent = "0 forecast intervals";
  }
}

elements.cityForm.addEventListener("submit", event => {
  event.preventDefault();
  const query = elements.cityInput.value.trim();
  if (!query) {
    elements.cityError.textContent = "Please enter a city name.";
    elements.cityInput.focus();
    return;
  }
  executePipeline(query);
});

function updateUnitButtons() {
  const imperial = selectedUnit === "imperial";
  elements.imperialButton.classList.toggle("active", imperial);
  elements.metricButton.classList.toggle("active", !imperial);
  elements.imperialButton.setAttribute("aria-pressed", String(imperial));
  elements.metricButton.setAttribute("aria-pressed", String(!imperial));
  document.querySelectorAll(".unit-label").forEach(label => {
    label.textContent = getUnitSymbols().symbol;
  });
}

elements.imperialButton.addEventListener("click", async () => {
  if (selectedUnit === "imperial"){
     return;
  }
  selectedUnit = "imperial";
  updateUnitButtons();
  if (weatherData) await executePipeline(weatherData.city);
});

elements.metricButton.addEventListener("click", async() => {
  if (selectedUnit === "metric"){
    return;
  } 
  selectedUnit = "metric";
  updateUnitButtons();
  if (weatherData){
    await executePipeline(weatherData.city);
  } 
});

function renderForecastCards(forecastItems = weatherData ? weatherData.forecast : []) {
  if (!weatherData) {
    elements.forecastList.replaceChildren(createEmptyMessage("Your forecast cards will load here."));
    elements.resultsCount.textContent = "Forecast entries will appear here.";
    return;
  }

  const units = getUnitSymbols();
  const fragment = document.createDocumentFragment();

  if (forecastItems.length === 0) {
    fragment.append(createEmptyMessage("No forecast intervals available."));
  } else {
    forecastItems.forEach(item => {
      const card = document.createElement("article");
      card.className = "forecast-card";

      const time = document.createElement("p");
      time.className = "forecast-date";
      time.textContent = item.formattedTime;

      const icon = document.createElement("img");
      icon.src = `https://openweathermap.org/img/wn/${item.iconCode}@2x.png`;
      icon.alt = item.condition;
      icon.width = 64;
      icon.height = 64;

      const temp = document.createElement("p");
      temp.className = "forecast-card-temp";
      temp.textContent = `${item.temperature}${units.temp}`;

      const condition = document.createElement("p");
      condition.className = "forecast-condition";
      condition.textContent = formatCondition(item.condition);

      const meta = document.createElement("p");
      meta.className = "forecast-meta";
      meta.textContent = `Low ${item.tempMin}${units.temp} · High ${item.tempMax}${units.temp} · Humidity ${item.humidity}%`;

      card.append(time, icon, temp, condition, meta);
      fragment.append(card);
    });
  }

  elements.forecastList.replaceChildren(fragment);
  elements.resultsCount.textContent = `Showing ${forecastItems.length} of ${weatherData.forecast.length} forecast intervals`;
}

function validateFilters() {
  let isValid = true;

  const conditionText = elements.conditionFilter.value.trim();
  const minText = elements.minTemp.value.trim();
  const maxText = elements.maxTemp.value.trim();

  if (conditionText.length > 40) {
    elements.conditionError.textContent = "Condition filter must be 40 characters or fewer.";
    isValid = false;
  }

  const minNum = minText === "" ? null : Number(minText);
  const maxNum = maxText === "" ? null : Number(maxText);

  if (minText !== "" && Number.isNaN(minNum)) {
    elements.minError.textContent = "Enter a valid minimum temperature.";
    isValid = false;
  }

  if (maxText !== "" && Number.isNaN(maxNum)) {
    elements.maxError.textContent = "Enter a valid maximum temperature.";
    isValid = false;
  }

  if (isValid && minNum !== null && maxNum !== null && minNum > maxNum) {
    elements.maxError.textContent = "Maximum temperature must be at least the minimum temperature.";
    isValid = false;
  }

  return isValid;
}

function sortForecasts(items = weatherData ? weatherData.forecast : []) {
  if (!weatherData){
    return;
  }

  const sortMode = elements.sortOrder.value;
  return [...items].sort((a, b) => {
    if (sortMode === "temp-asc") {
      return a.temperature - b.temperature;
    }
    if (sortMode === "temp-desc") {
      return b.temperature - a.temperature;
    }
    return a.timestamp - b.timestamp;
  });

  return;
}

function filterForecasts(){
  if (!weatherData){
    return;
  }

  const conditionQuery = elements.conditionFilter.value.trim().toLowerCase();
  const minText = elements.minTemp.value.trim();
  const maxText = elements.maxTemp.value.trim();
  const minNum = minText === "" ? null : Number(minText);
  const maxNum = maxText === "" ? null : Number(maxText);

  const filtered = weatherData.forecast.filter(item => {
    const matchesCondition = !conditionQuery || item.condition.toLowerCase().includes(conditionQuery);
    const matchesMin = minNum === null || Number.isNaN(minNum) || item.temperature >= minNum;
    const matchesMax = maxNum === null || Number.isNaN(maxNum) || item.temperature <= maxNum;
    return matchesCondition && matchesMin && matchesMax;
  });

  return filtered;

}

function applyFiltersAndSort(){
  if (!weatherData) {
    renderForecastCards([]);
    return;
  }

  const filtered = filterForecasts();
  const sorted = sortForecasts(filtered);
  renderForecastCards(sorted);
}

elements.filterForm.addEventListener("submit", event => {
  event.preventDefault();
  if (!validateFilters()) {
    return;
  }

  elements.minError.textContent = "";
  elements.maxError.textContent = "";
  elements.conditionError.textContent = "";

  applyFiltersAndSort();
});

elements.clearFilters.addEventListener("click", () => {
  elements.filterForm.reset();
  applyFiltersAndSort();
});

elements.sortOrder.addEventListener("change", () => {
  applyFiltersAndSort();
});

executePipeline("Seattle");