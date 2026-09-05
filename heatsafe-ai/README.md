# HeatSafe AI — Heatwave & Thermal Stress Prediction (SIH26083)

Full-stack upgrade: **React frontend** + **FastAPI backend** + tumhara **ML model
(heat_risk_model.pkl)** connected + **live weather-based heat-zone map** +
**MongoDB user login** jisse har user apni location ke hisaab se apne area ka
heat-stress dekh sake.

```
heatsafe-ai/
├── backend/     → FastAPI (ML model, live weather, MongoDB auth)
└── frontend/    → React + Vite (dashboard, map, chat assistant)
```

---

## 1. Kaunsi API key kaha lagani hai (SABSE IMPORTANT)

### Weather API — koi key NAHI chahiye ✅
Ye project **Open-Meteo** use karta hai jo bilkul FREE hai (non-commercial use ke
liye) aur bina kisi API key ke live temperature, humidity, wind speed aur
**solar radiation** deta hai (jo free OpenWeatherMap tier me nahi milta). Isliye
project turant live data ke saath chalega — kahi bhi key daalne ki zarurat nahi.

Agar future me tum OpenWeatherMap jaisi paid service (push alerts, SMS, etc. ke
liye) add karna chaho, to uski key yaha daalna:
`backend/.env` → `WEATHER_API_KEY=` (abhi khaali chhod sakte ho)

### MongoDB — `backend/.env` me
```
MONGODB_URL=mongodb://localhost:27017          # local MongoDB
# ya MongoDB Atlas (free cloud DB) ka connection string:
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net
MONGODB_DB_NAME=heatsafe_ai
```
MongoDB Atlas free banane ke liye: https://www.mongodb.com/cloud/atlas/register
banane ke baad "Connect" → "Drivers" → connection string copy karke yaha paste karo.

### JWT secret — `backend/.env` me
```
JWT_SECRET_KEY=koi_bhi_lamba_random_string_daal_do
```

**Bas itna hi.** `backend/.env.example` file copy karke `.env` banao, upar wali
2 cheezein (Mongo URL + JWT secret) bhar do, project ready hai.

---

## 2. Backend chalana

```bash
cd backend
python -m venv venv
venv\Scripts\Activate.ps1        # Windows
# source venv/bin/activate       # Mac/Linux

pip install -r requirements.txt
copy .env.example .env           # Windows: copy | Mac/Linux: cp
# ab .env file khol kar MONGODB_URL aur JWT_SECRET_KEY bhar do

uvicorn main:app --reload
```

Backend chalega: `http://127.0.0.1:8000`
Swagger docs (sab APIs test karne ke liye): `http://127.0.0.1:8000/docs`

**MongoDB local nahi hai?** Sabse aasan: MongoDB Atlas (free) use karo (upar
step dekho), ya `docker run -d -p 27017:27017 mongo` se local Mongo chala do.

---

## 3. Frontend chalana

```bash
cd frontend
npm install
copy .env.example .env           # Windows | cp .env.example .env (Mac/Linux)
npm run dev
```

Browser me kholo: `http://localhost:5173`

Production build ke liye: `npm run build` (Vercel/Netlify pe seedha deploy ho jaata hai).

---

## 4. Kya-kya kaam karta hai

| Feature | Kaise |
|---|---|
| **Live weather** | Open-Meteo API, koi key nahi chahiye |
| **ML model prediction** | Tumhara `heat_risk_model.pkl` seedha connect hai (`backend/app/ml/model.py`) - RandomForest model temperature/humidity/wind/solar-radiation dekh kar Green/Yellow/Orange/Red predict karta hai |
| **Heat-zone map** | Location ke around 5×5 grid banata hai, har point ki live weather + ML prediction leta hai, map par colored circles dikhata hai |
| **24/48/72h prediction chart** | Live hourly forecast + ML model se |
| **User login (MongoDB)** | Register/Login, JWT token, password bcrypt se hashed |
| **My Area heat-risk** | Login karke apni location save karo, dashboard par apne area ka live heat-stress dikhega (`/api/users/me/heat-risk`) |
| **AI Assistant chat** | Live risk data ke basis par tumhare sawalon ke jawab deta hai |

---

## 5. Model ke baare me (jo maine notebook se confirm kiya)

- Model: `RandomForestClassifier` (scikit-learn 1.7.2, 150 trees)
- Input features (isi order me): `temperature_c, humidity_pct, wind_speed_kmh, solar_radiation_w_m2`
- Output: `Green` (Low) / `Yellow` (Moderate) / `Orange` (High) / `Red` (Extreme)
- Backend isko heat-index formula ke saath combine karke ek accurate, explainable
  result deta hai (score, confidence %, reasons, recommended action) — sab
  `/api/risk/predict` ya `/api/risk/predict-manual` (Swagger docs) me test kar sakte ho.

---

## 6. Agla step (deployment)

- **Frontend**: Vercel/Netlify pe `npm run build` ka `dist/` folder deploy karo
- **Backend**: Render/Railway pe deploy karo, `.env` variables wahan ke dashboard
  me set karo (MONGODB_URL, JWT_SECRET_KEY)
- Deploy ke baad `frontend/.env` me `VITE_API_BASE_URL` ko apne live backend URL
  se update karna mat bhoolna.
