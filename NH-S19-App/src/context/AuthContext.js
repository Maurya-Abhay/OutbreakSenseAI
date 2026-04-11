import React, { createContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { request, setAuthToken } from "../services/apiClient";

export const AuthContext = createContext();

// Event emitter for auth state changes
let authListeners = [];
export const subscribeToAuthEvents = (callback) => {
  authListeners.push(callback);
  return () => {
    authListeners = authListeners.filter(cb => cb !== callback);
  };
};

const emitAuthEvent = (event, data) => {
  authListeners.forEach(cb => cb({ event, data }));
};

// Global auth token that persists across requests
let globalAuthToken = null;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Restore token on app launch
  const restoreToken = useCallback(async () => {
    try {
      const savedToken = await AsyncStorage.getItem("authToken");
      const savedRefreshToken = await AsyncStorage.getItem("refreshToken");
      const savedUser = await AsyncStorage.getItem("authUser");
      
      if (savedToken && savedUser) {
        setToken(savedToken);
        setRefreshToken(savedRefreshToken);
        setUser(JSON.parse(savedUser));
        globalAuthToken = savedToken;
        setAuthToken(savedToken);  // Sync with apiClient
        emitAuthEvent("auth:restored", { token: savedToken, user: JSON.parse(savedUser) });
      }
    } catch (err) {
      console.log("Error restoring token:", err.message);
    }
  }, []);

  // Register citizen
  const register = useCallback(async (name, email, password, confirmPassword, phone) => {
    setLoading(true);
    setError(null);
    try {
      const response = await request("/auth/citizen/register", {
        method: "POST",
        body: {
          name,
          email,
          password,
          confirmPassword,
          phone
        },
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });

      const { accessToken, refreshToken: newRefreshToken, user: newUser } = response;
      const newToken = accessToken || response.token;

      setToken(newToken);
      setRefreshToken(newRefreshToken);
      setUser(newUser);
      globalAuthToken = newToken;
      setAuthToken(newToken);  // Sync with apiClient
      
      await AsyncStorage.setItem("authToken", newToken);
      if (newRefreshToken) {
        await AsyncStorage.setItem("refreshToken", newRefreshToken);
      }
      await AsyncStorage.setItem("authUser", JSON.stringify(newUser));
      
      emitAuthEvent("auth:registered", { user: newUser });

      return { success: true, data: newUser };
    } catch (err) {
      const message = err.payload?.message || err.message || "Registration failed";
      setError(message);
      emitAuthEvent("auth:error", { message });
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Login citizen
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      let response;

      try {
        // Primary path: citizen login
        response = await request("/auth/citizen/login", {
          method: "POST",
          body: {
            email,
            password
          },
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          }
        });
      } catch (citizenError) {
        // Fallback path: admin login, so app login works for both roles.
        response = await request("/auth/login", {
          method: "POST",
          body: {
            email,
            password
          },
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          }
        });
      }

      const { accessToken, refreshToken: newRefreshToken, user: newUser } = response;
      const newToken = accessToken || response.token;

      setToken(newToken);
      setRefreshToken(newRefreshToken);
      setUser(newUser);
      globalAuthToken = newToken;
      setAuthToken(newToken);  // Sync with apiClient
      
      await AsyncStorage.setItem("authToken", newToken);
      if (newRefreshToken) {
        await AsyncStorage.setItem("refreshToken", newRefreshToken);
      }
      await AsyncStorage.setItem("authUser", JSON.stringify(newUser));
      
      emitAuthEvent("auth:login_success", { user: newUser });

      return { success: true, data: newUser };
    } catch (err) {
      const message = err.payload?.message || err.message || "Login failed";
      setError(message);
      emitAuthEvent("auth:error", { message });
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh access token using refresh token
  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) {
      console.warn("No refresh token available");
      return false;
    }

    try {
      const response = await request("/auth/refresh", {
        method: "POST",
        body: { refreshToken },
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });

      const { accessToken } = response;
      
      setToken(accessToken);
      globalAuthToken = accessToken;
      setAuthToken(accessToken);  // Sync with apiClient
      await AsyncStorage.setItem("authToken", accessToken);
      
      emitAuthEvent("auth:token_refreshed", { token: accessToken });
      return true;
    } catch (err) {
      console.warn("Token refresh failed:", err.message);
      // If refresh fails, invalidate the session
      await handleInvalidToken();
      return false;
    }
  }, [refreshToken]);

  // Handle invalid or expired token
  const handleInvalidToken = useCallback(async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("refreshToken");
      await AsyncStorage.removeItem("authUser");
      
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      globalAuthToken = null;
      setAuthToken(null);  // Sync with apiClient
      setError("Session expired. Please login again.");
      
      emitAuthEvent("auth:invalid_token", {});
    } catch (err) {
      console.log("Error invalidating token:", err.message);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      // Optional: Notify backend on logout
      if (token) {
        try {
          await request("/auth/logout", {
            method: "POST",
            body: { refreshToken },
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          });
        } catch (err) {
          console.log("Backend logout failed, cleaning up locally:", err.message);
        }
      }

      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("refreshToken");
      await AsyncStorage.removeItem("authUser");
      
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      globalAuthToken = null;
      setAuthToken(null);  // Sync with apiClient
      
      emitAuthEvent("auth:logout", {});
    } catch (err) {
      console.log("Error logging out:", err.message);
    }
  }, [token, refreshToken]);

  const updateUser = useCallback(async (nextUser) => {
    setUser(nextUser);
    try {
      await AsyncStorage.setItem("authUser", JSON.stringify(nextUser));
    } catch (err) {
      console.log("Error persisting updated user:", err.message);
    }
    emitAuthEvent("auth:user_updated", { user: nextUser });
  }, []);

  // Get current auth headers for requests
  const getAuthHeaders = useCallback(() => {
    if (token) {
      return {
        "Authorization": `Bearer ${token}`
      };
    }
    return {};
  }, [token]);

  const value = {
    user,
    token,
    refreshToken,
    loading,
    error,
    isAuthenticated: !!token,
    register,
    login,
    logout,
    updateUser,
    restoreToken,
    getAuthHeaders,
    handleInvalidToken,
    refreshAccessToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

