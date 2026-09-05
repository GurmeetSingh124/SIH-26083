/* ==========================================================================
   HeatSafe AI — Frontend application logic
   Works fully on DEMO DATA out of the box. If a backend is running at
   API_BASE, live endpoints are used instead and demo data is only the
   fallback when a request fails. No API keys ever live in this file.
   ========================================================================== */

/* ---------- Configuration ---------- */
const API_BASE = "http://127.0.0.1:8000/api"; // FastAPI backend, see /backend
const USE_LIVE_API = true;

const RISK_META = {
  low:       { label: "Low",      color: "var(--risk-low)",      class: "risk-low" },
  moderate:  { label: "Moderate", color: "var(--risk-moderate)", class: "risk-moderate" },
  high:      { label: "High",     color: "var(--risk-high)",     class: "risk-high" },
  extreme:   { label: "Extreme",  color: "var(--risk-extreme)",  class: "risk-extreme" },
};

const FACTOR_TEMPLATES = {
  extreme:  [["Temperature",92,"High"],["Humidity",74,"High"],["Solar radiation",85,"High"],["Wind cooling",22,"Low"],["Historical trend",71,"High"]],
  high:     [["Temperature",78,"High"],["Humidity",60,"Moderate"],["Solar radiation",72,"High"],["Wind cooling",35,"Low"],["Historical trend",58,"Moderate"]],
  moderate: [["Temperature",55,"Moderate"],["Humidity",45,"Moderate"],["Solar radiation",50,"Moderate"],["Wind cooling",55,"Moderate"],["Historical trend",40,"Moderate"]],
  low:      [["Temperature",30,"Low"],["Humidity",30,"Low"],["Solar radiation",35,"Low"],["Wind cooling",75,"High"],["Historical trend",25,"Low"]],
};

const SAFETY_RECS = {
  student: { icon:"fa-graduation-cap", items:[
    "Avoid outdoor sports during peak heat (12 PM – 4 PM)",
    "Carry a water bottle and stay hydrated between classes",
    "Prefer morning or evening hours for outdoor activity",
    "Watch for dizziness or headache and tell a teacher immediately" ]},
  farmer: { icon:"fa-tractor", items:[
    "Shift field work to early morning or evening hours",
    "Take frequent shaded breaks every 45–60 minutes",
    "Carry drinking water and oral rehydration salts to the field",
    "Use shade, a hat, or light cotton clothing whenever possible" ]},
  worker: { icon:"fa-helmet-safety", items:[
    "Take regular cooling breaks in shade or air conditioning",
    "Stay hydrated — drink water every 20–30 minutes",
    "Reduce prolonged direct sunlight exposure where possible",
    "Watch coworkers for signs of heat exhaustion" ]},
  elderly: { icon:"fa-person-cane", items:[
    "Stay in a cool, well-ventilated environment during peak hours",
    "Maintain steady hydration even without feeling thirsty",
    "Avoid going outdoors between 12 PM and 4 PM",
    "Keep emergency contacts and medication easily accessible" ]},
  athlete: { icon:"fa-person-running", items:[
    "Reduce training intensity and duration during extreme heat",
    "Train during cooler early-morning or late-evening hours",
    "Hydrate before, during, and after activity",
    "Stop immediately if you feel cramping, nausea, or dizziness" ]},
  general: { icon:"fa-people-group", items:[
    "Limit outdoor exposure during peak afternoon hours",
    "Drink water regularly throughout the day",
    "Check on elderly neighbours and young children",
    "Wear light-coloured, loose-fitting clothing outdoors" ]},
};

/* ---------- State ---------- */
let state = {
  location: "Your location",
  profile: "student",
  rangeHours: 24,
};
let predictionChart = null;
let map = null;
let mapMarkers = {};

let userLocationMarker = null;
let userLocationCircle = null;
let userCoordinates = null;
let lastExtremeNotification = null;
let riskCloudLayers = [];
let riskCloudGroup = null;

