// =====================================
// API CONFIGURATION
// =====================================

const BASE_URL = "http://localhost:8080/api/weather";

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");

const loading = document.getElementById("loading");
const errorDiv = document.getElementById("error");

const weatherContent = document.getElementById("weatherContent");
const welcome = document.getElementById("welcome");

const forecastDiv = document.getElementById("forecast");

// =====================================
// EVENT LISTENERS
// =====================================

searchBtn.addEventListener("click", getWeather);

cityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    getWeather();
  }
});

// =====================================
// GET WEATHER
// =====================================

async function getWeather() {
  const city = cityInput.value.trim();

  if (!city) {
    showError("Please enter a city name.");
    cityInput.focus();
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(
      `${BASE_URL}/full?city=${encodeURIComponent(city)}`,
    );

    if (!response.ok) {
      throw new Error(
        response.status === 404
          ? "City not found. Please try another city."
          : "Unable to fetch weather information.",
      );
    }

    const data = await response.json();

    if (
      !data.current?.main ||
      !data.current?.weather?.length ||
      !Array.isArray(data.forecast?.list)
    ) {
      throw new Error("Invalid weather data received.");
    }

    // Display current weather
    displayCurrent(data.current, city);

    // Get one forecast entry per day
    const dailyForecast = getDailyForecast(data.forecast.list);

    if (dailyForecast.length === 0) {
      throw new Error("Forecast information is unavailable.");
    }

    displayForecast(dailyForecast);

    weatherContent.classList.remove("hidden");
    welcome.classList.add("hidden");
  } catch (error) {
    console.error("Weather Error:", error);

    showError(error.message || "Something went wrong.");
  } finally {
    setLoading(false);
  }
}

// =====================================
// LOADING STATE
// =====================================

function setLoading(isLoading) {
  loading.classList.toggle("hidden", !isLoading);

  searchBtn.disabled = isLoading;

  searchBtn.textContent = isLoading ? "Loading..." : "Search";

  if (isLoading) {
    errorDiv.classList.add("hidden");
    weatherContent.classList.add("hidden");
    welcome.classList.add("hidden");
  }
}

// =====================================
// ERROR HANDLING
// =====================================

function showError(message) {
  errorDiv.textContent = message;
  errorDiv.classList.remove("hidden");
}

// =====================================
// FORMAT TEMPERATURE
// =====================================

function formatTemp(temp) {
  return `${Math.round(temp)}°C`;
}

// =====================================
// WEATHER ICON
// =====================================

function getWeatherIcon(icon) {
  return `https://openweathermap.org/img/wn/${encodeURIComponent(icon)}@2x.png`;
}

// =====================================
// DISPLAY CURRENT WEATHER
// =====================================

function displayCurrent(current, city) {
  const weather = current.weather[0];

  document.getElementById("cityName").textContent = city.toUpperCase();

  document.getElementById("currentDate").textContent =
    new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  document.getElementById("currentIcon").src = getWeatherIcon(weather.icon);

  document.getElementById("temperature").textContent = formatTemp(
    current.main.temp,
  );

  document.getElementById("weatherDescription").textContent =
    weather.description;

  document.getElementById("feelsLike").textContent =
    `Feels like ${formatTemp(current.main.feels_like)}`;

  document.getElementById("humidity").textContent = `${current.main.humidity}%`;

  document.getElementById("windSpeed").textContent =
    `${current.wind?.speed ?? "N/A"} m/s`;

  document.getElementById("minMax").textContent =
    `${Math.round(current.main.temp_min)}° / ${Math.round(current.main.temp_max)}°C`;
}

// =====================================
// GET DAILY FORECAST
// =====================================

function getDailyForecast(list) {
  const dailyData = {};

  list.forEach((item) => {
    if (!item.dt_txt || !item.main || !item.weather?.length) {
      return;
    }

    const [date, time] = item.dt_txt.split(" ");

    const hour = Number(time.split(":")[0]);

    // Find the forecast closest to 12 PM
    const difference = Math.abs(hour - 12);

    if (!dailyData[date] || difference < dailyData[date].difference) {
      dailyData[date] = {
        item,
        difference,
      };
    }
  });

  return Object.values(dailyData)
    .slice(0, 5)
    .map((data) => data.item);
}

// =====================================
// DISPLAY FORECAST
// =====================================

function displayForecast(list) {
  forecastDiv.innerHTML = "";

  list.forEach((item) => {
    const weather = item.weather[0];

    const date = new Date(item.dt * 1000);

    const formattedDate = date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

    const card = document.createElement("div");

    card.className = "forecast-card";

    const icon = document.createElement("img");
    icon.src = getWeatherIcon(weather.icon);
    icon.alt = weather.description;

    const day = document.createElement("h4");
    day.textContent = formattedDate;

    const temperature = document.createElement("p");
    temperature.className = "forecast-temp";
    temperature.textContent = formatTemp(item.main.temp);

    const description = document.createElement("p");
    description.className = "description";
    description.textContent = weather.description;

    card.append(day, icon, temperature, description);

    forecastDiv.appendChild(card);
  });
}
