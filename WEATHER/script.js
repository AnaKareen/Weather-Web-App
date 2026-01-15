const API_KEY = "YHS5JDBZE5HTB82J8PJDJ2F2Z";

const input = document.getElementById("locationInput");
const searchBtn = document.getElementById("searchBtn");
const refreshBtn = document.getElementById("refreshBtn");
const weatherDiv = document.getElementById("weather");
const hoursDiv = document.getElementById("hours");
const loader = document.getElementById("loader");
const error = document.getElementById("error");
const outlookTitle = document.getElementById("outlookTitle");

let currentLocation = "";

searchBtn.addEventListener("click", () => {
  if (input.value.trim()) getWeather(input.value);
});

refreshBtn.addEventListener("click", () => {
  if (currentLocation) getWeather(currentLocation);
});

async function getWeather(location) {
  try {
    loader.classList.remove("hidden");
    weatherDiv.classList.add("hidden");
    outlookTitle.classList.add("hidden");
    error.textContent = "";

    currentLocation = location;

    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}?unitGroup=metric&key=${API_KEY}&contentType=json`;
    const res = await fetch(url);

    if (!res.ok) throw new Error("Location not found");

    const data = await res.json();
    renderWeather(data);
  } catch (err) {
    error.textContent = "Could not fetch weather. Try another city.";
  } finally {
    loader.classList.add("hidden");
  }
}

function renderWeather(data) {
  const current = data.currentConditions;

  weatherDiv.innerHTML = `
    <h2>${data.resolvedAddress}</h2>
    <div class="temp">${Math.round(current.temp)}°C</div>
    <p>${current.conditions}</p>

    <div class="details">
      <div>💨 ${current.windspeed} km/h</div>
      <div>🌧 ${current.precipprob}%</div>
    </div>
  `;

  weatherDiv.classList.remove("hidden");
  outlookTitle.classList.remove("hidden");

  hoursDiv.innerHTML = "";
  data.days[0].hours.forEach(h => {
    const card = document.createElement("div");
    card.className = "hour-card";
    card.innerHTML = `
      <strong>${h.datetime.slice(0,5)}</strong>
      <p>${Math.round(h.temp)}°</p>
      <small>${h.conditions}</small>
    `;
    hoursDiv.appendChild(card);
  });
}

// Default: ubicación actual
navigator.geolocation.getCurrentPosition(pos => {
  const coords = `${pos.coords.latitude},${pos.coords.longitude}`;
  getWeather(coords);
});
