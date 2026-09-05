import axios from "axios";

// Backend ka base URL - .env me VITE_API_BASE_URL se aata hai
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Har request ke saath agar login token hai to automatically bhej do
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("heatsafe_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------- Weather ----------------
export const getCurrentWeather = (lat, lon, label) =>
  client.get("/weather/current", { params: { lat, lon, label } }).then((r) => r.data);

export const searchLocation = (q) =>
  client.get("/weather/geocode", { params: { q } }).then((r) => r.data);

// ---------------- Risk ----------------
export const getRiskPrediction = (lat, lon) =>
  client.get("/risk/predict", { params: { lat, lon } }).then((r) => r.data);

export const getRiskManual = (payload) =>
  client.post("/risk/predict-manual", payload).then((r) => r.data);

export const getHeatZones = (lat, lon, radiusKm = 25, gridSize = 5) =>
  client
    .get("/risk/heatzones", { params: { lat, lon, radius_km: radiusKm, grid_size: gridSize } })
    .then((r) => r.data);

export const getOpenWeatherTileUrl = (layer) =>
  `${API_BASE_URL}/weather/tiles/${layer}/{z}/{x}/{y}.png`;

export const getForecast = (lat, lon, hours, label) =>
  client.get("/risk/forecast", { params: { lat, lon, hours, label } }).then((r) => r.data);

// ---------------- Alerts ----------------
export const getCurrentAlert = (lat, lon, label) =>
  client.get("/alerts/current", { params: { lat, lon, label } }).then((r) => r.data);

export const askAssistant = (question, risk, weather) =>
  client.post("/assistant/chat", { question, risk, weather }).then((r) => r.data);

// ---------------- Users / Auth ----------------
export const registerUser = (payload) =>
  client.post("/users/register", payload).then((r) => r.data);

export const loginUser = (payload) =>
  client.post("/users/login", payload).then((r) => r.data);

export const getMe = () => client.get("/users/me").then((r) => r.data);

export const updateMyLocation = (payload) =>
  client.put("/users/me/location", payload).then((r) => r.data);

export const getMyAreaHeatRisk = () =>
  client.get("/users/me/heat-risk").then((r) => r.data);

export default client;
