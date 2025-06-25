import api from './axiosConfig';
import type { AuthRequest, RegisterRequest, AuthResponse, User } from '../types';
import { tokenStorage } from '../../utils/tokenStorage';

export const authApi = {
    login: async (data: AuthRequest): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', data);
        if (response.data.token) {
            tokenStorage.setToken(response.data.token);
        }
        return response.data;
    },

    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/register', data);
        if (response.data.token) {
            tokenStorage.setToken(response.data.token);
        }
        return response.data;
    },

    logout: () => {
        tokenStorage.clear();
    },

    getCurrentUser: async (): Promise<User> => {
        const token = tokenStorage.getToken();
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        try {
            const response = await api.get<User>('/auth/me');
            return response.data;
        } catch (error) {
            console.error('Failed to get current user:', error);
            throw new Error('Failed to get current user information');
        }
    }
};
