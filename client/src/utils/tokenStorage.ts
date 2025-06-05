
/**
 * Helper functions for token storage with expiration
 */
export const tokenStorage = {
  /**
   * Store token with expiration time
   * @param token JWT token string
   * @param expirationMinutes Expiration time in minutes
   */
  setToken(token: string, expirationMinutes: number = 30): void {
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + expirationMinutes);
    
    const tokenData = {
      token,
      expires: expirationTime.toISOString()
    };
    
    localStorage.setItem('tokenData', JSON.stringify(tokenData));
  },

  /**
   * Get token if it's still valid
   * @returns token string or null if expired or not found
   */
  getToken(): string | null {
    const tokenDataString = localStorage.getItem('tokenData');
    if (!tokenDataString) return null;
    
    try {
      const tokenData = JSON.parse(tokenDataString);
      const expiration = new Date(tokenData.expires);
      
      if (expiration > new Date()) {
        return tokenData.token;
      } else {
        // Token expired
        this.removeToken();
        return null;
      }
    } catch (error) {
      console.error('Error parsing token data:', error);
      this.removeToken();
      return null;
    }
  },

  /**
   * Remove token from storage
   */
  removeToken(): void {
    localStorage.removeItem('tokenData');
  },

  /**
   * Check if token is valid and not expired
   * @returns true if token exists and is valid
   */
  isTokenValid(): boolean {
    return this.getToken() !== null;
  },
  
  /**
   * Get token expiration time
   * @returns Date object or null if no valid token
   */
  getTokenExpiration(): Date | null {
    const tokenDataString = localStorage.getItem('tokenData');
    if (!tokenDataString) return null;
    
    try {
      const tokenData = JSON.parse(tokenDataString);
      return new Date(tokenData.expires);
    } catch (error) {
      return null;
    }
  }
};
