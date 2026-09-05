import React, { useState } from "react";

export default function FactorsCard({ risk, loading }) {
  const [showExplain, setShowExplain] = useState(false);

  return (
    <section className="section">
      <div className="card analysis-card">
        <div className="analysis-head">
          <h2>Thermal stress factors</h2>
          <button className="btn btn-ghost" onClick={() => setShowExplain(true)} disabled={loading}>
            <i className="fa-solid fa-circle-info"></i> Explain prediction
          </button>
        </div>

        <div className="factor-list">
          {loading ? (
            <p style={{ color: "var(--text-muted)" }}>Loading…</p>
          ) : (
            risk.top_reasons.map((reason, i) => (
              <div key={i} className="factor-row" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <i className="fa-solid fa-circle-exclamation" style={{ color: "var(--risk-high)" }}></i>
                <span>{reason}</span>
              </div>
            ))
          )}
        </div>

        <div className="analysis-score">
          Overall thermal stress score: <strong>{loading ? "—" : risk.risk_score}</strong>
        </div>
      </div>

      {showExplain && !loading && (
        <div className="modal-overlay" onClick={() => setShowExplain(false)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowExplain(false)}>&times;</button>
            <h3>Why is this prediction {risk.risk_status.toLowerCase()}?</h3>
            <p>
              Hamara RandomForest ML model tumhari live temperature, humidity, wind speed aur solar
              radiation ko dekh kar <strong>{risk.model_confidence}%</strong> confidence ke saath yeh
              prediction deta hai.
            </p>
            <ul className="modal-list">
              {risk.top_reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
            <p><strong>Suggested action:</strong> {risk.recommended_action}</p>
          </div>
        </div>
      )}
    </section>
  );
}
