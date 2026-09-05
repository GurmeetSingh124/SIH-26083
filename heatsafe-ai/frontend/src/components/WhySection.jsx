import React from "react";

export default function WhySection() {
  return (
    <section className="section">
      <h2 className="section-title">Why HeatSafe AI?</h2>
      <div className="why-grid">
        <article className="card why-card">
          <i className="fa-solid fa-brain"></i>
          <h3>Predict</h3>
          <p>AI predicts upcoming heatwave and thermal stress before conditions become dangerous.</p>
        </article>
        <article className="card why-card">
          <i className="fa-solid fa-shield-heart"></i>
          <h3>Protect</h3>
          <p>Personalized recommendations help students, farmers, workers and the elderly stay safe.</p>
        </article>
        <article className="card why-card">
          <i className="fa-solid fa-bell"></i>
          <h3>Alert</h3>
          <p>Early warnings deliver actionable information before extreme heat peaks arrive.</p>
        </article>
      </div>

      <div className="flow-diagram" aria-hidden="true">
        <span>Live weather</span>
        <i className="fa-solid fa-arrow-right"></i>
        <span>ML model</span>
        <i className="fa-solid fa-arrow-right"></i>
        <span>Risk prediction</span>
        <i className="fa-solid fa-arrow-right"></i>
        <span>Early warning</span>
        <i className="fa-solid fa-arrow-right"></i>
        <span>Action</span>
      </div>
    </section>
  );
}
