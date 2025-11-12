let URL = "";
let index = "";

const today = new Date();

const searchPlace = document.querySelector("#place");
const lists = document.querySelector(".lists");

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

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

searchPlace.addEventListener(
  "input",
  debounce(async () => {
    const query = searchPlace.value.trim();

    if (query !== "") {
      searchPlace.style.backgroundImage = "none";
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
      searchPlace.style.backgroundImage =
        "url(../assets/images/icon-search.svg)";
      lists.style.display = "none";
      lists.innerHTML = "";
    }
  }, 800)
);

const fetchCities = async (place) => {
  const URL = `https://geocoding-api.open-meteo.com/v1/search?name=${place}&count=10&language=en&format=json`;
  const res = await fetch(URL);
  return res.json();
};

const fetchData = async (lat, lon) => {
  const URL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code&current=temperature_2m,precipitation,weather_code,wind_speed_10m,relative_humidity_2m,apparent_temperature&timezone=auto`;
  const res = await fetch(URL);
  const data = await res.json();
  console.log(data);
  return data;
};

const addTodayDetails = (data) => {
  const address = document.querySelector(".address");
  const date = document.querySelector(".date");
  address.textContent = data.timezone.split("/")[1];
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
  week.forEach((w, i) => {
    const date = new Date();
    date.setDate(today.getDate() + i);
    w.textContent = date.toLocaleDateString("en-US", { weekday: "short" });
  });

  const image = document.querySelectorAll(".day p img");
  image.forEach((img, i) => {
    const icon = getWeatherIcon(data.daily.weather_code[i]);
    img.src = `../assets/images/icon-${icon}.webp`;
  });
  const min = document.querySelectorAll(".daily-min");
  min.forEach((mn, i) => {
    mn.textContent = data.daily.temperature_2m_min[i];
  });
  const max = document.querySelectorAll(".daily-max");
  max.forEach((mx, i) => {
    mx.textContent = data.daily.temperature_2m_max[i];
  });
};

const addHourlyDetails = (data) => {
  const hours = document.querySelectorAll(".time-hour");
  hours.forEach((hr, i) => {
    let d = new Date();
    d.setHours(d.getHours() + i);
    hr.textContent = d.toLocaleTimeString([], {
      hour: "2-digit",
      hour12: true,
    });
  });
  const image = document.querySelectorAll(".hour p img");
  image.forEach((img, i) => {
    const icon = getWeatherIcon(data.hourly.weather_code[today.getHours() + i]);
    img.src = `../assets/images/icon-${icon}.webp`;
  });
  const temp = document.querySelectorAll(".hourly-temp");
  temp.forEach((t, i) => {
    t.textContent = `${data.hourly.temperature_2m[today.getHours() + i]}${
      data.hourly_units.temperature_2m
    }`;
  });
};

navigator.geolocation.getCurrentPosition(
  async (pos) => {
    const data = await fetchData(pos.coords.latitude, pos.coords.longitude);
    addTodayDetails(data);
    addHourlyDetails(data);
    addDailyDetails(data);
  },
  async () => {
    console.log("Location blocked. Using default: Kathmandu");
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
