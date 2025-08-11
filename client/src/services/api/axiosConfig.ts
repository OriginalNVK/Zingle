import axios from "axios";
import { tokenStorage } from "../../utils/tokenStorage";
import { API_URL } from "../../config";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    },
    withCredentials: true
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = tokenStorage.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Ensure CORS headers are properly handled
        config.headers["X-Requested-With"] = "XMLHttpRequest";
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath.startsWith('/login') || currentPath.startsWith('/register');

        // Handle 401 Unauthorized errors
        if (error.response?.status === 401) {
            // Only redirect if token is invalid and not already on auth page
            if (!tokenStorage.isTokenValid() && !isAuthPage) {
                tokenStorage.clear();
                const returnUrl = encodeURIComponent(currentPath);
                window.location.href = `/login?redirect=${returnUrl}`;
                return Promise.reject(error);
            }
        }

        // Handle network errors with retry logic
        if (error.message === 'Network Error') {
            const config = error.config;
            if (!config || !config._retry) {
                config._retry = true;
                return api(config);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
