import React, { useState, useEffect, useCallback } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { getForecast } from "../api/client.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const RANGE_OPTIONS = [24, 48, 72];

export default function PredictionChart({ location }) {
  const [hours, setHours] = useState(24);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!location || location.lat === null || location.lon === null) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getForecast(location.lat, location.lon, hours, location.label);
      setForecast(data);
    } catch {
      setError("Forecast load nahi ho paaya. Backend chal raha hai check karein.");
    } finally {
      setLoading(false);
    }
  }, [location, hours]);

  useEffect(() => {
    load();
  }, [load]);

  const chartData = forecast
    ? {
        labels: forecast.points.map((p) =>
          new Date(p.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", hour12: true })
        ),
        datasets: [
          {
            label: "Thermal stress score",
            data: forecast.points.map((p) => p.risk_score),
            borderColor: "#FFD166",
            backgroundColor: "rgba(255, 209, 102, 0.18)",
            fill: true,
            tension: 0.35,
            borderWidth: 3,
            pointRadius: 2,
            pointHoverRadius: 5,
            pointBackgroundColor: "#FFD166",
            pointBorderColor: "#172024",
            pointBorderWidth: 1,
          },
          {
            label: "Temperature (°C)",
            data: forecast.points.map((p) => p.temperature_c),
            borderColor: "#2FC6B7",
            borderDash: [4, 4],
            backgroundColor: "transparent",
            fill: false,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 1,
            pointHoverRadius: 4,
            pointBackgroundColor: "#2FC6B7",
            yAxisID: "y1",
          },
          {
            label: "Humidity (%)",
            data: forecast.points.map((p) => p.humidity_pct),
            borderColor: "#7DD3FC",
            borderDash: [2, 5],
            backgroundColor: "transparent",
            fill: false,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 1,
            pointHoverRadius: 4,
            pointBackgroundColor: "#7DD3FC",
            yAxisID: "y2",
          },
        ],
      }
    : null;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        labels: {
          color: "#ECEFEE",
          usePointStyle: true,
          padding: 18,
        },
      },
    },
    scales: {
      x: { ticks: { color: "#647274", maxTicksLimit: 10 }, grid: { color: "rgba(255,255,255,0.04)" } },
      y: { ticks: { color: "#647274" }, grid: { color: "rgba(255,255,255,0.04)" }, min: 0, max: 100 },
      y1: {
        position: "right",
        ticks: { color: "#2FC6B7" },
        grid: { drawOnChartArea: false },
      },
      y2: {
        position: "right",
        offset: true,
        min: 0,
        max: 100,
        ticks: { color: "#7DD3FC" },
        grid: { drawOnChartArea: false },
      },
    },
  };

  return (
    <section className="section" id="prediction">
      <div className="card">
        <div className="analysis-head">
          <h2>Heatwave prediction</h2>
          <div className="range-toggle" role="tablist">
            {RANGE_OPTIONS.map((h) => (
              <button
                key={h}
                className={`range-btn ${hours === h ? "active" : ""}`}
                onClick={() => setHours(h)}
                role="tab"
              >
                {h} hours
              </button>
            ))}
          </div>
        </div>
        <div className="chart-wrap" style={{ height: 280 }}>
          {!location || location.lat === null ? (
            <p style={{ color: "var(--text-muted)" }}>Live GPS location ka wait ho raha hai...</p>
          ) : loading ? <p style={{ color: "var(--text-muted)" }}>Loading forecast…</p> : null}
          {error && <p className="form-error-banner">{error}</p>}
          {!loading && !error && chartData && <Line data={chartData} options={options} />}
        </div>
      </div>
    </section>
  );
}
