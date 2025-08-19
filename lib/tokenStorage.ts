import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

export const tokenStorage = {
  /**
   * Store authentication token securely
   */
  async setToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to store token:', error);
      throw new Error('Failed to store authentication token');
    }
  },

  /**
   * Retrieve authentication token
   */
  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return null;
    }
  },

  /**
   * Remove authentication token
   */
  async removeToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to remove token:', error);
      // Don't throw error on removal failure
    }
  },

  /**
   * Check if token exists
   */
  async hasToken(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }
};
