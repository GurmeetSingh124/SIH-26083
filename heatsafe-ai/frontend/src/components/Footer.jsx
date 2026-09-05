import React from "react";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="brand-mark">🔥</span>
          <div>
            <strong>HeatSafe AI</strong>
            <p>AI-powered heatwave &amp; thermal stress prediction and early-warning system.</p>
          </div>
        </div>
        <nav className="footer-links">
          <a href="#dashboard">Dashboard</a>
          <a href="#prediction">Prediction</a>
          <a href="#heatmap">Heat Map</a>
          <a href="#safety">Safety</a>
          <a href="#assistant">AI Assistant</a>
        </nav>
      </div>
    </footer>
  );
}
