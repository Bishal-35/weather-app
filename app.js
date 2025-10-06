require("dotenv").config();
const express = require("express");
const axios = require("axios");
const app = express();
const PORT = 3000;

// Validate API key existence
if (!process.env.WEATHER_API_KEY) {
  console.error("WEATHER_API_KEY is not defined in .env file");
  process.exit(1);
}

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

// Helper for weather icons
function getWeatherIcon(condition) {
  const iconMap = {
    Clear: "sun",
    Clouds: "cloud",
    Rain: "cloud-showers-heavy",
    Drizzle: "cloud-rain",
    Thunderstorm: "bolt",
    Snow: "snowflake",
    Mist: "smog",
    Fog: "smog",
    Smoke: "smog",
    Haze: "smog",
    Dust: "smog",
    Sand: "smog",
    Ash: "smog",
    Squall: "wind",
    Tornado: "wind",
  };
  return iconMap[condition] || "cloud";
}

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index", {
    weather: null,
    error: null,
    forecast: null,
    city: null,
    getWeatherIcon,
  });
});

app.post("/weather", async (req, res) => {
  const city = req.body.city;
  const apiKey = WEATHER_API_KEY;

  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;

  try {
    // Fetch current weather
    const weatherResponse = await axios.get(weatherUrl);
    const { main, weather, name } = weatherResponse.data;
    const weatherData = {
      temp: main.temp,
      humidity: main.humidity,
      condition: weather[0].main,
      city: name,
    };

    // Fetch 5-day forecast
    const forecastResponse = await axios.get(forecastUrl);
    const forecastList = forecastResponse.data.list;
    const dailyForecasts = [];
    const processedDates = new Set();
    const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

    for (let i = 0; i < forecastList.length; i++) {
      const [date, time] = forecastList[i].dt_txt.split(" ");
      const hour = parseInt(time.split(":")[0]);
      if (hour >= 9 && !processedDates.has(date) && date !== todayStr) {
        dailyForecasts.push({
          date: date,
          temp: forecastList[i].main.temp,
          condition: forecastList[i].weather[0].main,
          icon: getWeatherIcon(forecastList[i].weather[0].main),
          humidity: forecastList[i].main.humidity,
        });
        processedDates.add(date);
      }
      if (processedDates.size >= 5) {
        break; // collect only 5 days
      }
    }

    res.render("index", {
      weather: weatherData,
      error: null,
      forecast: dailyForecasts,
      city: name,
      getWeatherIcon,
    });
  } catch (err) {
    res.render("index", {
      weather: null,
      error: "City not found",
      forecast: null,
      city: null,
      getWeatherIcon,
    });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
