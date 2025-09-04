import Constants from 'expo-constants';

// API Configuration
export const API_CONFIG = {
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || Constants.expoConfig?.extra?.apiUrl || 'https://384e4707360d.ngrok-free.app',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};

// API Endpoints
export const API_ENDPOINTS = {
  login: '/login',
  registerStudent: '/vectordb/students/video',
  getStudents: '/vectordb/students',
  takeAttendance: '/attendance/images-attendance',
};
