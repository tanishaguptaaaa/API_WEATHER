const userTab = document.querySelector("[data-userWeather]");
const searchTab = document.querySelector("[data-searchWeather]");

const userContainer = document.querySelector(".weather-container");
const grantAccessContainer = document.querySelector(".grant-location-container");

const searchForm = document.querySelector("[data-searchForm]");
const loadingScreen = document.querySelector(".loading-container");
const userInfoContainer = document.querySelector(".user-container-info");
const errorContainer = document.querySelector(".error-container");

// Initial variables
const API_KEY = "30587c6bb9bbf37124aaf15501997e1c";
let currentTab = userTab;
currentTab.classList.add("current-tab");
getfromSessionStorage();

function switchTab(clickedTab) {
    if (clickedTab != currentTab) {
        currentTab.classList.remove("current-tab");
        currentTab = clickedTab;
        currentTab.classList.add("current-tab");

        if (!searchForm.classList.contains("active")) {
            grantAccessContainer.classList.remove("active");
            userInfoContainer.classList.remove("active");
            searchForm.classList.add("active");
        } else {
            // Switch to 'Your Weather' tab
            userInfoContainer.classList.remove("active");
            searchForm.classList.remove("active");
            getfromSessionStorage();
        }
    }
}

userTab.addEventListener("click", () => {
    switchTab(userTab);
});

searchTab.addEventListener("click", () => {
    switchTab(searchTab);
});

// Check if coordinates are already present in session storage
function getfromSessionStorage() {
    const localCoordinates = sessionStorage.getItem("user-coordinates");
    if (!localCoordinates) {
        grantAccessContainer.classList.add("active");
    } else {
        const coordinates = JSON.parse(localCoordinates);
        fetchUserWeatherInfo(coordinates);
    }
}

// Fetch weather info for user's coordinates
async function fetchUserWeatherInfo(coordinates) {
    const { lat, lon } = coordinates;

    grantAccessContainer.classList.remove("active");
    loadingScreen.classList.add("active");

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );

        if (!response.ok) throw new Error("Failed to fetch weather data");

        const data = await response.json();
        loadingScreen.classList.remove("active");
        userInfoContainer.classList.add("active");
        renderWeatherInfo(data);
    } catch (err) {
        console.error("Error fetching user weather info:", err);
        loadingScreen.classList.remove("active");
        errorContainer.classList.add("active");
    }
}

// Render weather information
function renderWeatherInfo(weatherInfo) {
    const cityName = document.querySelector("[data-cityName]");
    const countryIcon = document.querySelector("[data-countryIcon]");
    const desc = document.querySelector("[data-weatherDesc]");
    const weatherIcon = document.querySelector("[data-weatherIcon]");
    const temp = document.querySelector("[data-temperature]");
    const windspeed = document.querySelector("[data-windspeed]");
    const humidity = document.querySelector("[data-humidity]");
    const cloudiness = document.querySelector("[data-cloudiness]");

    cityName.innerText = weatherInfo?.name || "N/A";
    countryIcon.src = weatherInfo?.sys?.country
        ? `https://flagcdn.com/144x108/${weatherInfo.sys.country.toLowerCase()}.png`
        : "./images/default-country.png";
    desc.innerText = weatherInfo?.weather?.[0]?.description || "N/A";
    weatherIcon.src = weatherInfo?.weather?.[0]?.icon
        ? `http://openweathermap.org/img/w/${weatherInfo.weather[0].icon}.png`
        : "./images/default-weather.png";
    temp.innerText = `${weatherInfo?.main?.temp || "N/A"} °C`;
    windspeed.innerText = `${weatherInfo?.wind?.speed || "N/A"} m/s`;
    humidity.innerText = `${weatherInfo?.main?.humidity || "N/A"}%`;
    cloudiness.innerText = `${weatherInfo?.clouds?.all || "N/A"}%`;
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, () => {
            alert("Unable to fetch your location. Please try again.");
        });
    } else {
        alert("No support available for geolocation in this browser.");
    }
}

function showPosition(position) {
    const userCoordinates = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
    };

    sessionStorage.setItem("user-coordinates", JSON.stringify(userCoordinates));
    fetchUserWeatherInfo(userCoordinates);
}

const grantAccess = document.querySelector("[data-grantAccess]");
grantAccess.addEventListener("click", getLocation);

const searchInput = document.querySelector("[data-searchInput]");
searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const cityName = searchInput.value.trim();

    if (cityName === "") {
        alert("City name cannot be empty.");
        return;
    }
    fetchSearchWeatherInfo(cityName);
});

// Fetch weather info for searched city
async function fetchSearchWeatherInfo(city) {
    loadingScreen.classList.add("active");
    userInfoContainer.classList.remove("active");
    grantAccessContainer.classList.remove("active");

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );

        if (!response.ok) throw new Error("City not found");

        const data = await response.json();
        loadingScreen.classList.remove("active");
        userInfoContainer.classList.add("active");
        renderWeatherInfo(data);
    } catch (err) {
        console.error("Error fetching search weather info:", err);
        loadingScreen.classList.remove("active");
        errorContainer.classList.add("active");
    }
}