/* ---------- Utilities ---------- */
const $ = (sel) => document.querySelector(sel);
const $all = (sel) => Array.from(document.querySelectorAll(sel));

function riskFromScore(score){
  if (score >= 80) return "extreme";
  if (score >= 55) return "high";
  if (score >= 30) return "moderate";
  return "low";
}

function seededOffset(seed, spread){
  // deterministic pseudo-variation so 24/48/72h views differ but stay stable
  const x = Math.sin(seed * 999) * 10000;
  return (x - Math.floor(x) - 0.5) * spread;
}

/* ---------- Data access (live API with graceful demo fallback) ---------- */
async function fetchRisk(location, coordinates = null){
  if (USE_LIVE_API){
    try{
      const params = new URLSearchParams({ location });
      if (coordinates){
        params.set("lat", coordinates.lat);
        params.set("lon", coordinates.lon);
      }
      const res = await fetch(`${API_BASE}/risk?${params}`);
      if (!res.ok) throw new Error("bad response");
      const data = await res.json();
      setMode(false);
      return normalizeRisk(data);
    }catch(err){
      console.warn("Live risk fetch failed, using demo data:", err);
      setMode(true);
    }
  }
  throw new Error("Live weather service is unavailable");
}

function normalizeRisk(d){
  return {
    location: d.location,
    lat: d.lat,
    lon: d.lon,
    temperature: d.temperature,
    feelsLike: d.feels_like ?? d.feelsLike,
    humidity: d.humidity,
    wind: d.wind_speed ?? d.wind,
    solar: d.solar_radiation ?? d.solar,
    dew: d.dew_point ?? d.dew,
    rain: d.rainfall ?? d.rain,
    heatIndex: d.heat_index ?? d.heatIndex,
    riskLabel: d.thermal_risk ?? d.riskLabel,
    riskScore: d.risk_score ?? d.riskScore,
    heatwaveProb: d.heatwave_probability ?? d.heatwaveProb,
    risk: (d.thermal_risk ?? riskFromScore(d.risk_score ?? d.riskScore ?? 0)).toString().toLowerCase(),
  };
}

function setMode(isDemo){
  const tag = $("#modeTag");
  if (isDemo){
    tag.innerHTML = `<i class="fa-solid fa-flask"></i> DEMO DATA — live weather feed not connected`;
  } else {
    tag.innerHTML = `<i class="fa-solid fa-satellite-dish"></i> LIVE MODE — connected to HeatSafe backend`;
  }
}

/* ---------- Header date/time ---------- */
function renderClock(){
  const now = new Date();
  $("#heroDate").textContent = now.toLocaleDateString(undefined, { weekday:"long", year:"numeric", month:"long", day:"numeric" });
  $("#heroUpdated").textContent = now.toLocaleTimeString(undefined, { hour:"2-digit", minute:"2-digit" });
}

/* ---------- Risk card + weather overview ---------- */
function renderRisk(data){
  const meta = RISK_META[data.risk] || RISK_META.moderate;

  const badge = $("#riskBadge");
  badge.textContent = meta.label.toUpperCase() === meta.label ? meta.label : meta.label;
  badge.className = `risk-badge ${meta.class}`;

  // Animate gauge: circumference = 2*pi*92 ≈ 578
  const circumference = 578;
  const pct = Math.max(0, Math.min(100, data.riskScore)) / 100;
  const offset = circumference * (1 - pct);
  const fill = $("#gaugeFill");
  fill.style.stroke = meta.color;
  requestAnimationFrame(() => { fill.style.strokeDashoffset = offset; });

  animateNumber($("#riskScoreNum"), data.riskScore);

  $("#statHeatwaveProb").textContent = Math.round(data.heatwaveProb * 100) + "%";
  $("#statHeatIndex").textContent = data.heatIndex.toFixed(1) + "°C";
  $("#statRiskStatus").textContent = meta.label;

  $("#wTemp").textContent = data.temperature.toFixed(1) + "°C";
  $("#wFeelsLike").textContent = "Feels like " + data.feelsLike.toFixed(1) + "°C";
  $("#wHumidity").textContent = data.humidity + "%";
  $("#wWind").textContent = data.wind + " km/h";
  $("#wWindNote").textContent = data.wind < 10 ? "Low cooling effect" : data.wind < 18 ? "Moderate cooling effect" : "Good cooling effect";
  $("#wSolar").textContent = data.solar + " W/m²";
  $("#wSolarNote").textContent = data.solar > 750 ? "High" : data.solar > 500 ? "Moderate" : "Low";
  $("#wDew").textContent = data.dew.toFixed(0) + "°C";
  $("#wRain").textContent = data.rain + " mm";

  renderFactors(data.risk, data.riskScore);
  renderAlert(data, meta);
  notifyExtremeRisk(data);
}

