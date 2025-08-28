import api from './axiosConfig';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '../../types';
import { tokenStorage } from '../../utils/tokenStorage';

export const authApi = {
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        try {
            const response = await api.post<AuthResponse>('/auth/login', data);
            if (response.data.token) {
                tokenStorage.setToken(response.data.token);
            }
            return response.data;
        } catch (error: any) {
            console.error('Login API Error:', error);
            
            // Extract detailed error message from server response
            if (error.response?.data) {
                if (typeof error.response.data === 'string') {
                    throw new Error(error.response.data);
                } else if (error.response.data.message) {
                    throw new Error(error.response.data.message);
                } else if (error.response.data.title) {
                    throw new Error(error.response.data.title);
                }
            }
            
            // Fallback error message
            throw new Error('Login failed. Please check your credentials and try again.');
        }
    },

    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        try {
            const response = await api.post<AuthResponse>('/auth/register', data);
            if (response.data.token) {
                tokenStorage.setToken(response.data.token);
            }
            return response.data;
        } catch (error: any) {
            console.error('Registration API Error:', error);
            
            // Extract detailed error message from server response
            if (error.response?.data) {
                if (typeof error.response.data === 'string') {
                    throw new Error(error.response.data);
                } else if (Array.isArray(error.response.data)) {
                    // Handle Identity validation errors
                    const errorMessages = error.response.data.map((err: any) => 
                        err.description || err.message || err
                    ).join('. ');
                    throw new Error(errorMessages);
                } else if (error.response.data.message) {
                    throw new Error(error.response.data.message);
                } else if (error.response.data.title) {
                    throw new Error(error.response.data.title);
                }
            }
            
            // Fallback error message
            throw new Error('Registration failed. Please check your input and try again.');
        }
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
        } catch (error: any) {
            console.error('Failed to get current user:', error);
            
            // If unauthorized, clear token
            if (error.response?.status === 401) {
                tokenStorage.clear();
            }
            
            throw new Error('Failed to get current user information');
        }
    }
};
