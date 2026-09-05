import React, { useState, useEffect, useCallback } from "react";
import { getCurrentAlert } from "../api/client.js";

export default function AlertBanner({ location, onViewSafety }) {
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!location || location.lat === null || location.lon === null) return;
    setLoading(true);
    try {
      const data = await getCurrentAlert(location.lat, location.lon, location.label);
      setAlert(data);
    } catch {
      setAlert(null);
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <section className="section" id="alerts">
        <article className="alert-banner">
          <div className="alert-body"><p style={{ color: "var(--text-muted)" }}>Alert check ho raha hai…</p></div>
        </article>
      </section>
    );
  }

  if (!alert) return null;

  return (
    <section className="section" id="alerts">
      <article className="alert-banner">
        <div className="alert-icon">
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>
        <div className="alert-body">
          <h2>{alert.title}</h2>
          <p>{alert.message}</p>
          <div className="alert-meta">
            <span>Heatwave probability: <strong>{alert.heatwave_probability}%</strong></span>
            <span>Peak risk: <strong>{alert.peak_window}</strong></span>
          </div>
        </div>
        <button className="btn btn-light" onClick={onViewSafety}>View safety instructions</button>
      </article>
    </section>
  );
}
