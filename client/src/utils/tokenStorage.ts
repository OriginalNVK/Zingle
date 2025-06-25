/**
 * Helper functions for token storage with expiration
 */
export interface ITokenUser {
    id: string;
    email: string;
    exp?: number;
}

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const EXPIRATION_BUFFER = 60; // 60 seconds buffer

const parseJwt = (token: string): ITokenUser | null => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
};

export const tokenStorage = {
    /**
     * Get token string from storage
     * @returns token string or null if not found
     */
    getToken: (): string | null => {
        return localStorage.getItem(TOKEN_KEY);
    },

    /**
     * Store token string in storage
     * @param token JWT token string
     */
    setToken: (token: string): void => {
        localStorage.setItem(TOKEN_KEY, token);
        // Parse and store user data
        const userData = parseJwt(token);
        if (userData) {
            localStorage.setItem(USER_KEY, JSON.stringify(userData));
        }
    },

    /**
     * Get user data from token
     * @returns user data object or null if not found
     */
    getUser: (): ITokenUser | null => {
        const userJson = localStorage.getItem(USER_KEY);
        return userJson ? JSON.parse(userJson) : null;
    },

    /**
     * Clear token and user data from storage
     */
    clear: (): void => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },

    /**
     * Check if token is valid and not expired
     * @returns true if token exists and is valid
     */
    isTokenValid: (): boolean => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return false;

        const userData = tokenStorage.getUser();
        if (!userData?.exp) return false;

        const currentTime = Math.floor(Date.now() / 1000);
        return userData.exp > (currentTime + EXPIRATION_BUFFER);
    }
};
