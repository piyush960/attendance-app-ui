// import './global.css'; // Using StyleSheet instead of NativeWind
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import LoginScreen from './app/index';
import HomeScreen from './app/home';
import RegisterStudentScreen from './app/register-student';
import TakeAttendanceScreen from './app/take-attendance';
import { AuthService, User } from './services/auth';
import { ApiService } from './services/api';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  RegisterStudent: undefined;
  TakeAttendance: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    checkAuthStatus();
    initializeApp();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const storedUser = await AuthService.getStoredUser();
      setUser(storedUser);
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeApp = async () => {
    try {
      // Initialize mock data for demo
      await ApiService.initializeMockData();
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setUser(null);
  };

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
        </View>
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            // Authenticated screens
            <>
              <Stack.Screen name="Home">
                {(props) => <HomeScreen {...props} user={user} onLogout={handleLogout} />}
              </Stack.Screen>
              <Stack.Screen name="RegisterStudent" component={RegisterStudentScreen} />
              <Stack.Screen name="TakeAttendance" component={TakeAttendanceScreen} />
            </>
          ) : (
            // Non-authenticated screens
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2563eb', // blue-600
  },
});
