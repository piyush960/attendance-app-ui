import Constants from 'expo-constants';

// API Configuration
export const API_CONFIG = {
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};

// API Endpoints
export const API_ENDPOINTS = {
  registerStudent: '/vectordb/students/video',
  takeAttendance: '/attendance/images-attendance',
};
