document.addEventListener("DOMContentLoaded", () => {
  showLoadingScreen();
});

let unit = "metric";
let currCity = null;
let currLat = null;
let currLon = null;
let weatherData = null;
const today = new Date();

const selectDay = document.querySelector("#day");
const searchPlace = document.querySelector("#place");
const lists = document.querySelector(".lists");
const button = document.querySelector(".btn");
const select = document.querySelector("#unit");
const container = document.querySelector(".container");
const loading = document.querySelector(".loading-screen");
const text = document.querySelectorAll(".txt");

function showLoadingScreen() {
  loading.classList.remove("hidden");
  text.forEach((t) => {
    t.textContent = "-";
  });
  document.querySelector("#temp").textContent = "";
  document.querySelector(".temperature img").src = "";
  document.querySelectorAll(".weekday").forEach((el) => (el.textContent = ""));
  document
    .querySelectorAll(".daily-max")
    .forEach((el) => (el.textContent = ""));
  document
    .querySelectorAll(".daily-min")
    .forEach((el) => (el.textContent = ""));
  document.querySelectorAll(".day p img").forEach((img) => (img.src = ""));
  document
    .querySelectorAll(".time-hour")
    .forEach((el) => (el.textContent = "--"));
  document
    .querySelectorAll(".hourly-temp")
    .forEach((el) => (el.textContent = "--"));
  document.querySelectorAll(".hour p img").forEach((img) => (img.src = ""));
}

function hideLoadingScreen() {
  loading.classList.add("hidden");
  document.body.classList.add("loaded");
}

function staggerFade(elements, delay = 60) {
  elements.forEach((el, i) => {
    setTimeout(() => el.classList.add("visible"), i * delay);
  });
}

function pop(el) {
  if (!el) return;
  el.classList.add("pop");
  setTimeout(() => el.classList.remove("pop"), 180);
}

function populateDays() {
  selectDay.innerHTML = "";
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);
    const option = document.createElement("option");
    option.value = i;
    option.textContent = date.toLocaleDateString("en-US", { weekday: "long" });
    if (i === 0) option.selected = true;
    selectDay.appendChild(option);
  }
}

populateDays();

selectDay.addEventListener("change", () => {
  const dayIndex = parseInt(selectDay.value);
  if (!weatherData) return;
  addHourlyDetails(weatherData, dayIndex);
});

