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
        // Use tokenStorage to check if we have a valid token
        if (tokenStorage.isTokenValid()) {
          const user = await authApi.getCurrentUser();
          // Convert string role to UserRole enum
          setCurrentUser({
            ...user,
            role: user.role === 'Admin' ? UserRole.ADMIN : UserRole.USER
          });
        }
      } catch (error) {
        console.error("Failed to load user session", error);
        tokenStorage.removeToken();
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
      // Convert string role to UserRole enum
      setCurrentUser({
        ...response,
        role: response.role === 'Admin' ? UserRole.ADMIN : UserRole.USER
      });
    } catch (error) {
      console.error("Login failed:", error);
      throw new Error('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authApi.register({ username, email, password });
      // Convert string role to UserRole enum
      setCurrentUser({
        ...response,
        role: response.role === 'Admin' ? UserRole.ADMIN : UserRole.USER
      });
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authApi.logout();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated: !!currentUser, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
