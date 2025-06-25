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
    withCredentials: true,
    timeout: 7000, // 7 second timeout for faster feedback
    timeoutErrorMessage: "Request timeout. Please check your connection and try again."
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
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
    },
    async (error) => {
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath.startsWith('/login') || currentPath.startsWith('/register');
        
        console.error('API Response Error:', {
            status: error.response?.status,
            message: error.message,
            url: error.config?.url,
            method: error.config?.method
        });
        
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
            console.warn('Network Error detected, this will be handled by retry logic in individual API calls');
            const config = error.config;
            if (!config || !config._retry) {
                config._retry = true;
                return api(config);
            }
        }

        // Handle timeout errors
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            console.warn('Request timeout detected');
        }

        return Promise.reject(error);
    }
);

export default api;
