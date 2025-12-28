const API_KEY = "0013083950038c5feaa284246df7939f";

const WEATHER_API = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_API = "https://api.openweathermap.org/data/2.5/forecast";
const AQI_API = "https://api.openweathermap.org/data/2.5/air_pollution";

/* ===== DOM ===== */
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");

const cityNameEl = document.getElementById("city-name");
const countryNameEl = document.getElementById("country-name");

const tempEl = document.getElementById("current-temp");
const feelsEl = document.getElementById("feels-like");
const descEl = document.getElementById("weather-description");
const iconEl = document.getElementById("weather-icon");

const hourlyContainer = document.getElementById("hourly-container");

const tomorrowTempEl = document.getElementById("tomorrow-temp");
const tomorrowDescEl = document.getElementById("tomorrow-desc");
const tomorrowRainEl = document.getElementById("tomorrow-rain");

const windSpeedEl = document.getElementById("wind-speed");
const windDirEl = document.getElementById("wind-direction");
const rainfallEl = document.getElementById("rainfall");
const pressureEl = document.getElementById("pressure");
const visibilityEl = document.getElementById("visibility");

const aqiValueEl = document.getElementById("aqi-value");
const aqiFillEl = document.getElementById("aqi-fill");
const tempMapEl = document.getElementById("temp-map");

const settingsBtn = document.getElementById("settings-btn");

/* ===== UTIL ===== */
function toF(c) {
  return Math.round(c * 9 / 5 + 32);
}

function emoji(main) {
  return {
    Clear: "☀️",
    Clouds: "☁️",
    Rain: "🌧",
    Drizzle: "🌦",
    Thunderstorm: "⛈",
    Snow: "❄️",
    Mist: "🌫"
  }[main] || "⛅";
}

/* ===== THEME ===== */
function setTheme(theme) {
  document.body.className = theme;
  localStorage.setItem("theme", theme);
}

settingsBtn.addEventListener("click", () => {
  const current = document.body.classList.contains("dark") ? "dark" : "light";
  setTheme(current === "dark" ? "light" : "dark");
});

setTheme(localStorage.getItem("theme") || "dark");

/* ===== SEARCH ===== */
function handleSearch() {
  const city = cityInput.value.trim();
  if (city) loadWeather(city);
}

searchBtn.addEventListener("click", handleSearch);
cityInput.addEventListener("keydown", e => {
  if (e.key === "Enter") handleSearch();
});

/* ===== WEATHER ===== */
async function loadWeather(city) {
  try {
    const res = await fetch(
      `${WEATHER_API}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );
    if (!res.ok) throw new Error();

    const w = await res.json();

    const c = Math.round(w.main.temp);
    const f = toF(c);
    const fc = Math.round(w.main.feels_like);
    const ff = toF(fc);

    cityNameEl.textContent = w.name;
    countryNameEl.textContent = w.sys.country;

    tempEl.textContent = `${c}°C / ${f}°F`;
    feelsEl.textContent = `${fc}°C / ${ff}°F`;
    descEl.textContent = w.weather[0].description;
    iconEl.textContent = emoji(w.weather[0].main);

    windSpeedEl.textContent = Math.round(w.wind.speed * 3.6);
    windDirEl.textContent = w.wind.deg + "°";
    pressureEl.textContent = w.main.pressure;
    visibilityEl.textContent = (w.visibility / 1000).toFixed(1);
    rainfallEl.textContent = w.rain?.["1h"] || 0;

    tempMapEl.textContent = `${c}°C / ${f}°F`;

    loadHourly(city);
    loadTomorrow(city);
    loadAQI(w.coord.lat, w.coord.lon);

  } catch {
    alert("City not found or API error");
  }
}

/* ===== HOURLY ===== */
async function loadHourly(city) {
  const res = await fetch(
    `${FORECAST_API}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
  );
  if (!res.ok) return;

  const data = await res.json();
  hourlyContainer.innerHTML = "";

  data.list.slice(0, 6).forEach(item => {
    const c = Math.round(item.main.temp);
    const f = toF(c);
    const hour = new Date(item.dt * 1000).getHours();

    const div = document.createElement("div");
    div.className = "highlight-card";
    div.innerHTML = `
      <h3>${hour}:00</h3>
      <p>${emoji(item.weather[0].main)}</p>
      <p>${c}°C / ${f}°F</p>
    `;
    hourlyContainer.appendChild(div);
  });
}

/* ===== TOMORROW ===== */
async function loadTomorrow(city) {
  const res = await fetch(
    `${FORECAST_API}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
  );
  if (!res.ok) return;

  const data = await res.json();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const day = tomorrow.getDate();

  const list = data.list.filter(
    i => new Date(i.dt * 1000).getDate() === day
  );
  if (!list.length) return;

  const avgC = Math.round(
    list.reduce((s, i) => s + i.main.temp, 0) / list.length
  );
  const avgF = toF(avgC);
  const rain = list.reduce(
    (s, i) => s + (i.rain?.["3h"] || 0),
    0
  );

  tomorrowTempEl.textContent = `${avgC}°C / ${avgF}°F`;
  tomorrowDescEl.textContent = list[0].weather[0].description;
  tomorrowRainEl.textContent = `Rain: ${rain.toFixed(1)} mm`;
}

/* ===== AQI ===== */
async function loadAQI(lat, lon) {
  const res = await fetch(
    `${AQI_API}?lat=${lat}&lon=${lon}&appid=${API_KEY}`
  );
  if (!res.ok) return;

  const aqi = (await res.json()).list[0].main.aqi;
  aqiValueEl.textContent = ["Good","Fair","Moderate","Poor","Very Poor"][aqi - 1];
  aqiFillEl.style.width = `${aqi * 20}%`;
}

/* ===== DEFAULT ===== */
loadWeather("Kolkata");
