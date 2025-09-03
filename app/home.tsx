import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, StyleSheet } from 'react-native';
import { UserPlus, Camera, BookOpen, Users, LogOut } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { User } from '../services/auth';
import { ApiService } from '../services/api';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  user: User;
  onLogout: () => void;
}

export default function HomeScreen({ user, onLogout }: HomeScreenProps) {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    averageAttendance: 0,
    recentAttendanceCount: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const classroomStats = await ApiService.getClassroomStats();
      setStats(classroomStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: onLogout },
      ]
    );
  };
  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#1e3c72', '#2a5298']} 
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.welcomeText}>Welcome, {user.name}!</Text>
              <Text style={styles.subtitleText}>
                Select an option to continue
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutButton}
            >
              <LogOut size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Main Image */}
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1515073838964-4d4d56a58b21?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8U3R1ZGVudCUyMGxlYXJuZXIlMjBwdXBpbCUyMGVkdWNhdGlvbnxlbnwwfHwwfHx8MA%3D%3D' }} 
              style={styles.mainImage}
              resizeMode="cover"
            />
          </View>

          {/* Options Grid */}
          <View style={styles.optionsGrid}>
            {/* Register Student Card */}
            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => navigation.navigate('RegisterStudent')}
            >
              <View style={styles.blueIconContainer}>
                <UserPlus size={32} color="#1e3c72" />
              </View>
              <Text style={styles.cardTitle}>Register Student</Text>
              <Text style={styles.cardSubtitle}>
                Add new students to your class
              </Text>
            </TouchableOpacity>

            {/* Take Attendance Card */}
            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => navigation.navigate('TakeAttendance')}
            >
              <View style={styles.greenIconContainer}>
                <Camera size={32} color="#10b981" />
              </View>
              <Text style={styles.cardTitle}>Take Attendance</Text>
              <Text style={styles.cardSubtitle}>
                Capture class photo for attendance
              </Text>
            </TouchableOpacity>

            {/* View Students Card */}
            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => navigation.navigate('ViewStudents')}
            >
              <View style={styles.purpleIconContainer}>
                <Users size={32} color="#8b5cf6" />
              </View>
              <Text style={styles.cardTitle}>View Students</Text>
              <Text style={styles.cardSubtitle}>
                See all registered students
              </Text>
            </TouchableOpacity>

            {/* Attendance History Card */}
            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => navigation.navigate('AttendanceHistory')}
            >
              <View style={styles.amberIconContainer}>
                <BookOpen size={32} color="#f59e0b" />
              </View>
              <Text style={styles.cardTitle}>Attendance History</Text>
              <Text style={styles.cardSubtitle}>
                Review past attendance records
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>Class Overview</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumberBlue}>{stats.totalStudents}</Text>
                <Text style={styles.statLabel}>Students</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumberGreen}>{stats.averageAttendance}%</Text>
                <Text style={styles.statLabel}>Attendance</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumberAmber}>{stats.totalClasses}</Text>
                <Text style={styles.statLabel}>Classes</Text>
              </View>
            </View>
          </View>

          {/* System Notice */}
          <View style={styles.offlineNotice}>
            <Text style={styles.offlineText}>
              🚀 Powered by AI - Real-time face recognition with local data storage
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              SchoolTrack - Simplifying Attendance for Rural Schools
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitleText: {
    color: '#bfdbfe',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 12,
  },
  imageContainer: {
    marginBottom: 32,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mainImage: {
    width: '100%',
    height: 192,
    borderRadius: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  optionCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  blueIconContainer: {
    backgroundColor: '#dbeafe',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  greenIconContainer: {
    backgroundColor: '#d1fae5',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  purpleIconContainer: {
    backgroundColor: '#e9d5ff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  amberIconContainer: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  statsSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    padding: 24,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumberBlue: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  statNumberGreen: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  statNumberAmber: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#d97706',
  },
  statLabel: {
    color: '#6b7280',
  },
  offlineNotice: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 24,
  },
  offlineText: {
    color: '#1e40af',
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#bfdbfe',
    textAlign: 'center',
  },
});