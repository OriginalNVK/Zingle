import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { UserRole } from '../types';
import { authApi } from '../services/api/authApi';
import { tokenStorage } from '../utils/tokenStorage';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      try {
        if (tokenStorage.isTokenValid()) {
          const user = await authApi.getCurrentUser();
          setCurrentUser({
            ...user,
            role: user.role === 'Admin' ? UserRole.ADMIN : UserRole.USER
          });
        } else {
          // Token is expired or invalid, clear it
          tokenStorage.clear();
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Failed to load user session", error);
        tokenStorage.clear();
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      // Store token in localStorage
      tokenStorage.setToken(response.token);
      setCurrentUser({
        ...response,
        role: response.role === 'Admin' ? UserRole.ADMIN : UserRole.USER
      });
    } catch (error: any) {
      console.error("Login failed:", error);
      throw new Error(error.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authApi.register({ username, email, password });
      // Store token in localStorage
      tokenStorage.setToken(response.token);
      setCurrentUser({
        ...response,
        role: response.role === 'Admin' ? UserRole.ADMIN : UserRole.USER
      });
    } catch (error: any) {
      console.error("Registration failed:", error);
      
      // Re-throw the error with the original message
      throw new Error(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authApi.logout();
    tokenStorage.clear();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated: !!currentUser, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