select.addEventListener("change", async (e) => {
  unit = e.target.value;
  if (currLat && currLon) {
    weatherData = await fetchData(currLat, currLon);
    addTodayDetails(weatherData, currCity);
    addHourlyDetails(weatherData, 0);
    addDailyDetails(weatherData);
  }
});

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function normalize(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const debouncedAddLists = debounce(addLists, 850);

searchPlace.addEventListener("input", () => {
  debouncedAddLists();
  setImage();
});

async function addLists() {
  const query = searchPlace.value.trim();
  lists.classList.toggle("show", query !== "");
  if (query !== "") {
    const cities = await fetchCities(query);
    if (!cities || !cities.results || cities.results.length === 0) {
      lists.innerHTML = "<li>No results found</li>";
      return;
    }
    let items = "";
    let city = [];
    for (let i = 0; i < cities.results.length; i++) {
      const originalName = cities.results[i].name;
      const normalizedName = normalize(originalName);
      if (!city.includes(normalizedName)) {
        city.push(normalizedName);
        items += `<li>${originalName}</li>`;
      }
    }
    lists.innerHTML = items;
  } else {
    lists.innerHTML = "";
  }
}

function setImage() {
  const query = searchPlace.value.trim();
  if (query !== "") {
    searchPlace.style.backgroundImage = "none";
    searchPlace.style.paddingLeft = "1rem";
  } else {
    searchPlace.style.backgroundImage = "url(../assets/images/icon-search.svg)";
    searchPlace.style.paddingLeft = "2.5rem";
  }
}

const fetchCities = async (place) => {
  try {
    const URL = `https://geocoding-api.open-meteo.com/v1/search?name=${place}&count=10&language=en&format=json`;
    const res = await fetch(URL);
    if (!res.ok) throw new Error("Invalid response!");
    const data = await res.json();
    if (!data) throw new Error("Failed to retrieve data!");
    return data;
  } catch (err) {
    errorHandler(err.message);
  }
};

const fetchData = async (lat, lon) => {
  try {
    let URL = "";
    if (unit === "metric") {
      URL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code&current=temperature_2m,precipitation,weather_code,wind_speed_10m,relative_humidity_2m,apparent_temperature&timezone=auto`;
    } else {
      URL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code&current=temperature_2m,precipitation,weather_code,wind_speed_10m,relative_humidity_2m,apparent_temperature&timezone=auto&wind_speed_unit=mph&temperature_unit=fahrenheit&precipitation_unit=inch`;
    }
    const res = await fetch(URL);
    if (!res.ok) throw new Error("Invalid response!");
    const data = await res.json();
    if (!data) throw new Error("Failed to retrieve data!");
    return data;
  } catch (err) {
    errorHandler(err.message);
  }
};

const addTodayDetails = (data, city) => {
  const address = document.querySelector(".address");
  const date = document.querySelector(".date");
  const tempEl = document.querySelector("#temp");
  const feelsLike = document.querySelector("#feels-like-text");
  const humidity = document.querySelector("#humidity-text");
  const wind = document.querySelector("#wind-text");
  const precipitation = document.querySelector("#precipitation-text");

  address.textContent = city;
  const options = {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  date.textContent = today.toLocaleDateString("en-US", options);

  tempEl.textContent = `${data.current.temperature_2m}${data.current_units.temperature_2m}`;
  feelsLike.textContent = `${data.current.apparent_temperature}${data.current_units.apparent_temperature}`;
  humidity.textContent = `${data.current.relative_humidity_2m}${data.current_units.relative_humidity_2m}`;
  wind.textContent = `${data.current.wind_speed_10m} ${data.current_units.wind_speed_10m}`;
  precipitation.textContent = `${data.current.precipitation} ${data.current_units.precipitation}`;

  const icon = getWeatherIcon(data.current.weather_code);
  document.querySelector(
    ".temperature img"
  ).src = `../assets/images/icon-${icon}.webp`;

  document.querySelector(".actual-info").classList.add("visible");
  staggerFade(document.querySelectorAll(".sub-info .box"), 80);
  pop(tempEl);
  pop(feelsLike);
  pop(humidity);
  pop(wind);
  pop(precipitation);
};

const addDailyDetails = (data) => {
  const week = document.querySelectorAll(".weekday");
  const images = document.querySelectorAll(".day p img");
  const min = document.querySelectorAll(".daily-min");
  const max = document.querySelectorAll(".daily-max");

  for (let i = 0; i < week.length; i++) {
    const dateObj = new Date(data.daily.time[i]);
    week[i].textContent = dateObj.toLocaleDateString("en-US", {
      weekday: "short",
    });
    const icon = getWeatherIcon(data.daily.weather_code[i]);
    images[i].src = `../assets/images/icon-${icon}.webp`;
    min[i].textContent = data.daily.temperature_2m_min[i];
    max[i].textContent = data.daily.temperature_2m_max[i];
    pop(min[i]);
    pop(max[i]);
  }

  staggerFade(document.querySelectorAll(".daily-forecast .day"), 50);
};

const addHourlyDetails = (data, dayIndex = 0) => {
  const hours = document.querySelectorAll(".time-hour");
  const images = document.querySelectorAll(".hour p img");
  const temps = document.querySelectorAll(".hourly-temp");
  const startIndex = dayIndex * 24;

  for (let i = 0; i < hours.length; i++) {
    const idx = startIndex + i;
    if (idx >= data.hourly.time.length) break;
    const dateObj = new Date(data.hourly.time[idx]);
    hours[i].textContent = dateObj.toLocaleTimeString([], {
      hour: "2-digit",
      hour12: true,
    });
    const icon = getWeatherIcon(data.hourly.weather_code[idx]);
    images[i].src = `../assets/images/icon-${icon}.webp`;
    temps[
      i
    ].textContent = `${data.hourly.temperature_2m[idx]}${data.hourly_units.temperature_2m}`;
    pop(temps[i]);
  }

  staggerFade(document.querySelectorAll(".hourly-forecast .hour"), 40);
};

navigator.geolocation.getCurrentPosition(
  async (pos) => {
    weatherData = await fetchData(pos.coords.latitude, pos.coords.longitude);
    currLat = pos.coords.latitude;
    currLon = pos.coords.longitude;
    currCity = "Your Location";
    hideLoadingScreen();
    addTodayDetails(weatherData, "Your Location");
    addHourlyDetails(weatherData, 0);
    addDailyDetails(weatherData);
  },
  async () => {
    alert("Location blocked. Using default: Kathmandu");
    weatherData = await fetchData(27.7172, 85.324);
    currLat = 27.7172;
    currLon = 85.324;
    currCity = "Kathmandu";
    hideLoadingScreen();
    addTodayDetails(weatherData, "Kathmandu");
    addHourlyDetails(weatherData, 0);
    addDailyDetails(weatherData);
  }
);

function getWeatherIcon(code) {
  if (code === 0) return "sunny";
  if ([1, 2].includes(code)) return "partly-cloudy";
  if (code === 3) return "overcast";
  if ([45, 48].includes(code)) return "fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "storm";
  return "sunny";
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".input-container")) {
    lists.classList.remove("show");
  }
});

button.addEventListener("click", async (e) => {
  e.preventDefault();
  showLoadingScreen();
  const location = searchPlace.value.trim();
  const cities = await fetchCities(location);
  if (!cities || !cities.results || cities.results.length === 0) {
    alert("No cities found! Try again!");
    hideLoadingScreen();
    return;
  }
  weatherData = await fetchData(
    cities.results[0].latitude,
    cities.results[0].longitude
  );
  hideLoadingScreen();
  addTodayDetails(weatherData, cities.results[0].name);
  addHourlyDetails(weatherData, 0);
  addDailyDetails(weatherData);
  currCity = cities.results[0].name;
  currLat = cities.results[0].latitude;
  currLon = cities.results[0].longitude;
});

lists.addEventListener("click", (e) => {
  if (e.target.tagName === "LI") {
    searchPlace.value = e.target.textContent;
    lists.classList.remove("show");
  }
});

function errorHandler(err) {
  container.classList.add("err", "show");
  container.innerHTML = `<h2>Something went wrong!</h2>
  <p>${err || "Unknown Error!"}</p>
  <button id="refresh">Refresh</button>`;

  document.querySelector("#refresh").addEventListener("click", () => {
    window.location.reload();
  });
}
