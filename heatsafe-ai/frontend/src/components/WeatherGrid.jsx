import React from "react";

export default function WeatherGrid({ weather, risk, loading }) {
  const feelsLike = risk?.heat_index_c;

  return (
    <div className="weather-grid">
      <article className="card weather-card">
        <i className="fa-solid fa-temperature-three-quarters w-icon"></i>
        <span className="w-value">{loading ? "—" : `${weather.temperature_c}°C`}</span>
        <span className="w-sub">{loading ? "Feels like —" : `Feels like ${feelsLike}°C`}</span>
      </article>
      <article className="card weather-card">
        <i className="fa-solid fa-droplet w-icon"></i>
        <span className="w-value">{loading ? "—" : `${weather.humidity_pct}%`}</span>
        <span className="w-sub">Relative humidity</span>
      </article>
      <article className="card weather-card">
        <i className="fa-solid fa-wind w-icon"></i>
        <span className="w-value">{loading ? "—" : `${weather.wind_speed_kmh} km/h`}</span>
        <span className="w-sub">Cooling effect</span>
      </article>
      <article className="card weather-card">
        <i className="fa-solid fa-sun w-icon"></i>
        <span className="w-value">{loading ? "—" : `${Math.round(weather.solar_radiation_w_m2)} W/m²`}</span>
        <span className="w-sub">Solar radiation</span>
      </article>
      <article className="card weather-card">
        <i className="fa-solid fa-water w-icon"></i>
        <span className="w-value">{loading ? "—" : `${weather.dew_point_c ?? "—"}°C`}</span>
        <span className="w-sub">Dew point</span>
      </article>
      <article className="card weather-card">
        <i className="fa-solid fa-cloud-rain w-icon"></i>
        <span className="w-value">{loading ? "—" : `${weather.rainfall_mm ?? 0} mm`}</span>
        <span className="w-sub">Rainfall</span>
      </article>
    </div>
  );
}
