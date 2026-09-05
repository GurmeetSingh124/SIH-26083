import React, { useState, useEffect, useCallback, useRef } from "react";
import Header from "../components/Header.jsx";
import Hero from "../components/Hero.jsx";
import RiskCard from "../components/RiskCard.jsx";
import WeatherGrid from "../components/WeatherGrid.jsx";
import FactorsCard from "../components/FactorsCard.jsx";
import PredictionChart from "../components/PredictionChart.jsx";
import OpenWeatherMap from "../components/OpenWeatherMap.jsx";
import AlertBanner from "../components/AlertBanner.jsx";
import SafetyRecommendations from "../components/SafetyRecommendations.jsx";
import Assistant from "../components/Assistant.jsx";
import WhySection from "../components/WhySection.jsx";
import Footer from "../components/Footer.jsx";
import AuthModal from "../components/AuthModal.jsx";
import MyAreaCard from "../components/MyAreaCard.jsx";
import { useGeolocation } from "../hooks/useGeolocation.js";
import { getCurrentWeather, getRiskPrediction } from "../api/client.js";

export default function Dashboard() {
  const { location, status, setManualLocation, useMyLocation } = useGeolocation();
  const [weather, setWeather] = useState(null);
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);

  const safetyRef = useRef(null);
  const assistantRef = useRef(null);

  const loadData = useCallback(async () => {
    if (location.lat === null || location.lon === null) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [w, r] = await Promise.all([
        getCurrentWeather(location.lat, location.lon, location.label),
        getRiskPrediction(location.lat, location.lon),
      ]);
      setWeather(w);
      setRisk(r);
      setUpdatedAt(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setLoadError(
        "Live data load nahi ho paayi. Backend chal raha hai check karein (uvicorn main:app), aur .env me VITE_API_BASE_URL sahi hai ya nahi."
      );
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function scrollToSafety() {
    safetyRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <Header
        location={location}
        weather={weather}
        risk={risk}
        onLocationChange={setManualLocation}
        onOpenAuth={() => setAuthOpen(true)}
      />

      <main id="dashboard">
        <Hero location={location} weather={weather} updatedAt={updatedAt} onCheckRisk={loadData} />

        {loadError && (
          <section className="section">
            <p className="form-error-banner">
              {loadError}{" "}
              <button className="btn btn-ghost" onClick={loadData} style={{ marginLeft: 8 }}>Retry</button>
            </p>
          </section>
        )}

        {status !== "done" && status !== "idle" && (
          <section className="section">
            <p className="form-error-banner">
              {status === "locating"
                ? "Aapki live GPS location detect ho rahi hai..."
                : "Live GPS location nahi mil paayi. Browser location permission allow karke Retry karein."}
              <button className="btn btn-ghost" onClick={useMyLocation} style={{ marginLeft: 8 }}>Retry GPS</button>
            </p>
          </section>
        )}

        <section className="section" id="riskSection">
          <div className="grid-risk">
            <RiskCard risk={risk} loading={loading} />
            {weather && <WeatherGrid weather={weather} risk={risk} loading={loading} />}
          </div>
        </section>

        {!loading && risk && <FactorsCard risk={risk} loading={loading} />}

        <MyAreaCard />

        <PredictionChart location={location} />

        <section className="section" id="heatmap">
          <div className="card">
            <div className="analysis-head">
              <h2>OpenWeather heat zones</h2>
              <button className="btn btn-primary" onClick={useMyLocation}>
                <i className="fa-solid fa-location-crosshairs"></i> My Location
              </button>
              <span className="legend">
                <span className="dot dot-low"></span> Low
                <span className="dot dot-moderate"></span> Moderate
                <span className="dot dot-high"></span> High
                <span className="dot dot-extreme"></span> Extreme
              </span>
            </div>
            <div style={{ height: 420 }}>
              <OpenWeatherMap location={location} risk={risk} />
            </div>
          </div>
        </section>

        <AlertBanner location={location} onViewSafety={scrollToSafety} />

        <SafetyRecommendations innerRef={safetyRef} temperature={weather?.temperature_c} />

        <Assistant risk={risk} weather={weather} innerRef={assistantRef} />

        <WhySection />
      </main>

      <Footer />

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} defaultLocation={location} />}
    </>
  );
}
