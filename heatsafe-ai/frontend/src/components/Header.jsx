import React, { useState } from "react";
import { searchLocation } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Header({ location, weather, risk, onLocationChange, onOpenAuth }) {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  async function handleSearch(e) {
    const value = e.target.value;
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    try {
      const data = await searchLocation(value);
      setResults(data);
    } catch {
      setResults([]);
    }
  }

  function pick(r) {
    onLocationChange(r.label, r.lat, r.lon);
    setDropdownOpen(false);
    setQuery("");
    setResults([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;

    if (results.length > 0) {
      pick(results[0]);
      return;
    }

    try {
      const data = await searchLocation(query.trim());
      if (data.length > 0) pick(data[0]);
    } catch {
      setResults([]);
    }
  }

  function getTemperatureClass(temperature) {
    if (temperature === null || temperature === undefined) return "mode-strip--unknown";
    if (temperature < 20) return "mode-strip--cool";
    if (temperature < 30) return "mode-strip--mild";
    if (temperature < 35) return "mode-strip--warm";
    if (temperature < 40) return "mode-strip--hot";
    return "mode-strip--extreme";
  }

  const situation = weather && risk
    ? `Thermal risk: ${risk.risk_status} · Temperature: ${weather.temperature_c}°C`
    : "Thermal risk aur temperature load ho raha hai...";

  return (
    <header className="site-header">
      <div className="header-inner">
        <a href="#dashboard" className="brand">
          <span className="brand-mark">🔥</span>
          <span className="brand-text">
            <strong>HeatSafe AI</strong>
            <small>Heatwave &amp; Thermal Stress Prediction</small>
          </span>
        </a>

        <nav className="main-nav">
          <a href="#dashboard" className="nav-link active">Dashboard</a>
          <a href="#prediction" className="nav-link">Prediction</a>
          <a href="#heatmap" className="nav-link">Heat Map</a>
          <a href="#alerts" className="nav-link">Alerts</a>
          <a href="#safety" className="nav-link">Safety</a>
          <a href="#assistant" className="nav-link">AI Assistant</a>
        </nav>

        <div className="header-actions">
          <div style={{ position: "relative" }}>
            <button
              className="location-pill"
              onClick={() => setDropdownOpen((v) => !v)}
              aria-haspopup="listbox"
            >
              <i className="fa-solid fa-location-dot"></i>
              <span>{location.label}</span>
              <i className="fa-solid fa-chevron-down chev"></i>
            </button>
            {dropdownOpen && (
              <ul className="location-dropdown" role="listbox" style={{ display: "block" }}>
                <li style={{ padding: "8px 10px" }}>
                  <form onSubmit={handleSubmit}>
                    <input
                      type="search"
                      value={query}
                      onChange={handleSearch}
                      placeholder="Location search karein..."
                      style={{
                        width: "100%",
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        padding: "8px",
                        color: "var(--text)",
                      }}
                      autoFocus
                    />
                  </form>
                </li>
                {results.map((r, i) => (
                  <li key={i}>
                    <button onClick={() => pick(r)}>{r.label}</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {user ? (
            <div className="user-pill">
              <span className="avatar-circle">{user.name?.[0]?.toUpperCase() || "U"}</span>
              <span>{user.name}</span>
              <button onClick={logout} title="Logout">
                <i className="fa-solid fa-right-from-bracket"></i>
              </button>
            </div>
          ) : (
            <button className="btn btn-ghost" onClick={onOpenAuth}>
              <i className="fa-solid fa-user"></i> Login
            </button>
          )}
        </div>
      </div>

      <div className={`mode-strip ${getTemperatureClass(weather?.temperature_c)}`}>
        <div className="mode-marquee" aria-label={situation}>
          <div className="mode-track">
            <span className="mode-tag"><i className="fa-solid fa-satellite-dish"></i>{situation}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
