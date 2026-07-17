import axios from "axios";
import { Platform } from "react-native";
import { useAuthStore } from "../store/useAuthStore";

// Target production Render backend server
export const API_BASE_URL = "https://resolve-48wh.onrender.com";
// export const API_BASE_URL = "http://127.0.0.1:8000";

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
    const logTag = config.url.startsWith("/auth/") ? "[AUTH]" : config.url.startsWith("/sync/") ? "[SYNC]" : "[API]";

    console.log(`${logTag} Request => ${config.method.toUpperCase()} ${config.url}`);
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      console.log(`${logTag} Header => Authorization Bearer: ${accessToken.substring(0, 15)}...`);
    } else {
      console.log(`${logTag} Header => No Authorization Token injected`);
    }
    if (config.data) {
      console.log(`${logTag} Body =>`, JSON.stringify(config.data));
    }
    return config;
  },
  (error) => {
    console.error("[API] Request Failure =>", error.message);
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
    const logTag = response.config.url.startsWith("/auth/") ? "[AUTH]" : response.config.url.startsWith("/sync/") ? "[SYNC]" : "[API]";
    console.log(`${logTag} Response => SUCCESS ${response.status} ${response.config.url}`);
    if (response.data) {
      const dataStr = JSON.stringify(response.data);
      console.log(`${logTag} Response Body =>`, dataStr.length > 300 ? `${dataStr.substring(0, 300)}...` : dataStr);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const logTag = originalRequest?.url?.startsWith("/auth/") ? "[AUTH]" : originalRequest?.url?.startsWith("/sync/") ? "[SYNC]" : "[API]";

    console.error(`${logTag} Response => FAILURE`, error.response ? `${error.response.status} ${originalRequest.url}` : error.message);
    if (error.response?.data) {
      console.error(`${logTag} Response Error Body =>`, JSON.stringify(error.response.data));
    }

    // Check if the error is 401 (Unauthorized) and not already a retry attempt
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === "/auth/refresh/" || originalRequest.url === "/auth/login/") {
        console.log("[AUTH] Refresh/Login Failure => signing out user.");
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        console.log("[AUTH] Token Rotation Queue => queueing concurrent request:", originalRequest.url);
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
        console.log("[AUTH] Token Rotation => No refresh token in store, logging out.");
        useAuthStore.getState().logout();
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        console.log("[AUTH] Token Rotation => Rotating access token via SimpleJWT...");
        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;
        const newRefreshToken = response.data.refresh;

        console.log("[AUTH] Token Rotation => Access token rotated successfully. Re-hydrating store.");
        await useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

        processQueue(null, newAccessToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error("[AUTH] Token Rotation Failure => Purging sessions.", refreshError.message);
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
