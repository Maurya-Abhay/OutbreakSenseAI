# OutbreakSense AI Deployment (No Docker)

This guide deploys the non-mobile stack only:

- web (React + Vite)
- backend (Node + Express)
- ai-engine (FastAPI)
- MongoDB Atlas

## 1. Push to GitHub

1. Create a new repository on GitHub.
2. From project root run:

```bash
git init
git add .
git commit -m "chore: prepare non-docker deployment"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

## 2. Prepare MongoDB Atlas

1. Create a free Atlas cluster.
2. Create database user and password.
3. Allow network access (0.0.0.0/0 for quick start, then tighten later).
4. Copy connection string:

```text
mongodb+srv://<USER>:<PASS>@<CLUSTER>/<DB>?retryWrites=true&w=majority
```

## 3. Deploy AI Engine (Render Web Service)

1. Render -> New -> Web Service -> connect GitHub repo.
2. Root Directory: `ai-engine`
3. Build Command:

```bash
pip install -r requirements.txt
```

4. Start Command:

```bash
python run.py
```

5. Add env vars:

- `PORT=8001`
- `MODEL_TYPE=random_forest`
- `MODEL_PATH=model/risk_model.joblib`
- `DATASET_PATH=data/dengue_sample_data.csv`

6. Deploy and copy URL, example:

```text
https://outbreaksense-ai-engine.onrender.com
```

## 4. Deploy Backend (Render Web Service)

1. Render -> New -> Web Service -> same GitHub repo.
2. Root Directory: `backend`
3. Build Command:

```bash
npm install
```

4. Start Command:

```bash
npm run start
```

5. Add env vars:

- `NODE_ENV=production`
- `PORT=5050`
- `MONGO_URI=<atlas-uri>`
- `JWT_SECRET=<strong-32+-char-secret>`
- `JWT_EXPIRES_IN=1d`
- `AI_ENGINE_URL=<ai-engine-render-url>`
- `CORS_ORIGIN=<vercel-web-url>`
- `SOCKET_CORS_ORIGIN=<vercel-web-url>`
- `SEED_DEFAULT_ADMIN=true`
- `DEFAULT_ADMIN_EMAIL=admin@outbreaksense.ai`
- `DEFAULT_ADMIN_PASSWORD=<strong-password>`
- `TRUST_PROXY=true`

6. Deploy and copy URL, example:

```text
https://outbreaksense-backend.onrender.com
```

## 5. Deploy Web (Vercel)

1. Vercel -> Add New Project -> import same GitHub repo.
2. Framework preset: Vite.
3. Root Directory: `web`
4. Build Command:

```bash
npm run build
```

5. Output Directory:

```text
dist
```

6. Env vars:

- `VITE_API_BASE_URL=https://outbreaksense-backend.onrender.com/api`
- `VITE_SOCKET_URL=https://outbreaksense-backend.onrender.com`

7. Deploy.

## 6. Final Connection Checks

After all deploys, verify these URLs:

- Backend health: `https://<backend-url>/api/health`
- AI health: `https://<ai-url>/health`
- Web loads and can:
  - fetch dashboard data
  - submit report
  - run risk prediction

## 7. Required CORS Sync

If web calls fail with CORS, update backend env:

- `CORS_ORIGIN=https://<vercel-url>`
- `SOCKET_CORS_ORIGIN=https://<vercel-url>`

Then redeploy backend.

## 8. Mobile Folder Cleanup (Optional)

If your active app is `NH-S19-App` and old `mobile/` is legacy only:

1. Delete only `mobile/` folder.
2. Keep `NH-S19-App/` as your app project.
3. Root deployment remains non-mobile (`backend` + `web` + `ai-engine`) and is unaffected.

## 9. CI (already included)

GitHub Actions workflow `.github/workflows/ci-non-mobile.yml` checks:

- backend import integrity
- web production build
- ai-engine Python compile check

This runs on every push/PR to `main`.
