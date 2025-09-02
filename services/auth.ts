import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEY = '@attendance_app_auth';

export interface User {
  username: string;
  name: string;
  id: string;
}

// Mock user data
const mockUsers = [
  { id: '1', username: 'teacher1', password: 'password', name: 'John Doe' },
  { id: '2', username: 'teacher2', password: '123456', name: 'Jane Smith' },
  { id: '3', username: 'admin', password: 'admin', name: 'Admin User' },
];

export const AuthService = {
  // Login function with mock authentication
  async login(username: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = mockUsers.find(u => u.username === username && u.password === password);
        
        if (user) {
          const userInfo: User = {
            id: user.id,
            username: user.username,
            name: user.name
          };
          
          // Store user session
          AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userInfo));
          
          resolve({ success: true, user: userInfo });
        } else {
          resolve({ success: false, message: 'Invalid username or password' });
        }
      }, 1000); // Simulate network delay
    });
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
    } catch (error) {
      console.error('Error logging out:', error);
    }
  },

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getStoredUser();
    return user !== null;
  }
};
