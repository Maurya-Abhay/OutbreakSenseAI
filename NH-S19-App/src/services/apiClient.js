import { NativeModules, Platform } from "react-native";
import Constants from "expo-constants";

// Will be set by AuthContext
let globalAuthToken = null;

export const setAuthToken = (token) => {
  globalAuthToken = token;
};

const normalizeBaseUrl = (value) => String(value || "").replace(/\/+$/, "").trim();

const DEFAULT_API_BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:5050/api" : "http://localhost:5050/api";

const EXPLICIT_API_BASE_URL = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_BACKEND_API);
const EXPLICIT_SOCKET_BASE_URL = normalizeBaseUrl(process.env.EXPO_PUBLIC_SOCKET_URL || process.env.EXPO_PUBLIC_BACKEND_SOCKET);
const CANDIDATE_PORTS = [5050, 5051, 5000];

const unique = (items) => Array.from(new Set(items.filter(Boolean)));

const extractHostFromUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  try {
    return String(new URL(raw).hostname || "").trim();
  } catch {
    const match = raw.match(/^[a-z][a-z0-9+.-]*:\/\/([^/:?#]+)/i);
    return match?.[1] ? String(match[1]).trim() : "";
  }
};

const extractHostFromExpoConstants = () => {
  const sources = [
    Constants?.expoConfig?.hostUri,
    Constants?.manifest?.debuggerHost,
    Constants?.expoGoConfig?.debuggerHost,
    Constants?.manifest2?.extra?.expoClient?.hostUri
  ];

  for (const source of sources) {
    const raw = String(source || "").trim();
    if (!raw) {
      continue;
    }

    const beforeSlash = raw.split("/")[0];
    const host = beforeSlash.split(":")[0];
    if (host) {
      return host;
    }
  }

  return "";
};

const buildHostCandidates = (host) => {
  const safeHost = String(host || "").trim();
  if (!safeHost) {
    return [];
  }

  return CANDIDATE_PORTS.map((port) => `http://${safeHost}:${port}/api`);
};

const extractHostFromScriptUrl = () => {
  try {
    if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.hostname) {
      return String(window.location.hostname).trim();
    }
    const scriptUrl = String(NativeModules?.SourceCode?.scriptURL || "");
    const match = scriptUrl.match(/^[a-z]+:\/\/([^/:]+)/i);
    return match?.[1] ? String(match[1]).trim() : "";
  } catch {
    return "";
  }
};

const buildApiCandidates = () => {
  const devHost = extractHostFromScriptUrl();
  const constantsHost = extractHostFromExpoConstants();
  const explicitHost = extractHostFromUrl(EXPLICIT_API_BASE_URL);

  return unique([
    ...buildHostCandidates(devHost),
    ...buildHostCandidates(constantsHost),
    EXPLICIT_API_BASE_URL,
    ...buildHostCandidates(explicitHost),
    Platform.OS === "android" ? "http://10.0.2.2:5050/api" : "",
    Platform.OS === "android" ? "http://10.0.2.2:5051/api" : "",
    Platform.OS === "android" ? "http://10.0.2.2:5000/api" : "",
    "http://localhost:5050/api",
    "http://127.0.0.1:5050/api",
    "http://localhost:5051/api",
    "http://127.0.0.1:5051/api",
    "http://localhost:5000/api",
    "http://127.0.0.1:5000/api",
    DEFAULT_API_BASE_URL
  ])
    .filter(Boolean)
    .map(normalizeBaseUrl);
};

// State to remember the working URL
let activeApiBaseUrl = buildApiCandidates()[0] || DEFAULT_API_BASE_URL;

export const getApiBaseUrl = () => activeApiBaseUrl;
export const getSocketBaseUrl = () => EXPLICIT_SOCKET_BASE_URL || normalizeBaseUrl(activeApiBaseUrl).replace(/\/api$/, "");

const parseJsonSafe = (raw) => {
  try { return JSON.parse(raw); } 
  catch { return { message: raw }; }
};

/**
 * Optimized Request Handler
 */
export const request = async (path, options = {}) => {
  const timeoutMs = options.timeoutMs || 8000;
  let endpointPath = path.startsWith("/") ? path : `/${path}`;
  
  // Add query parameters to the URL if provided
  if (options.query && Object.keys(options.query).length > 0) {
    const queryString = new URLSearchParams(options.query).toString();
    endpointPath = `${endpointPath}?${queryString}`;
  }
  
  const maxCandidates = Number.isFinite(options.maxCandidates)
    ? Math.max(1, Number(options.maxCandidates))
    : 0;

  // Hamesha pehle known-working URL try karein.
  const allCandidates = unique([activeApiBaseUrl, ...buildApiCandidates()]);
  const candidates = maxCandidates > 0 ? allCandidates.slice(0, maxCandidates) : allCandidates;

  for (let i = 0; i < candidates.length; i++) {
    const baseUrl = candidates[i];
    const controller = new AbortController();

    // Primary URL ko full timeout, fallback URLs ko quick timeout.
    const currentTimeoutMs = (i === 0) ? timeoutMs : 2000; 
    const timeoutId = setTimeout(() => controller.abort(), currentTimeoutMs);

    try {
      const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(options.headers || {})
      };

      // Add auth token if available
      if (globalAuthToken) {
        headers["Authorization"] = `Bearer ${globalAuthToken}`;
      }

      const response = await fetch(`${baseUrl}${endpointPath}`, {
        method: options.method || "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const raw = await response.text();
      const payload = parseJsonSafe(raw);

      if (!response.ok) {
        const error = new Error(payload?.message || `${response.status} ${response.statusText}`);
        error.status = response.status;
        error.payload = payload;

        // HTTP response mila, matlab host reachable hai.
        activeApiBaseUrl = baseUrl;
        throw error;
      }

      // Success.
      activeApiBaseUrl = baseUrl;
      return payload;

    } catch (error) {
      clearTimeout(timeoutId);

      // Host reachable tha par endpoint-level HTTP error aaya.
      if (error.status) throw error;

      if (i === candidates.length - 1) {
        throw new Error(
          `Network Error. Could not connect to API. Tried: ${candidates[0]} & others.`
        );
      }
    }
  }
};

export const apiClient = {
  get: (path, options = {}) => request(path, { ...options, method: "GET" }),
  post: (path, body, options = {}) => request(path, { ...options, method: "POST", body }),
  put: (path, body, options = {}) => request(path, { ...options, method: "PUT", body }),
  delete: (path, options = {}) => request(path, { ...options, method: "DELETE" })
};