import React from "react";

function getTemperatureClass(temperature) {
  if (temperature === null || temperature === undefined) return "hero--unknown";
  if (temperature < 20) return "hero--cool";
  if (temperature < 30) return "hero--mild";
  if (temperature < 35) return "hero--warm";
  if (temperature < 40) return "hero--hot";
  return "hero--extreme";
}

export default function Hero({ location, weather, updatedAt, onCheckRisk }) {
  const dateStr = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const temperatureClass = getTemperatureClass(weather?.temperature_c);

  return (
    <section className={`hero ${temperatureClass}`}>
      <div className="hero-haze" aria-hidden="true"></div>
      <div className="hero-inner">
        <div className="hero-copy">
          <h1>Stay safe. Predict heat.<br />Protect lives.</h1>
          <p className="hero-sub">
            AI-powered heatwave and thermal-stress monitoring for smarter, safer communities.
          </p>
          <div className="hero-meta">
            <div><i className="fa-solid fa-location-dot"></i> {location.label}</div>
            <div><i className="fa-regular fa-calendar"></i> {dateStr}</div>
            <div><i className="fa-regular fa-clock"></i> Last updated {updatedAt || "—"}</div>
            {weather && <div><i className="fa-solid fa-temperature-half"></i> {weather.temperature_c}°C</div>}
          </div>
          <button className="btn btn-primary" onClick={onCheckRisk}>
            Check heat risk <i className="fa-solid fa-arrow-right-long"></i>
          </button>
        </div>
      </div>
    </section>
  );
}
