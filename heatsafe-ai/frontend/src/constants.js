// Backend risk_status ("Low" | "Moderate" | "High" | "Extreme") ko
// UI colors/classes se map karta hai.
export const RISK_META = {
  Low: { label: "Low", cssVar: "--risk-low", className: "risk-low" },
  Moderate: { label: "Moderate", cssVar: "--risk-moderate", className: "risk-moderate" },
  High: { label: "High", cssVar: "--risk-high", className: "risk-high" },
  Extreme: { label: "Extreme", cssVar: "--risk-extreme", className: "risk-extreme" },
};

// risk_level (Green/Yellow/Orange/Red - model ka raw output) ko status se map karna,
// map ke colored dots ke liye use hota hai.
export const RISK_LEVEL_TO_STATUS = {
  Green: "Low",
  Yellow: "Moderate",
  Orange: "High",
  Red: "Extreme",
};

export const SAFETY_RECS = {
  student: {
    icon: "fa-graduation-cap",
    items: [
      "Avoid outdoor sports during peak heat (12 PM – 4 PM)",
      "Carry a water bottle and stay hydrated between classes",
      "Prefer morning or evening hours for outdoor activity",
      "Watch for dizziness or headache and tell a teacher immediately",
    ],
  },
  farmer: {
    icon: "fa-tractor",
    items: [
      "Shift field work to early morning or evening hours",
      "Take frequent shaded breaks every 45–60 minutes",
      "Carry drinking water and oral rehydration salts to the field",
      "Use shade, a hat, or light cotton clothing whenever possible",
    ],
  },
  worker: {
    icon: "fa-helmet-safety",
    items: [
      "Take regular cooling breaks in shade or air conditioning",
      "Stay hydrated — drink water every 20–30 minutes",
      "Reduce prolonged direct sunlight exposure where possible",
      "Watch coworkers for signs of heat exhaustion",
    ],
  },
  elderly: {
    icon: "fa-person-cane",
    items: [
      "Stay in a cool, well-ventilated environment during peak hours",
      "Maintain steady hydration even without feeling thirsty",
      "Avoid going outdoors between 12 PM and 4 PM",
      "Keep emergency contacts and medication easily accessible",
    ],
  },
  athlete: {
    icon: "fa-person-running",
    items: [
      "Reduce training intensity and duration during extreme heat",
      "Train during cooler early-morning or late-evening hours",
      "Hydrate before, during, and after activity",
      "Stop immediately if you feel cramping, nausea, or dizziness",
    ],
  },
  general: {
    icon: "fa-people-group",
    items: [
      "Limit outdoor exposure during peak afternoon hours",
      "Drink water regularly throughout the day",
      "Check on elderly neighbours and young children",
      "Wear light-coloured, loose-fitting clothing outdoors",
    ],
  },
};
