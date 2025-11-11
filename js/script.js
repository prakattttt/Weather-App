let URL = "";
let data= "";

const today = new Date();

const searchPlace = document.querySelector("#place");
const lists = document.querySelector(".lists");

searchPlace.addEventListener("input", () => {
  if (searchPlace.value !== "") {
    searchPlace.style.backgroundImage = "none";
    lists.style.display = "block";
  } else {
    searchPlace.style.backgroundImage = "url(../assets/images/icon-search.svg)";
    lists.style.display = "none";
  }
});

const fetchData = async (lat, lon) => {
  const URL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code&current=temperature_2m,precipitation,weather_code,wind_speed_10m,relative_humidity_2m,apparent_temperature&timezone=auto`;
  const res = await fetch(URL);
  const data = await res.json();
  console.log(data);
  return data;
};

const addTodayDetails = (data) => {
  const address = document.querySelector('.address');
  const date = document.querySelector('.date');
  address.textContent = data.timezone.split('/')[1];
  const options = { 
  weekday: 'long',   
  year: 'numeric',   
  month: 'short',   
  day: 'numeric'     
};
const newDate = today.toLocaleDateString('en-US', options);
date.textContent = newDate;
document.querySelector('#temp').textContent = `${data.current.temperature_2m}${data.current_units.temperature_2m}`;
document.querySelector('#feels-like-text').textContent = `${data.current.apparent_temperature}${data.current_units.apparent_temperature}`;
document.querySelector('#humidity-text').textContent = `${data.current.relative_humidity_2m}${data.current_units.relative_humidity_2m}`;
document.querySelector('#wind-text').textContent = `${data.current.wind_speed_10m} ${data.current_units.wind_speed_10m}`;
document.querySelector('#precipitation-text').textContent = `${data.current.precipitation} ${data.current_units.precipitation}`;

};

navigator.geolocation.getCurrentPosition(
  async (pos) => {
    const data = await fetchData(pos.coords.latitude, pos.coords.longitude);
    addTodayDetails(data);
  },
  async () => {
    console.log("Location blocked. Using default: Kathmandu");
    const data = await fetchData(27.7172, 85.3240);
    addTodayDetails(data);
  }
);
