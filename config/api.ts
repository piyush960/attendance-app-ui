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

// Testing Configuration
export const TESTING_CONFIG = {
  // Set to false to disable all mock data and use real API responses only
  useMockData: true,
  // Mock data delays (in milliseconds) for realistic API simulation
  mockDelays: {
    students: 600,
    stats: 800,
    attendance: 700,
  },
};
