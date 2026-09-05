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
  if (!risk) return "Data is still loading. Please ask again in a moment.";
  const q = question.toLowerCase();
  const level = risk.risk_status;

  if (q.includes("safe") || q.includes("outside")) {
    if (level === "Extreme" || level === "High") {
      return `The current risk is ${level} (score ${risk.risk_score}/100). Avoid going outside, especially between 12 PM and 4 PM.`;
    }
    return `The risk is ${level}. You can go outside with caution, but carry water with you.`;
  }

  if (q.includes("today") || q.includes("risk")) {
    return `Today's heat risk is ${level} (score: ${risk.risk_score}/100, temperature: ${weather?.temperature_c ?? "—"}°C, heatwave probability: ${risk.heatwave_probability}%).`;
  }

  if (q.includes("avoid") || q.includes("stress")) {
    return `${risk.recommended_action} Also, stay hydrated, wear light-coloured clothing, and avoid direct sunlight.`;
  }

  if (q.includes("exercise")) {
    if (level === "Extreme" || level === "High") {
      return "Avoid outdoor exercise for now. Try early morning or late evening when temperatures are lower.";
    }
    return "Yes, light exercise should be fine, but remember to stay hydrated.";
  }

  if (q.includes("why") || q.includes("high")) {
    return risk.top_reasons.join(". ") + ".";
  }

  return `The current risk level is ${level} (${risk.risk_score}/100). Ask me anything else!`;
}

export default function Assistant({ risk, weather, innerRef }) {
  const [messages, setMessages] = useState([
    { who: "bot", text: "Hello! Ask me anything about today's heat conditions." },
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
