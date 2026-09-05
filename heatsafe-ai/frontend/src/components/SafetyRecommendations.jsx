import React, { useState } from "react";
import { SAFETY_RECS } from "../constants.js";

const PROFILES = [
  { key: "student", label: "Student", icon: "fa-graduation-cap" },
  { key: "farmer", label: "Farmer", icon: "fa-tractor" },
  { key: "worker", label: "Outdoor worker", icon: "fa-helmet-safety" },
  { key: "elderly", label: "Elderly", icon: "fa-person-cane" },
  { key: "athlete", label: "Athlete", icon: "fa-person-running" },
  { key: "general", label: "General public", icon: "fa-people-group" },
];

function getThermalClass(temperature) {
  if (temperature === null || temperature === undefined) return "safety--unknown";
  if (temperature < 20) return "safety--cool";
  if (temperature < 30) return "safety--mild";
  if (temperature < 35) return "safety--warm";
  if (temperature < 40) return "safety--hot";
  return "safety--extreme";
}

export default function SafetyRecommendations({ innerRef, temperature }) {
  const [profile, setProfile] = useState("student");
  const rec = SAFETY_RECS[profile];

  return (
    <section className={`section safety-section ${getThermalClass(temperature)}`} id="safety" ref={innerRef}>
      <h2 className="section-title">Who are you?</h2>
      <p className="section-sub">Select your profile to see recommendations tailored to your exposure.</p>

      <div className="profile-row">
        {PROFILES.map((p) => (
          <button
            key={p.key}
            className={`profile-chip ${profile === p.key ? "active" : ""}`}
            onClick={() => setProfile(p.key)}
          >
            <i className={`fa-solid ${p.icon}`}></i> {p.label}
          </button>
        ))}
      </div>

      <div className="card recommend-card">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <i className={`fa-solid ${rec.icon} recommendation-icon`}></i>
          <h3 style={{ margin: 0 }}>{PROFILES.find((p) => p.key === profile).label} safety tips</h3>
        </div>
        <ul className="modal-list">
          {rec.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
