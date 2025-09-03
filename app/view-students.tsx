import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, Alert, StyleSheet } from 'react-native';
import { Users, ArrowLeft, Trash2, Search, UserPlus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { ApiService, Student } from '../services/api';

type ViewStudentsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ViewStudents'>;

export default function ViewStudentsScreen() {
  const navigation = useNavigation<ViewStudentsNavigationProp>();
  const [students, setStudents] = useState<Student[]>([]);
  const [groupedStudents, setGroupedStudents] = useState<{[key: string]: Student[]}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const studentData = await ApiService.getStudents();
      setStudents(studentData);
      
      // Group students by classroom
      const grouped = studentData.reduce((acc, student) => {
        if (!acc[student.classroom]) {
          acc[student.classroom] = [];
        }
        acc[student.classroom].push(student);
        return acc;
      }, {} as {[key: string]: Student[]});
      
      // Sort students within each classroom by roll number
      Object.keys(grouped).forEach(classroom => {
        grouped[classroom].sort((a, b) => {
          const rollA = parseInt(a.rollNo) || 0;
          const rollB = parseInt(b.rollNo) || 0;
          return rollA - rollB;
        });
      });
      
      setGroupedStudents(grouped);
    } catch (error) {
      console.error('Error loading students:', error);
      Alert.alert('Error', 'Failed to load students');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadStudents(true);
  };

  const handleRegisterNew = () => {
    navigation.navigate('RegisterStudent');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const classroomNames = Object.keys(groupedStudents).sort();

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#1e3c72', '#2a5298']} 
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>View Students</Text>
            <TouchableOpacity onPress={handleRegisterNew} style={styles.addButton}>
              <UserPlus color="white" size={24} />
            </TouchableOpacity>
          </View>

          {/* Stats Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{students.length}</Text>
                <Text style={styles.summaryLabel}>Total Students</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{classroomNames.length}</Text>
                <Text style={styles.summaryLabel}>Classes</Text>
              </View>
            </View>
          </View>

          {/* Students by Classroom */}
          {students.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={64} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No Students Registered</Text>
              <Text style={styles.emptyMessage}>
                Start by registering students with their identification videos
              </Text>
              <TouchableOpacity 
                style={styles.registerButton}
                onPress={handleRegisterNew}
              >
                <UserPlus color="white" size={20} />
                <Text style={styles.registerButtonText}>Register First Student</Text>
              </TouchableOpacity>
            </View>
          ) : (
            classroomNames.map((classroom) => (
              <View key={classroom} style={styles.classroomCard}>
                <View style={styles.classroomHeader}>
                  <Text style={styles.classroomTitle}>Class {classroom}</Text>
                  <Text style={styles.classroomCount}>
                    {groupedStudents[classroom].length} student{groupedStudents[classroom].length !== 1 ? 's' : ''}
                  </Text>
                </View>
                
                <View style={styles.studentsList}>
                  {groupedStudents[classroom].map((student) => (
                    <View key={student.id} style={styles.studentCard}>
                      <View style={styles.studentInfo}>
                        <View style={styles.studentHeader}>
                          <Text style={styles.studentName}>{student.name}</Text>
                          <Text style={styles.rollNumber}>#{student.rollNo}</Text>
                        </View>
                        <Text style={styles.registrationDate}>
                          Registered: {formatDate(student.createdAt)}
                        </Text>
                        {student.videoUri && (
                          <View style={styles.videoStatus}>
                            <View style={styles.videoDot} />
                            <Text style={styles.videoText}>Video Ready</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}

          {/* Help Text */}
          {students.length > 0 && (
            <View style={styles.helpCard}>
              <Text style={styles.helpTitle}>💡 Quick Tips</Text>
              <Text style={styles.helpText}>
                • Pull down to refresh the student list{'\n'}
                • Students are grouped by their classroom{'\n'}
                • Video status shows AI readiness for attendance{'\n'}
                • Tap + to register more students
              </Text>
            </View>
          )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 12,
  },
  summaryCard: {
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  summaryLabel: {
    color: '#6b7280',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  registerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  classroomCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 24,
    overflow: 'hidden',
  },
  classroomHeader: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classroomTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  classroomCount: {
    color: '#6b7280',
    fontSize: 14,
  },
  studentsList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  studentCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  studentInfo: {
    flex: 1,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  rollNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  registrationDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  videoStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
    marginRight: 6,
  },
  videoText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
  },
  helpCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1d4ed8',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#1d4ed8',
    lineHeight: 20,
  },
});
