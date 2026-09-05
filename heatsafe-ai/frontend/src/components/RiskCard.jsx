import React from "react";
import { RISK_META } from "../constants.js";

const CIRCUMFERENCE = 2 * Math.PI * 92;

export default function RiskCard({ risk, loading }) {
  const score = risk?.risk_score ?? 0;
  const status = risk?.risk_status ?? "Low";
  const meta = RISK_META[status] || RISK_META.Low;

  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  return (
    <article className="card risk-card">
      <div className="risk-card-head">
        <h2>Current heat risk</h2>
        <span className={`risk-badge ${meta.className}`} style={{ background: `var(${meta.cssVar}-bg, transparent)`, color: `var(${meta.cssVar})` }}>
          {loading ? "…" : meta.label}
        </span>
      </div>

      <div className="risk-gauge-wrap">
        <svg viewBox="0 0 220 220" className="risk-gauge" aria-hidden="true">
          <circle cx="110" cy="110" r="92" className="gauge-track" />
          <circle
            cx="110"
            cy="110"
            r="92"
            className="gauge-fill"
            style={{
              stroke: `var(${meta.cssVar})`,
              strokeDasharray: CIRCUMFERENCE,
              strokeDashoffset: loading ? CIRCUMFERENCE : offset,
              transition: "stroke-dashoffset 0.8s ease, stroke 0.4s ease",
            }}
          />
        </svg>
        <div className="gauge-center">
          <span className="gauge-score">{loading ? "—" : Math.round(score)}</span>
          <span className="gauge-max">/ 100</span>
          <span className="gauge-label">Thermal Stress Score</span>
        </div>
      </div>

      <div className="risk-stats">
        <div className="risk-stat">
          <span className="rs-label">Heatwave probability</span>
          <span className="rs-value">{loading || !risk ? "—" : `${risk.heatwave_probability}%`}</span>
        </div>
        <div className="risk-stat">
          <span className="rs-label">Heat index</span>
          <span className="rs-value">{loading || !risk ? "—" : `${risk.heat_index_c}°C`}</span>
        </div>
        <div className="risk-stat">
          <span className="rs-label">Risk status</span>
          <span className="rs-value">{loading || !risk ? "—" : status}</span>
        </div>
      </div>
    </article>
  );
}
