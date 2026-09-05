import React, { useState, useRef, useEffect } from "react";
import { askAssistant } from "../api/client.js";

const QUICK_QUESTIONS = [
  "Is it safe to go outside?",
  "What is today's heat risk?",
  "How can I avoid heat stress?",
  "Can I exercise today?",
  "Why is the risk so high?",
];

function buildReply(question, risk, weather) {
  if (!risk) return "Data abhi load ho raha hai, thodi der me phir se poochein.";
  const q = question.toLowerCase();
  const level = risk.risk_status;

  if (q.includes("safe") || q.includes("outside")) {
    if (level === "Extreme" || level === "High") {
      return `Abhi ${level} risk hai (score ${risk.risk_score}/100). Bahar jaana avoid karein, especially 12 PM se 4 PM ke beech.`;
    }
    return `Risk ${level} hai, savdhani ke saath bahar ja sakte hain - paani saath rakhein.`;
  }

  if (q.includes("today") || q.includes("risk")) {
    return `Aaj ka heat risk ${level} hai (score: ${risk.risk_score}/100, temperature: ${weather?.temperature_c ?? "—"}°C, heatwave probability: ${risk.heatwave_probability}%).`;
  }

  if (q.includes("avoid") || q.includes("stress")) {
    return `${risk.recommended_action} Iske alawa: hydrated rahein, halke rang ke kapde pehnein, aur direct dhoop se bachein.`;
  }

  if (q.includes("exercise")) {
    if (level === "Extreme" || level === "High") {
      return "Abhi outdoor exercise avoid karein - subah jaldi ya shaam der se try karein jab temperature kam ho.";
    }
    return "Haan, halka exercise kar sakte hain, bas hydration ka dhyan rakhein.";
  }

  if (q.includes("why") || q.includes("high")) {
    return risk.top_reasons.join(". ") + ".";
  }

  return `Risk level abhi ${level} hai (${risk.risk_score}/100). Kuch aur poochna ho to batayein!`;
}

export default function Assistant({ risk, weather, innerRef }) {
  const [messages, setMessages] = useState([
    { who: "bot", text: "Namaste! Mujhse aaj ke heat conditions ke baare me kuch bhi poochein." },
  ]);
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);
  const windowRef = useRef(null);

  useEffect(() => {
    if (windowRef.current) {
      windowRef.current.scrollTop = windowRef.current.scrollHeight;
    }
  }, [messages]);

  async function ask(question) {
    if (!question.trim()) return;
    setMessages((m) => [...m, { who: "user", text: question }]);
    setAsking(true);
    try {
      const data = await askAssistant(question, risk, weather);
      setMessages((m) => [...m, { who: "bot", text: data.reply }]);
    } catch {
      setMessages((m) => [...m, { who: "bot", text: buildReply(question, risk, weather) }]);
    } finally {
      setAsking(false);
    }
    setInput("");
  }

  return (
    <section className="section" id="assistant" ref={innerRef}>
      <div className="card assistant-card">
        <div className="assistant-head">
          <span className="assistant-avatar">🤖</span>
          <div>
            <h2>HeatSafe AI Assistant</h2>
            <p>Ask me about today's heat conditions</p>
          </div>
        </div>

        <div className="quick-questions">
          {QUICK_QUESTIONS.map((q) => (
            <button key={q} onClick={() => ask(q)}>{q}</button>
          ))}
        </div>

        <div className="chat-window" ref={windowRef} aria-live="polite">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`chat-msg chat-${m.who}`}
              style={{
                margin: "8px 0",
                padding: "10px 14px",
                borderRadius: "12px",
                maxWidth: "80%",
                background: m.who === "user" ? "var(--accent-glow)" : "var(--surface-2)",
                marginLeft: m.who === "user" ? "auto" : 0,
              }}
            >
              {m.text}
            </div>
          ))}
        </div>

        <form
          className="chat-input-row"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <label htmlFor="chatInput" className="sr-only">Type your question</label>
          <input
            id="chatInput"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            autoComplete="off"
          />
          <button type="submit" className="btn btn-primary" aria-label="Send" disabled={asking}>
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </form>
      </div>
    </section>
  );
}
