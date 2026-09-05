# HeatSafe AI

HeatSafe AI is a full-stack application for monitoring heatwave and thermal
stress risk. It combines live weather data, an ML-based risk engine, maps,
forecasts, safety recommendations, user accounts, and an optional AI assistant.

The project has two parts:

```text
heatsafe-ai/
├── backend/   FastAPI API, weather services, risk prediction, authentication
└── frontend/  React + Vite dashboard
```

## Requirements

- Python 3.10 or newer
- Node.js 18 or newer and npm
- MongoDB, either local or MongoDB Atlas
- Internet access for live weather data

## Quick Start on Windows

Open two terminals in the `heatsafe-ai` folder.

### 1. Configure the backend

In the first terminal:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Open `backend/.env` and check these settings:

```env
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=heatsafe_ai
JWT_SECRET_KEY=replace-this-with-a-long-random-secret
```

Use a MongoDB Atlas connection string instead of the local URL if MongoDB is
not installed on your computer. `GEMINI_API_KEY` is optional; add it only if
you want to use the AI assistant. Open-Meteo weather data does not require an
API key.

### 2. Start the backend

Keep the virtual environment active and run:

```powershell
uvicorn main:app --reload
```

The API is available at `http://127.0.0.1:8000`.
Open `http://127.0.0.1:8000/docs` to view and test the API documentation.

### 3. Install and start the frontend

In the second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

The frontend already uses `http://127.0.0.1:8000/api` as its backend URL. To
use a different backend, create `frontend/.env` with:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

## macOS or Linux

Use the same steps, replacing the Windows virtual-environment commands with:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```

In another terminal, start the frontend with:

```bash
cd frontend
npm install
npm run dev
```

## What the dashboard provides

- Live weather from Open-Meteo
- Heat-risk predictions with Green, Yellow, Orange, and Red levels
- Risk forecasts and heat-zone map data
- Location search and browser geolocation
- User registration, login, and saved locations
- Safety recommendations and alerts
- Optional Gemini-powered assistant

## Common problems

### MongoDB connection error

Start local MongoDB, or replace `MONGODB_URL` in `backend/.env` with a MongoDB
Atlas connection string. Make sure the Atlas network access settings allow your
current IP address.

### Frontend cannot reach the backend

Confirm that the backend terminal is still running and that the frontend is
using `http://127.0.0.1:8000/api` in `VITE_API_BASE_URL`.

### PowerShell blocks activation

Run PowerShell as your normal user and execute this once, then retry activation:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## Production build

Create the frontend production files with:

```bash
cd frontend
npm run build
```

The output is written to `frontend/dist`. For deployment, configure the
backend environment variables on the server and set `VITE_API_BASE_URL` to the
deployed backend API URL before building the frontend.
