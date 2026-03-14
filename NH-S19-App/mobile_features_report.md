# Mobile Features Report

## Implemented Features

- Dynamic light/dark theming with runtime toggle and shared palette tokens.
- Header-level quick actions for theme switch, notification center, and full dashboard refresh.
- Five-tab citizen workflow: Home, Map, Report, Alerts, Tips.
- Realtime risk intelligence via backend + sockets:
  - `GET /risk/heatmap`
  - `GET /risk/trends?period=weekly`
  - `GET /prediction?...`
  - Socket events: `alert:new`, `report:new`
  - Location-room subscriptions: `subscribe:location`, `unsubscribe:location`
- Offline-aware citizen experience:
  - Network state detection with fallback to cached data.
  - Cached risk/tips/map/alerts hydration on startup.
- Local push notifications:
  - High-risk prediction alerts.
  - Nearby outbreak/realtime high severity report alerts.
- Citizen report submission with validation and weather context:
  - `POST /report`
  - GPS detect + manual map pin selection.
  - Weather enrichment (temperature/humidity/rainfall) from Open-Meteo.

## Newly Added Features

- Modular architecture split into `screens`, `components`, `hooks`, `services`, `utils`, and `theme`.
- Home dashboard analytics cards:
  - Nearby case count.
  - Community risk level.
  - High-risk zones count.
  - Weekly peak trend value.
- AI explainability block in risk summary card (top factor contributions).
- Interactive map flow:
  - Native map circles and markers for risk zones.
  - Manual location picker via map tap.
  - Selected-point detail card.
- Alerts center management:
  - Mark-all-read.
  - Feed clear.
  - Recent alert stream with severity visuals.
- Tips center with refresh and cached/offline banners.

## Performance Improvements

- Centralized API client with timeout handling (`AbortController`) and safe JSON parsing.
- AsyncStorage caching layer to reduce repeated network fetches.
- Memoized components and style factories to limit unnecessary re-renders.
- Split map component by platform (`HeatmapMap.native.js` / `HeatmapMap.web.js`) to avoid web bundling native-only map internals.
- Batched startup hydration + parallel data fetch (`Promise.all`) for faster initial availability.

## Security Improvements

- Sanitization utilities applied to text/email/symptoms/coordinates.
- Input clamping and numeric normalization before API submission.
- Form-level validation for required fields, email format, age range, and valid geo coordinates.
- Controlled payload construction to reduce malformed request risk.
- Defensive error handling to avoid leaking raw failures into unstable UI state.

## Build/Validation Outcome

- Static diagnostics passed for all newly created and modified app modules.
- Full web export build completed successfully after platform-safe map split:
  - `npx expo export --platform web --output-dir .expo-web-build-check`

## Key Files Added/Updated

- `App.js`
- `src/theme/palette.js`
- `src/utils/sanitize.js`
- `src/services/apiClient.js`
- `src/services/storageService.js`
- `src/services/weatherService.js`
- `src/services/notificationService.js`
- `src/services/socketService.js`
- `src/hooks/useGeolocation.js`
- `src/hooks/useRiskPrediction.js`
- `src/hooks/useCitizenData.js`
- `src/components/RiskCard.js`
- `src/components/TrendChart.js`
- `src/components/AlertItem.js`
- `src/components/ReportForm.js`
- `src/components/HeatmapMap.native.js`
- `src/components/HeatmapMap.web.js`
- `src/screens/HomeScreen.js`
- `src/screens/MapScreen.js`
- `src/screens/ReportScreen.js`
- `src/screens/AlertsScreen.js`
- `src/screens/TipsScreen.js`
