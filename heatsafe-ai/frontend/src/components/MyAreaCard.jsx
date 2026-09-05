import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getMyAreaHeatRisk } from "../api/client.js";

export default function MyAreaCard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getMyAreaHeatRisk();
      setData(res);
    } catch (err) {
      setError(err?.response?.data?.detail || "Area heat-risk load nahi ho paaya.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (!user) return null;

  return (
    <section className="section">
      <div className="card">
        <div className="analysis-head">
          <h2>
            <i className="fa-solid fa-house-chimney" style={{ marginRight: 8 }}></i>
            My area's heat stress
          </h2>
          <button className="btn btn-ghost" onClick={load} disabled={loading}>
            <i className="fa-solid fa-rotate"></i> Refresh
          </button>
        </div>

        {loading && <p style={{ color: "var(--text-muted)" }}>Loading…</p>}
        {error && <p className="form-error-banner">{error}</p>}

        {data && !loading && (
          <div className="risk-stats" style={{ marginTop: 4 }}>
            <div className="risk-stat">
              <span className="rs-label">{data.location.label}</span>
              <span className="rs-value">{data.risk.risk_status}</span>
            </div>
            <div className="risk-stat">
              <span className="rs-label">Temperature</span>
              <span className="rs-value">{data.weather.temperature_c}°C</span>
            </div>
            <div className="risk-stat">
              <span className="rs-label">Score</span>
              <span className="rs-value">{data.risk.risk_score}/100</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
