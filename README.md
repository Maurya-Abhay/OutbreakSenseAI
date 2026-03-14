# OutbreakSense AI

Production-focused health-tech platform for multi-disease outbreak surveillance, citizen reporting, AI risk prediction, and realtime alerts.

## Project Overview

This monorepo provides a complete outbreak intelligence system with:

- Admin web dashboard for monitoring, verification, analytics, and exports
- Citizen web portal for risk checks, report submission, maps, and guidance
- Citizen app (NH-S19-App, Expo React Native) with geolocation and notifications
- AI prediction service (FastAPI + scikit-learn)
- Secure Node.js backend (Express + MongoDB + Socket.IO)

The platform is optimized for hackathon demos and can be adapted for real-world public health workflows.

## Features

### Citizen Platform (Web + NH-S19-App)

- Current risk prediction by location and weather inputs
- GPS-enabled disease report submission
- Risk heatmap visualization
- Weekly risk trends and local forecast view
- Report history by user email
- Prevention tips and alert subscriptions
- Offline-friendly cached data fallback
- Realtime alerts and report stream updates

### Admin Dashboard (Web Only)

- Secure JWT login for admins
- Realtime dashboard with map, trends, alerts, and report feed
- Report verification workflow
- Filtered report listing and analytics widgets
- CSV and PDF export
- Dark mode, responsive design, and motion-enhanced UI

### AI System

- Feature inputs: latitude, longitude, temperature, rainfall, humidity, past cases, disease type
- Model: Random Forest (default), optional XGBoost path
- Outputs:
  - risk_score
  - risk_level
  - explainability top_factors
- Batch prediction endpoint for heatmap workloads
- Fallback inference path if AI service is unreachable

## Technology Stack

- Backend: Node.js, Express, Mongoose, Socket.IO, JWT, Helmet, rate limiting
- Database: MongoDB
- AI: Python, FastAPI, scikit-learn, pandas, numpy
- Web: React, Vite, Tailwind CSS, Framer Motion, Recharts, Leaflet
- App (NH-S19-App): Expo React Native, React Navigation, Reanimated, Maps, Notifications

## Architecture

```text
Citizen Web/NH-S19-App  --->  Backend API (Express)  --->  MongoDB
        |                        |
        |                        +--> AI Engine (FastAPI)
        |
        +----Socket.IO realtime--+

Admin Web  -------> Backend API + Socket.IO (admin-scoped events)
```

## Improved Project Structure

