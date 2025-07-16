const API_KEY = "30587c6bb9bbf37124aaf15501997e1c";

const userTab = document.querySelector("[data-userWeather]");
const searchTab = document.querySelector("[data-searchWeather]");
const grantAccessContainer = document.querySelector(".grant-location-container");
const searchForm = document.querySelector("[data-searchForm]");
const loadingScreen = document.querySelector(".loading-container");
const userInfoContainer = document.querySelector(".user-container-info");
const errorContainer = document.querySelector(".error-container");

let currentTab = userTab;
currentTab.classList.add("current-tab");
getfromSessionStorage();
function switchTab(clickedTab) {
    if (clickedTab !== currentTab) {
        currentTab.classList.remove("current-tab");
        currentTab = clickedTab;
        currentTab.classList.add("current-tab");
        errorContainer.classList.remove("active");

      
        if (clickedTab === searchTab) {
            userInfoContainer.classList.remove("active");
            document.querySelector("[data-forecastContainer]").innerHTML = "";
            document.querySelector("[data-aqi]").innerText = "--";
            document.querySelector("[data-aqiCategory]").innerText = "Loading...";
            document.querySelector("[data-activitySuggestion]").innerText = "";
            document.querySelector("[data-clothingSuggestion]").innerText = "";
            document.querySelector("[data-healthAlert]").innerText = "";
        }

        if (!searchForm.classList.contains("active")) {
            grantAccessContainer.classList.remove("active");
            userInfoContainer.classList.remove("active");
            searchForm.classList.add("active");
        } else {
            searchForm.classList.remove("active");
            getfromSessionStorage();
        }
    }
}


userTab.addEventListener("click", () => switchTab(userTab));
searchTab.addEventListener("click", () => switchTab(searchTab));

function getfromSessionStorage() {
    const localCoordinates = sessionStorage.getItem("user-coordinates");
    if (!localCoordinates) grantAccessContainer.classList.add("active");
    else fetchUserWeatherInfo(JSON.parse(localCoordinates));
}

async function fetchUserWeatherInfo({ lat, lon }) {
    grantAccessContainer.classList.remove("active");
    loadingScreen.classList.add("active");

    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        const data = await response.json();
        loadingScreen.classList.remove("active");
        userInfoContainer.classList.add("active");
        renderWeatherInfo(data);

        await fetchForecast(lat, lon);
        const aqi = await fetchAQI(lat, lon);
        showSuggestions(data.main.temp, aqi);
    } catch {
        loadingScreen.classList.remove("active");
        errorContainer.classList.add("active");
    }
}

function renderWeatherInfo(info) {
    document.querySelector("[data-cityName]").innerText = info.name;
    document.querySelector("[data-countryIcon]").src = `https://flagcdn.com/144x108/${info.sys.country.toLowerCase()}.png`;
    document.querySelector("[data-weatherDesc]").innerText = info.weather[0].description;
    document.querySelector("[data-weatherIcon]").src = `http://openweathermap.org/img/w/${info.weather[0].icon}.png`;
    document.querySelector("[data-temperature]").innerText = `${info.main.temp} °C`;
    document.querySelector("[data-windspeed]").innerText = `${info.wind.speed} m/s`;
    document.querySelector("[data-humidity]").innerText = `${info.main.humidity}%`;
    document.querySelector("[data-cloudiness]").innerText = `${info.clouds.all}%`;
}

document.querySelector("[data-grantAccess]").addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const userCoordinates = {
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
            };
            sessionStorage.setItem("user-coordinates", JSON.stringify(userCoordinates));
            fetchUserWeatherInfo(userCoordinates);
        },
        () => alert("Location access denied.")
    );
});

document.querySelector("[data-searchForm]").addEventListener("submit", (e) => {
    e.preventDefault();
    const city = document.querySelector("[data-searchInput]").value.trim();
    if (city) fetchSearchWeatherInfo(city);
});

async function fetchSearchWeatherInfo(city) {
    loadingScreen.classList.add("active");
    userInfoContainer.classList.remove("active");
    grantAccessContainer.classList.remove("active");

    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
        const data = await response.json();
        loadingScreen.classList.remove("active");
        userInfoContainer.classList.add("active");
        renderWeatherInfo(data);

        await fetchForecast(data.coord.lat, data.coord.lon);
        const aqi = await fetchAQI(data.coord.lat, data.coord.lon);
        showSuggestions(data.main.temp, aqi);
    } catch {
        loadingScreen.classList.remove("active");
        errorContainer.classList.add("active");
    }
}

// ✅ Use /forecast API (5-day, 3-hour intervals) instead of deprecated /onecall
async function fetchForecast(lat, lon) {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
    const data = await res.json();
    const grouped = groupForecastByDay(data.list);
    renderForecast(grouped);
}

function groupForecastByDay(list) {
    const days = {};
    list.forEach(entry => {
        const date = entry.dt_txt.split(" ")[0];
        if (!days[date]) {
            days[date] = {
                temps: [],
                icons: [],
                descriptions: [],
                dateStr: new Date(entry.dt * 1000).toDateString()
            };
        }
        days[date].temps.push(entry.main.temp);
        days[date].icons.push(entry.weather[0].icon);
        days[date].descriptions.push(entry.weather[0].description);
    });

    return Object.values(days).slice(0, 5).map(day => ({
        date: day.dateStr,
        minTemp: Math.min(...day.temps),
        maxTemp: Math.max(...day.temps),
        icon: mostFrequent(day.icons),
        description: mostFrequent(day.descriptions)
    }));
}

function mostFrequent(arr) {
    return arr.sort((a, b) =>
        arr.filter(v => v === a).length - arr.filter(v => v === b).length
    ).pop();
}

function renderForecast(days) {
    const container = document.querySelector("[data-forecastContainer]");
    container.innerHTML = "";
    days.forEach(day => {
        container.innerHTML += `
            <div class="forecast-card">
              <p>${day.date}</p>
              <img src="http://openweathermap.org/img/w/${day.icon}.png" />
              <p>${day.description}</p>
              <p>${Math.round(day.maxTemp)}°C / ${Math.round(day.minTemp)}°C</p>
            </div>`;
    });
}

async function fetchAQI(lat, lon) {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
    const data = await res.json();
    const aqi = data.list[0].main.aqi;
    document.querySelector("[data-aqi]").innerText = aqi;
    document.querySelector("[data-aqiCategory]").innerText = ["Good", "Fair", "Moderate", "Poor", "Very Poor"][aqi - 1];
    return aqi;
}

function showSuggestions(temp, aqi) {
    const activity = document.querySelector("[data-activitySuggestion]");
    const clothing = document.querySelector("[data-clothingSuggestion]");
    const health = document.querySelector("[data-healthAlert]");

    if (temp < 10) clothing.innerText = "Wear woollens and layered clothes.";
    else if (temp < 25) clothing.innerText = "Light cottons are best.";
    else clothing.innerText = "Use light, breathable fabric and stay hydrated.";

    activity.innerText = aqi <= 2 ? "Good day for outdoor fun!" : "Avoid heavy outdoor activities.";
    health.innerText = aqi >= 4 ? "Air quality is poor. Prefer staying indoors." : "Air is clean, you're good to go!";
}
