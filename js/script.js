let URL = "";
let index = "";

const today = new Date();

const searchPlace = document.querySelector("#place");
const lists = document.querySelector(".lists");
const button = document.querySelector(".btn");

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

  if (query !== "") {
    lists.style.display = "block";

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
    lists.style.display = "none";
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
  const URL = `https://geocoding-api.open-meteo.com/v1/search?name=${place}&count=10&language=en&format=json`;
  const res = await fetch(URL);
  const data = await res.json();
  console.log(data);
  return data;
};

const fetchData = async (lat, lon) => {
  const URL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code&current=temperature_2m,precipitation,weather_code,wind_speed_10m,relative_humidity_2m,apparent_temperature&timezone=auto`;
  const res = await fetch(URL);
  const data = await res.json();
  console.log(data);
  return data;
};

const addTodayDetails = (data, city) => {
  const address = document.querySelector(".address");
  const date = document.querySelector(".date");
  address.textContent = city;
  const options = {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  const newDate = today.toLocaleDateString("en-US", options);
  date.textContent = newDate;
  document.querySelector(
    "#temp"
  ).textContent = `${data.current.temperature_2m}${data.current_units.temperature_2m}`;
  document.querySelector(
    "#feels-like-text"
  ).textContent = `${data.current.apparent_temperature}${data.current_units.apparent_temperature}`;
  document.querySelector(
    "#humidity-text"
  ).textContent = `${data.current.relative_humidity_2m}${data.current_units.relative_humidity_2m}`;
  document.querySelector(
    "#wind-text"
  ).textContent = `${data.current.wind_speed_10m} ${data.current_units.wind_speed_10m}`;
  document.querySelector(
    "#precipitation-text"
  ).textContent = `${data.current.precipitation} ${data.current_units.precipitation}`;
  const icon = getWeatherIcon(data.current.weather_code);
  const image = document.querySelector(".temperature img");
  image.src = `../assets/images/icon-${icon}.webp`;
};

const addDailyDetails = (data) => {
  const week = document.querySelectorAll(".weekday");
  const image = document.querySelectorAll(".day p img");
  const min = document.querySelectorAll(".daily-min");
  const max = document.querySelectorAll(".daily-max");

  for (let i = 0; i < week.length; i++) {
    const timestamp = data.daily.time[i];
    const dateObj = new Date(timestamp);
    week[i].textContent = dateObj.toLocaleDateString("en-US", {
      weekday: "short",
    });

    const icon = getWeatherIcon(data.daily.weather_code[i]);
    image[i].src = `../assets/images/icon-${icon}.webp`;

    min[i].textContent = data.daily.temperature_2m_min[i];
    max[i].textContent = data.daily.temperature_2m_max[i];
  }
};

const addHourlyDetails = (data) => {
  const hours = document.querySelectorAll(".time-hour");
  const image = document.querySelectorAll(".hour p img");
  const temp = document.querySelectorAll(".hourly-temp");

  const currentTime = data.current.time;

  let startIndex = data.hourly.time.indexOf(currentTime);

  if (startIndex === -1) {
    startIndex = data.hourly.time.findIndex(
      (t) => new Date(t) > new Date(currentTime)
    );
  }

  if (startIndex === -1) startIndex = 0;

  for (let i = 0; i < hours.length; i++) {
    const idx = startIndex + i;
    if (idx >= data.hourly.time.length) break;

    const timestamp = data.hourly.time[idx];
    const dateObj = new Date(timestamp);

    hours[i].textContent = dateObj.toLocaleTimeString([], {
      hour: "2-digit",
      hour12: true,
    });

    const icon = getWeatherIcon(data.hourly.weather_code[idx]);
    image[i].src = `../assets/images/icon-${icon}.webp`;

    temp[
      i
    ].textContent = `${data.hourly.temperature_2m[idx]}${data.hourly_units.temperature_2m}`;
  }
};

navigator.geolocation.getCurrentPosition(
  async (pos) => {
    const data = await fetchData(pos.coords.latitude, pos.coords.longitude);
    addTodayDetails(data, "Your Location");
    addHourlyDetails(data);
    addDailyDetails(data);
  },
  async () => {
    alert("Location blocked. Using default: Kathmandu");
    const data = await fetchData(27.7172, 85.324);
    addTodayDetails(data);
    addHourlyDetails(data);
    addDailyDetails(data);
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

document.addEventListener("click", () => {
  lists.style.display = "none";
});

button.addEventListener("click", async (e) => {
  e.preventDefault();

  const location = searchPlace.value.trim();
  const cities = await fetchCities(location);
  if (!cities || !cities.results || cities.results.length === 0) {
    alert("No cities found! Try again!");
  }
  const data = await fetchData(
    cities.results[0].latitude,
    cities.results[0].longitude
  );
  addTodayDetails(data, cities.results[0].name);
  addHourlyDetails(data);
  addDailyDetails(data);
});

lists.addEventListener("click", (e) => {
  e.preventDefault();

  searchPlace.value = e.target.textContent;
});
