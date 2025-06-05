import api from './axiosConfig';
import type { AuthRequest, RegisterRequest, AuthResponse, User } from '../types';
import { tokenStorage } from '../../utils/tokenStorage';

export const authApi = {
    login: async (data: AuthRequest): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', data);
        if (response.data.token) {
            // Store token with 30-minute expiration
            tokenStorage.setToken(response.data.token, 30);
        }
        return response.data;
    },

    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/register', data);
        if (response.data.token) {
            // Store token with 30-minute expiration
            tokenStorage.setToken(response.data.token, 30);
        }
        return response.data;
    },

    logout: () => {
        tokenStorage.removeToken();
    },    getCurrentUser: async (): Promise<User> => {
        // Extract the current user ID from the JWT token
        const tokenData = tokenStorage.getToken();
        if (!tokenData) {
            throw new Error('No authentication token found');
        }
        
        try {
            // Decode the JWT token to get the user ID
            const base64Url = tokenData.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            const userId = payload.nameid; // ClaimTypes.NameIdentifier in JWT token
            
            if (!userId) {
                throw new Error('User ID not found in token');
            }
            
            // Fetch the user by ID
            const response = await api.get<User>(`/Users/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Failed to decode token or fetch user:', error);
            throw new Error('Failed to get current user information');
        }
    }
};
