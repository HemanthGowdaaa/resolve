import axios from "axios";
import { Platform } from "react-native";
import { useAuthStore } from "../store/useAuthStore";

// Resolves host machine loopback depending on device platform
export const API_BASE_URL = Platform.select({
  ios: "http://localhost:8000",
  android: "http://10.0.2.2:8000",
  default: "http://localhost:8000",
});

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Inject Access Token and log request diagnostics
apiClient.interceptors.request.use(
  async (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    console.log(`[HTTP REQUEST] => ${config.method.toUpperCase()} ${config.url}`);
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      console.log(`[HTTP REQUEST HEADERS] => Authorization Bearer: ${accessToken.substring(0, 15)}...`);
    } else {
      console.log("[HTTP REQUEST HEADERS] => No Authorization Token injected");
    }
    if (config.data) {
      console.log("[HTTP REQUEST BODY] =>", JSON.stringify(config.data));
    }
    return config;
  },
  (error) => {
    console.error("[HTTP REQUEST FAILURE] =>", error.message);
    return Promise.reject(error);
  }
);

// Response interceptor: Handle expired tokens, automatic refresh, and log response diagnostics
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    console.log(`[HTTP RESPONSE SUCCESS] <= ${response.status} ${response.config.url}`);
    if (response.data) {
      const dataStr = JSON.stringify(response.data);
      console.log(`[HTTP RESPONSE BODY] <=`, dataStr.length > 300 ? `${dataStr.substring(0, 300)}...` : dataStr);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.error(`[HTTP RESPONSE FAILURE] <=`, error.response ? `${error.response.status} ${originalRequest.url}` : error.message);
    if (error.response?.data) {
      console.error("[HTTP RESPONSE ERROR BODY] <=", JSON.stringify(error.response.data));
    }
    
    // Check if the error is 401 (Unauthorized) and not already a retry attempt
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === "/auth/refresh/" || originalRequest.url === "/auth/login/") {
        console.log("[JWT REFRESH/LOGIN FLOW] => Failed authentication, signing out user.");
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        console.log("[JWT ROTATION QUEUE] => Queueing concurrent request:", originalRequest.url);
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        console.log("[JWT ROTATION FLOW] => No refresh token in store, logging out.");
        useAuthStore.getState().logout();
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        console.log("[JWT ROTATION FLOW] => Rotating access token via SimpleJWT...");
        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;
        const newRefreshToken = response.data.refresh;

        console.log("[JWT ROTATION FLOW] => Access token rotated successfully. Re-hydrating store.");
        useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);
        
        processQueue(null, newAccessToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error("[JWT ROTATION FAILURE] => Token rotation failed, purging sessions.", refreshError.message);
        processQueue(refreshError, null);
        isRefreshing = false;
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
