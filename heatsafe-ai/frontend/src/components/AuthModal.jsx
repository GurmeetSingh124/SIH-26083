import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthModal({ onClose, defaultLocation }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login"); // login | register
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    profile_type: "general",
  });
  const [useLocation, setUseLocation] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register({
          name: form.name,
          email: form.email,
          password: form.password,
          profile_type: form.profile_type,
          location: useLocation
            ? { label: defaultLocation.label, lat: defaultLocation.lat, lon: defaultLocation.lon }
            : null,
        });
      }
      onClose();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(detail || "Kuch galat ho gaya, dobara try karein.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3>{mode === "login" ? "Login to HeatSafe AI" : "Create your account"}</h3>

        {error && <p className="form-error-banner">{error}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label>
              Full name
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Gurmeet Singh"
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Kam se kam 6 characters"
            />
          </label>

          {mode === "register" && (
            <>
              <label>
                Aap kaun hain?
                <select value={form.profile_type} onChange={(e) => update("profile_type", e.target.value)}>
                  <option value="student">Student</option>
                  <option value="farmer">Farmer</option>
                  <option value="worker">Outdoor worker</option>
                  <option value="elderly">Elderly</option>
                  <option value="athlete">Athlete</option>
                  <option value="general">General public</option>
                </select>
              </label>

              <label style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  checked={useLocation}
                  onChange={(e) => setUseLocation(e.target.checked)}
                  style={{ width: "auto" }}
                />
                Apni current location ({defaultLocation.label}) ko area heat-risk ke liye save karein
              </label>
            </>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <span className="inline-spinner"></span> : mode === "login" ? "Login" : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login" ? (
            <>Naya account nahi hai? <button onClick={() => setMode("register")}>Register karein</button></>
          ) : (
            <>Pehle se account hai? <button onClick={() => setMode("login")}>Login karein</button></>
          )}
        </p>
      </div>
    </div>
  );
}