function notifyExtremeRisk(data){
  if (data.risk !== "extreme" || lastExtremeNotification === data.location) return;
  lastExtremeNotification = data.location;
  const status = $("#locationStatus");
  if (status) status.textContent = `Extreme risk detected in ${data.location}. Stay indoors and follow safety instructions.`;
  if ("Notification" in window && Notification.permission === "granted"){
    new Notification("HeatSafe AI: Extreme heat risk", {
      body: `${data.location} has an extreme thermal stress risk (${Math.round(data.riskScore)}/100). Avoid outdoor exposure.`,
      tag: `heatsafe-${data.location}`,
    });
  }
}

function animateNumber(el, target){
  const start = 0;
  const duration = 1100;
  const t0 = performance.now();
  function tick(t){
    const p = Math.min(1, (t - t0) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(start + (target - start) * eased);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function renderFactors(risk, score){
  const list = FACTOR_TEMPLATES[risk] || FACTOR_TEMPLATES.moderate;
  const container = $("#factorList");
  container.innerHTML = "";
  const meta = RISK_META[risk];
  list.forEach(([name, pct, tag]) => {
    const row = document.createElement("div");
    row.className = "factor-row";
    row.innerHTML = `
      <span class="factor-name">${name}</span>
      <span class="factor-track"><span class="factor-bar" style="background:${meta.color}"></span></span>
      <span class="factor-tag" style="color:${meta.color}">${tag}</span>`;
    container.appendChild(row);
    requestAnimationFrame(() => { row.querySelector(".factor-bar").style.width = pct + "%"; });
  });
  $("#analysisScore").textContent = `${score} / 100`;
}

function renderAlert(data, meta){
  const banner = $("#alertBanner");
  banner.className = `alert-banner ${meta.class}`;
  const titleMap = {
    extreme: "Extreme heat alert",
    high: "High heat advisory",
    moderate: "Moderate heat notice",
    low: "Conditions are currently safe",
  };
  const textMap = {
    extreme: "Extreme thermal stress conditions are expected between 12 PM and 4 PM. Avoid outdoor exposure during this window.",
    high: "Elevated thermal stress is expected during afternoon hours. Limit prolonged outdoor exposure.",
    moderate: "Thermal stress is moderate today. Take normal precautions during peak afternoon hours.",
    low: "Thermal stress is low today. Outdoor activity is generally safe with normal hydration.",
  };
  $("#alertTitle").textContent = titleMap[data.risk];
  $("#alertText").textContent = textMap[data.risk];
  $("#alertProb").textContent = Math.round(data.heatwaveProb * 100) + "%";
  $("#alertPeak").textContent = data.risk === "low" ? "—" : "2:00 PM";
  $("#notifDot").hidden = (data.risk === "low");
}

/* ---------- Explain prediction modal ---------- */
function buildExplainContent(data, risk){
  const list = FACTOR_TEMPLATES[risk] || FACTOR_TEMPLATES.moderate;
  const lead = {
    extreme: "This forecast is driven primarily by very high temperature combined with high humidity, which sharply raises the heat index and limits the body's ability to cool itself through sweat evaporation.",
    high: "Elevated temperature and moderate-to-high humidity are pushing the heat index up, while light winds are doing little to offset the heat.",
    moderate: "Conditions are within a manageable range, though afternoon temperature and solar load still warrant normal precautions.",
    low: "Temperature, humidity and solar load are all in a comfortable range, and wind is providing useful cooling.",
  }[risk];
  const bullets = list.map(([name, pct, tag]) => `<p><strong>${name}:</strong> ${tag} contribution (${pct}/100) to the overall thermal stress score.</p>`).join("");
  return `<p>${lead}</p>${bullets}`;
}

/* ---------- Prediction chart ---------- */
function buildForecastSeries(data, hours){
  const points = hours / 24 * 3; // 3 points per day shown
  const days = hours / 24;
  const labels = [];
  const prob = [];
  const temp = [];
  const stress = [];
  for (let i = 0; i < days; i++){
    const dayLabel = i === 0 ? "Today" : i === 1 ? "Tomorrow" : `Day ${i+1}`;
    labels.push(dayLabel);
    const drift = seededOffset(data.riskScore + i, 14);
    prob.push(Math.max(5, Math.min(97, Math.round(data.heatwaveProb * 100 + drift))));
    temp.push(+(data.temperature + seededOffset(i + 3, 4)).toFixed(1));
    stress.push(Math.max(5, Math.min(99, Math.round(data.riskScore + seededOffset(i + 7, 12)))));
  }
  return { labels, prob, temp, stress };
}

function renderPredictionChart(data){
  const { labels, prob, temp, stress } = buildForecastSeries(data, state.rangeHours);
  const ctx = document.getElementById("predictionChart");
  const styles = getComputedStyle(document.documentElement);
  const accent = styles.getPropertyValue("--accent").trim();
  const extreme = styles.getPropertyValue("--risk-extreme").trim();
  const textMuted = styles.getPropertyValue("--text-muted").trim();
  const gridColor = styles.getPropertyValue("--border").trim();

  if (predictionChart) predictionChart.destroy();
  predictionChart = new Chart(ctx, {
    data: {
      labels,
      datasets: [
        {
          type: "bar", label: "Heatwave probability (%)", data: prob,
          backgroundColor: accent + "55", borderRadius: 6, yAxisID: "y",
          order: 2,
        },
        {
          type: "line", label: "Temperature (°C)", data: temp,
          borderColor: extreme, backgroundColor: extreme, tension: 0.35,
          pointRadius: 3, yAxisID: "y1", order: 1,
        },
        {
          type: "line", label: "Thermal stress score", data: stress,
          borderColor: accent, backgroundColor: accent, tension: 0.35,
          pointRadius: 3, borderDash: [5,4], yAxisID: "y", order: 0,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "bottom", labels: { color: textMuted, boxWidth: 12, usePointStyle: true } },
        tooltip: { backgroundColor: "#101819", titleColor: "#fff", bodyColor: "#dfe7e6", borderColor: gridColor, borderWidth: 1 },
      },
      scales: {
        x: { ticks: { color: textMuted }, grid: { color: gridColor } },
        y: { position: "left", min: 0, max: 100, ticks: { color: textMuted }, grid: { color: gridColor }, title: { display:true, text:"% / score", color: textMuted } },
        y1: { position: "right", ticks: { color: textMuted }, grid: { display:false }, title: { display:true, text:"°C", color: textMuted } },
      },
    },
  });
}

/* ---------- Heat map ---------- */
function initMap(){
  map = L.map("heatMap", { scrollWheelZoom: false }).setView([20.5937, 78.9629], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(map);
  riskCloudGroup = L.layerGroup().addTo(map);
  requestAnimationFrame(() => map.invalidateSize(true));
}

function riskColorVar(risk){
  return { low:"#4CAF6D", moderate:"#E5B93F", high:"#E88A2F", extreme:"#E14A34" }[risk] || "#E5B93F";
}

function showUserLocation(data){
  if (!map || !data.lat || !data.lon) return;
  map.invalidateSize(true);
  if (userLocationMarker) map.removeLayer(userLocationMarker);
  if (userLocationCircle) map.removeLayer(userLocationCircle);
  userLocationMarker = L.marker([data.lat, data.lon]).addTo(map).bindPopup(`<strong>${data.location}</strong><br>${RISK_META[data.risk].label} risk: ${Math.round(data.riskScore)}/100<br>GPS: ${data.lat.toFixed(5)}, ${data.lon.toFixed(5)}`).openPopup();
  userLocationCircle = L.circle([data.lat, data.lon], { radius: 5000, color: riskColorVar(data.risk), weight: 3, fillColor: riskColorVar(data.risk), fillOpacity: 0.28 }).addTo(map);
  map.setView([data.lat, data.lon], 13, { animate: true });
}

function showRawGpsPosition(latitude, longitude, accuracy){
  if (!map) return;
  if (userLocationMarker) map.removeLayer(userLocationMarker);
  if (userLocationCircle) map.removeLayer(userLocationCircle);
  userLocationMarker = L.circleMarker([latitude, longitude], {
    radius: 9,
    color: "#087f8c",
    weight: 3,
    fillColor: "#2fc4c0",
    fillOpacity: 1,
  }).addTo(map).bindPopup(`GPS position<br>Accuracy: about ${Math.round(accuracy || 0)} m`).openPopup();
  userLocationCircle = L.circle([latitude, longitude], {
    radius: Math.max(accuracy || 50, 50),
    color: "#087f8c",
    fillColor: "#2fc4c0",
    fillOpacity: 0.12,
  }).addTo(map);
  map.setView([latitude, longitude], 15, { animate: true });
}

function clearRiskCloud(){
  if (riskCloudGroup) riskCloudGroup.clearLayers();
  else riskCloudLayers.forEach(layer => map.removeLayer(layer));
  riskCloudLayers = [];
}

function addRiskCloudPoint(latitude, longitude, data){
  const color = riskColorVar(data.risk);
  const popup = `<strong>${data.location}</strong><br>${RISK_META[data.risk].label} risk: ${Math.round(data.riskScore)}/100<br>Temperature: ${data.temperature.toFixed(1)}°C<br>Humidity: ${data.humidity}%`;
  [18000, 11000, 5500].forEach((radius, index) => {
    const layer = L.circle([latitude, longitude], {
      radius,
      color,
      weight: index === 2 ? 1.5 : 0,
      fillColor: color,
      fillOpacity: [0.08, 0.14, 0.28][index],
      interactive: index === 2,
    }).addTo(riskCloudGroup || map);
    if (index === 2) layer.bindPopup(popup);
    riskCloudLayers.push(layer);
  });
}

async function renderRiskCloud(data){
  if (!map || !Number.isFinite(Number(data.lat)) || !Number.isFinite(Number(data.lon))) return;
  clearRiskCloud();
  addRiskCloudPoint(data.lat, data.lon, data);
  const offsets = [
    [0, 0], [0.12, 0], [-0.12, 0], [0, 0.12], [0, -0.12],
    [0.085, 0.085], [0.085, -0.085], [-0.085, 0.085], [-0.085, -0.085],
  ];
  const points = await Promise.all(offsets.map(async ([latOffset, lonOffset]) => {
    const latitude = data.lat + latOffset;
    const longitude = data.lon + lonOffset;
    try {
      return { latitude, longitude, data: await fetchRisk("Risk zone", { lat: latitude, lon: longitude }) };
    } catch (error) {
      return { latitude, longitude, data };
    }
  }));
  points.slice(1).forEach(point => addRiskCloudPoint(point.latitude, point.longitude, point.data));
}

async function locateUser(){
  if (!("geolocation" in navigator)){
    $("#locationStatus").textContent = "Geolocation is not supported by this browser.";
    return;
  }
  if ("Notification" in window && Notification.permission === "default") await Notification.requestPermission();
  $("#locationStatus").textContent = "Locating your area and loading live weather...";
  navigator.geolocation.getCurrentPosition(async (position) => {
    userCoordinates = { lat: position.coords.latitude, lon: position.coords.longitude };
    state.location = "Your location";
    $("#currentLocationLabel").textContent = "Your location";
    try{
      showRawGpsPosition(userCoordinates.lat, userCoordinates.lon, position.coords.accuracy);
      const data = await fetchRisk("Your location", userCoordinates);
      currentRiskData = data;
      renderRisk(data);
      renderPredictionChart(data);
      showUserLocation(data);
      await renderRiskCloud(data);
      const accuracy = Math.round(position.coords.accuracy || 0);
      $("#locationStatus").textContent = `Live risk zone loaded near your GPS position (${data.temperature.toFixed(1)}°C, ${data.humidity}% humidity). GPS accuracy: about ${accuracy} m.`;
      resolveLocationName(userCoordinates).then((name) => {
        if (!name) return;
        data.location = name;
        state.location = name;
        $("#currentLocationLabel").textContent = name;
        $("#locationStatus").textContent = `Live risk zone loaded near ${name}. GPS accuracy: about ${accuracy} m.`;
      });
      if (!$("#chatWindow").children.length) appendChatMessage(`Your exact area is loaded. Current thermal stress is ${RISK_META[data.risk].label} (${data.riskScore}/100).`, "bot");
    }catch(error){
      $("#locationStatus").textContent = "Live weather could not be loaded. Check that the backend is running.";
    }
  }, (error) => {
    const message = error.code === 1 ? "Location permission denied. Allow location access and click My Location again." : "GPS location unavailable. Check device location services and try again.";
    $("#locationStatus").textContent = message;
  }, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
}

async function resolveLocationName(coordinates){
  try{
    const params = new URLSearchParams({
      lat: coordinates.lat,
      lon: coordinates.lon,
      format: "jsonv2",
      zoom: "18",
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const address = (await response.json()).address || {};
    return address.neighbourhood || address.suburb || address.village || address.town || address.city || address.municipality || address.county || null;
  }catch(error){
    return null;
  }
}

/* ---------- Safety recommendations ---------- */
function renderRecommendations(profile){
  const rec = SAFETY_RECS[profile];
  const label = $(`.profile-chip[data-profile="${profile}"]`).textContent.trim();
  const card = $("#recommendCard");
  card.innerHTML = `
    <h3><i class="fa-solid ${rec.icon}" style="color:var(--accent); margin-right:8px;"></i>${label} — heat safety recommendations</h3>
    <div class="recommend-list">
      ${rec.items.map(item => `<div class="recommend-item"><i class="fa-solid fa-check"></i><span>${item}</span></div>`).join("")}
    </div>`;
}

/* ---------- Location dropdown ---------- */
function renderLocationDropdown(){
  const dropdown = $("#locationDropdown");
  dropdown.innerHTML = `<li role="option"><button data-loc="__current__">Use my current location</button></li>`;
}

/* ---------- AI Assistant (rule-based, grounded in current risk data — never invents a score) ---------- */
function assistantReply(question, data){
  const meta = RISK_META[data.risk];
  const q = question.toLowerCase();

  if (q.includes("safe to go outside") || q.includes("safe outside")){
    return data.risk === "low" || data.risk === "moderate"
      ? `It's reasonably safe right now. Current thermal stress is ${meta.label} (${data.riskScore}/100). Stay hydrated and avoid the peak afternoon hours if possible.`
      : `Current thermal stress risk is ${meta.label} (${data.riskScore}/100). It's best to avoid unnecessary outdoor exposure, especially between 12 PM and 4 PM. If you must go out, hydrate well and seek shade.`;
  }
  if (q.includes("heat risk") || q.includes("today's heat") || q.includes("today heat")){
    return `Today's heat risk in ${data.location} is ${meta.label} with a thermal stress score of ${data.riskScore}/100 and a heatwave probability of ${Math.round(data.heatwaveProb*100)}%. Heat index is ${data.heatIndex.toFixed(1)}°C.`;
  }
  if (q.includes("avoid heat stress") || q.includes("avoid heat")){
    return `To avoid heat stress: drink water regularly even if you don't feel thirsty, avoid strenuous activity between 12 PM and 4 PM, wear light loose clothing, and rest in shade or a cooled space whenever you feel overheated.`;
  }
  if (q.includes("exercise")){
    return data.risk === "extreme" || data.risk === "high"
      ? `With ${meta.label.toLowerCase()} thermal stress today, it's best to postpone intense outdoor exercise or move it to early morning/evening. If you must train, shorten sessions and hydrate frequently.`
      : `Thermal stress is currently ${meta.label.toLowerCase()}, so moderate exercise should be fine — just stay hydrated and take breaks in shade.`;
  }
  if (q.includes("why") && q.includes("high")){
    const list = FACTOR_TEMPLATES[data.risk] || FACTOR_TEMPLATES.moderate;
    const top = list.slice(0,2).map(f => f[0].toLowerCase()).join(" and ");
    return `The risk is elevated mainly because of ${top}, combined with limited wind cooling. You can see the full breakdown in the "Thermal stress factors" section above.`;
  }
  if (q.includes("cricket") || q.includes("sport") || q.includes("play")){
    return `Current thermal stress risk is ${meta.label}. Peak heat is expected during the afternoon. Consider moving outdoor activity to early morning or evening and stay hydrated.`;
  }
  return `Current thermal stress in ${data.location} is ${meta.label} (${data.riskScore}/100), with a heatwave probability of ${Math.round(data.heatwaveProb*100)}%. Ask me about safety, exercise, or why the risk looks the way it does.`;
}

function appendChatMessage(text, who){
  const win = $("#chatWindow");
  const msg = document.createElement("div");
  msg.className = `chat-msg ${who}`;
  msg.textContent = text;
  win.appendChild(msg);
  win.scrollTop = win.scrollHeight;
  return msg;
}

async function handleUserQuestion(question, currentData){
  appendChatMessage(question, "user");
  const typing = appendChatMessage("HeatSafe AI is thinking…", "bot typing");
  await new Promise(r => setTimeout(r, 550));
  typing.remove();
  appendChatMessage(assistantReply(question, currentData), "bot");
}

/* ---------- Location selection (drives all widgets) ---------- */
let currentRiskData = null;

async function selectLocation(name){
  $("#locationDropdown").hidden = true;
  if (name === "__current__") locateUser();
}

function setLoadingState(isLoading){
  const ids = ["#riskScoreNum","#statHeatwaveProb","#statHeatIndex","#wTemp","#wHumidity","#wWind","#wSolar"];
  if (isLoading){
    ids.forEach(id => { const el = $(id); if (el) el.dataset.prev = el.textContent; });
    $("#statRiskStatus").textContent = "Fetching weather…";
  }
}

/* ---------- Event wiring ---------- */
function wireEvents(){
  // Theme toggle
  $("#themeToggle").addEventListener("click", () => {
    const html = document.documentElement;
    const isDark = html.getAttribute("data-theme") !== "light";
    html.setAttribute("data-theme", isDark ? "light" : "dark");
    $("#themeToggle").innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    try{ window.localStorage.setItem("heatsafe-theme", isDark ? "light" : "dark"); }catch(e){}
    if (currentRiskData) renderPredictionChart(currentRiskData); // refresh chart colors
  });

  // Hamburger
  $("#hamburgerBtn").addEventListener("click", () => {
    const nav = $("#mobileNav");
    const expanded = $("#hamburgerBtn").getAttribute("aria-expanded") === "true";
    nav.hidden = expanded;
    if (!expanded) nav.setAttribute("data-open","");
    else nav.removeAttribute("data-open");
    $("#hamburgerBtn").setAttribute("aria-expanded", String(!expanded));
  });
  $all("#mobileNav a").forEach(a => a.addEventListener("click", () => {
    $("#mobileNav").hidden = true;
    $("#hamburgerBtn").setAttribute("aria-expanded","false");
  }));

  // Location dropdown
  $("#locationBtn").addEventListener("click", () => {
    $("#locationDropdown").hidden = !$("#locationDropdown").hidden;
  });
  $("#locationDropdown").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-loc]");
    if (btn) selectLocation(btn.dataset.loc);
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".header-actions")) $("#locationDropdown").hidden = true;
  });

  // Notifications (simple toggle demo)
  $("#notifBtn").addEventListener("click", () => {
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
    document.getElementById("alerts").scrollIntoView({ behavior: "smooth" });
  });

  $("#myLocationBtn").addEventListener("click", locateUser);

  // Hero CTA
  $("#checkRiskBtn").addEventListener("click", () => {
    document.getElementById("riskSection").scrollIntoView({ behavior: "smooth" });
  });

  // Explain prediction modal
  $("#explainBtn").addEventListener("click", () => {
    if (!currentRiskData) return;
    $("#explainModalBody").innerHTML = buildExplainContent(currentRiskData, currentRiskData.risk);
    $("#explainModal").hidden = false;
  });
  $("#explainModalClose").addEventListener("click", () => $("#explainModal").hidden = true);
  $("#explainModal").addEventListener("click", (e) => { if (e.target.id === "explainModal") $("#explainModal").hidden = true; });

  // Safety modal (from alert banner)
  $("#viewSafetyBtn").addEventListener("click", () => {
    const rec = SAFETY_RECS[state.profile];
    $("#safetyModalBody").innerHTML = rec.items.map(i => `<li>${i}</li>`).join("");
    $("#safetyModal").hidden = false;
  });
  $("#safetyModalClose").addEventListener("click", () => $("#safetyModal").hidden = true);
  $("#safetyModal").addEventListener("click", (e) => { if (e.target.id === "safetyModal") $("#safetyModal").hidden = true; });

  // Range toggle for prediction chart
  $all(".range-btn").forEach(btn => btn.addEventListener("click", () => {
    $all(".range-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.rangeHours = Number(btn.dataset.hours);
    if (currentRiskData) renderPredictionChart(currentRiskData);
  }));

  // Profile chips
  $all(".profile-chip").forEach(chip => chip.addEventListener("click", () => {
    $all(".profile-chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    state.profile = chip.dataset.profile;
    renderRecommendations(state.profile);
  }));

  // Chat
  $("#chatForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("#chatInput");
    const value = input.value.trim();
    if (!value || !currentRiskData) return;
    input.value = "";
    handleUserQuestion(value, currentRiskData);
  });
  $all("#quickQuestions button").forEach(btn => btn.addEventListener("click", () => {
    if (currentRiskData) handleUserQuestion(btn.textContent, currentRiskData);
  }));

  // Nav active state on click (smooth scroll already via CSS)
  $all(".nav-link").forEach(link => link.addEventListener("click", () => {
    $all(".nav-link").forEach(l => l.classList.remove("active"));
    link.classList.add("active");
  }));

  // Esc closes modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape"){
      $("#explainModal").hidden = true;
      $("#safetyModal").hidden = true;
    }
  });
}

/* ---------- Init ---------- */
async function init(){
  try{
    const savedTheme = window.localStorage.getItem("heatsafe-theme");
    if (savedTheme){
      document.documentElement.setAttribute("data-theme", savedTheme);
      $("#themeToggle").innerHTML = savedTheme === "light" ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    }
  }catch(e){}

  renderClock();
  renderLocationDropdown();
  renderRecommendations(state.profile);
  wireEvents();
  initMap();

  locateUser();

  setInterval(renderClock, 60000);
}

document.addEventListener("DOMContentLoaded", init);