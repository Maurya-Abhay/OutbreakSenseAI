import { useContext, useCallback, useEffect } from "react";
import { AuthContext, subscribeToAuthEvents } from "../context/AuthContext";

/**
 * useAuth Hook - Provides auth state and methods
 * Handles token validation and auth event listening
 */
export const useAuth = () => {
  const authContext = useContext(AuthContext);
  
  if (!authContext) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  useEffect(() => {
    // Subscribe to auth events
    const unsubscribe = subscribeToAuthEvents(({ event, data }) => {
      console.log(`Auth event: ${event}`, data);
    });

    return unsubscribe;
  }, []);

  /**
   * Make an authenticated request with automatic token handling
   */
  const makeAuthRequest = useCallback(async (path, options = {}) => {
    const { request } = (await import("../services/apiClient")).default || 
                        (await import("../services/apiClient"));
    
    try {
      const authHeaders = authContext.getAuthHeaders();
      const response = await request(path, {
        ...options,
        headers: {
          ...authHeaders,
          ...(options.headers || {})
        }
      });
      
      return { success: true, data: response };
    } catch (error) {
      // Handle 401 Unauthorized
      if (error.status === 401) {
        console.log("Token invalid, logging out...");
        await authContext.handleInvalidToken();
        return { success: false, error: "Unauthorized", code: 401 };
      }
      
      return { success: false, error: error.message, code: error.status };
    }
  }, [authContext]);

  return {
    ...authContext,
    makeAuthRequest
  };
};

export default useAuth;