```text
backend/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    services/
    utils/

web/
  src/
    api/
    components/
    context/
    hooks/
    layouts/
    pages/
  public/

NH-S19-App/
  src/
    api/
    components/
    context/
    hooks/
    navigation/
    screens/
    theme/
    utils/

ai-engine/
  app/
  data/
  model/
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB (local or hosted)

### 2. Install Dependencies

From root:

```bash
npm install
```

From ai-engine:

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Files

Create these files from examples:

- backend/.env from backend/.env.example
- web/.env from web/.env.example
- ai-engine/.env from ai-engine/.env.example

## Environment Variables

### Backend (.env)

- PORT=5050
- MONGO_URI=mongodb://127.0.0.1:27017/nhs19
- JWT_SECRET=your-long-secure-secret
- JWT_EXPIRES_IN=1d
- AI_ENGINE_URL=http://127.0.0.1:8001
- CORS_ORIGIN=http://localhost:5173,http://localhost:8081
- SOCKET_CORS_ORIGIN=http://localhost:5173,http://localhost:8081
- BODY_LIMIT=1mb
- RATE_LIMIT_WINDOW_MS=60000
- RATE_LIMIT_MAX=120
- AUTH_RATE_LIMIT_MAX=12
- TRUST_PROXY=false
- SEED_DEFAULT_ADMIN=true
- DEFAULT_ADMIN_EMAIL=admin@nhs19.local
- DEFAULT_ADMIN_PASSWORD=Admin@123

### Web (.env)

- VITE_API_BASE_URL=http://localhost:5050/api
- VITE_SOCKET_URL=http://localhost:5050

### NH-S19-App (.env)

- EXPO_PUBLIC_API_BASE_URL=http://YOUR_LOCAL_IP:5050/api
- EXPO_PUBLIC_SOCKET_URL=http://YOUR_LOCAL_IP:5050
- EXPO_PUBLIC_BACKEND_API=
- EXPO_PUBLIC_BACKEND_SOCKET=

### AI Engine (.env)

- PORT=8001
- MODEL_TYPE=random_forest
- MODEL_PATH=model/risk_model.joblib
- DATASET_PATH=data/dengue_sample_data.csv

## Running Services

### Run AI Engine

```bash
cd ai-engine
python run.py
```

### Run Backend

```bash
cd backend
npm run start
```

### Run Web App

```bash
cd web
npm run dev
```

### Run Non-Mobile Stack From Root

```bash
npm run start:non-mobile
```

### Run NH-S19-App (optional)

```bash
cd NH-S19-App
npm run start
```

### Run Backend + NH-S19-App (root)

```bash
npm run start:backend+app
```

## API Endpoints

### Health

- GET /api/health

### Authentication

- POST /api/auth/login

### Citizen Reports

- POST /api/report
- POST /api/reports
- GET /api/reports
- GET /api/reports/history

### Risk

- GET /api/prediction
- GET /api/risk/current
- GET /api/risk/heatmap
- GET /api/risk/trends
- GET /api/risk/history/:locationName

### Admin

- GET /api/dashboard/stats
- GET /api/admin/dashboard
- GET /api/admin/reports
- PATCH /api/admin/reports/:reportId/verify
- GET /api/admin/alerts
- PATCH /api/admin/alerts/:alertId/resolve
- GET /api/admin/export/csv
- GET /api/admin/export/pdf
- GET /api/admin/subscriptions

### Citizen Utility

- GET /api/citizen/tips
- POST /api/citizen/subscriptions

### AI Engine

- GET /health
- POST /predict
- POST /predict-batch
- GET /explain/model

## Realtime Events (Socket.IO)

- report:new
- report:new:admin
- alert:new
- subscribe:location
- unsubscribe:location

## Security and Performance Upgrades

- Helmet security headers
- Global + auth/report rate limiting
- Request payload sanitization
- Stronger validation and safer query parsing
- Hardened JWT config and production checks
- Socket authentication support and room subscriptions
- Mongo indexes for high-volume queries
- In-memory cache layer for risk and dashboard endpoints
- Web route code splitting and chunked build output
- Mobile socket reconnect tuning and Reanimated transitions

## SEO and Web Optimization

- Enhanced meta tags, Open Graph, Twitter tags
- Canonical and robots metadata
- Added public/robots.txt and public/sitemap.xml
- Optimized Vite chunking for faster first load

## Deployment Guide (Non-Docker)

Detailed step-by-step guide is available at docs/DEPLOYMENT.md.

### Vercel (Web)

1. Deploy web folder as Vite app
2. Set VITE_API_BASE_URL and VITE_SOCKET_URL
3. Ensure backend CORS allows Vercel domain

### Render (Backend + AI)

1. Create two services:
   - backend (Node)
   - ai-engine (Python)
2. Configure env vars from examples
3. Point backend AI_ENGINE_URL to deployed AI service URL

### AWS / DigitalOcean

1. Provision MongoDB (Atlas or managed instance)
2. Deploy backend and AI on separate app services or VMs
3. Build and host web as static bundle (CDN + object storage)
4. Configure TLS and domain-level CORS/origin settings

## Final Feature Checklist

- Citizen Portal: included
- Admin Dashboard: included (web only)
- AI Risk Prediction: included
- Disease Report Submission: included
- Risk Heatmap Map: included
- Real-Time Alerts: included
- Prevention Tips: included
- Risk Trends Chart: included
- Weather Integration: included (OpenWeather/Open-Meteo fallback)
- Push Notifications: included (Expo/local notifications)
- Offline Support: included (cached fallback)
- Mobile App: included
- Secure APIs: improved and hardened
- Analytics Dashboard: included

## Future Improvements

- Add automated unit/integration/e2e tests
- Add role-based access control beyond single admin role
- Add persistent distributed cache (Redis)
- Add centralized audit logging and SIEM integration
- Add multilingual citizen UI support
- Add CI/CD pipelines with environment promotion gates

## Notes

- Admin functionality remains web-only by design.
- Non-mobile deployment path is documented and maintained without Docker.
