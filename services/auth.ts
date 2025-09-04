import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, API_ENDPOINTS } from '../config/api';

const AUTH_KEY = '@attendance_app_auth';
const TOKEN_KEY = '@attendance_app_token';

export interface User {
  username: string;
  name: string;
  id: string;
  accessToken?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

// Helper function to create form data for login
const createLoginFormData = (username: string, password: string): string => {
  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('username', username);
  params.append('password', password);
  params.append('scope', '');
  params.append('client_id', 'string');
  params.append('client_secret', 'string');
  return params.toString();
};

export const AuthService = {
  // Login function with real API authentication
  async login(username: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const formData = createLoginFormData(username, password);
      
      const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.login}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (response.ok) {
        const loginData: LoginResponse = await response.json();
        
        const userInfo: User = {
          id: username, // Use username as ID for now
          username: username,
          name: username === 'admin' ? 'Admin User' : username,
          accessToken: loginData.access_token
        };
        
        // Store user session and token
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userInfo));
        await AsyncStorage.setItem(TOKEN_KEY, loginData.access_token);
        
        return { success: true, user: userInfo };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, message: errorData.detail || 'Invalid username or password' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error. Please check your connection and try again.' };
    }
  },

  // Check if user is logged in
  async getStoredUser(): Promise<User | null> {
    try {
      const userString = await AsyncStorage.getItem(AUTH_KEY);
      if (userString) {
        return JSON.parse(userString);
      }
      return null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  },

  // Logout function
  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AUTH_KEY);
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  },

  // Get stored access token
  async getStoredToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      return token;
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  },

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getStoredUser();
    const token = await this.getStoredToken();
    return user !== null && token !== null;
  }
};
