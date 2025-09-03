import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, Alert, StyleSheet } from 'react-native';
import { BookOpen, ArrowLeft, Calendar, Users, Eye, Camera } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { ApiService, AttendanceRecord } from '../services/api';

type AttendanceHistoryNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AttendanceHistory'>;

export default function AttendanceHistoryScreen() {
  const navigation = useNavigation<AttendanceHistoryNavigationProp>();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAttendanceHistory();
  }, []);

  const loadAttendanceHistory = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const records = await ApiService.getAttendanceHistory();
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error loading attendance history:', error);
      Alert.alert('Error', 'Failed to load attendance history');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadAttendanceHistory(true);
  };

  const handleTakeNewAttendance = () => {
    navigation.navigate('TakeAttendance');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 80) return '#16a34a'; // Green
    if (percentage >= 60) return '#f59e0b'; // Yellow
    return '#dc2626'; // Red
  };

  const totalSessions = attendanceRecords.length;
  const totalStudentsProcessed = attendanceRecords.reduce((sum, record) => sum + record.total, 0);
  const averageAttendance = attendanceRecords.length > 0 
    ? attendanceRecords.reduce((sum, record) => sum + (record.total > 0 ? (record.present / record.total) * 100 : 0), 0) / attendanceRecords.length
    : 0;

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
            <Text style={styles.headerTitle}>Attendance History</Text>
            <TouchableOpacity onPress={handleTakeNewAttendance} style={styles.addButton}>
              <Camera color="white" size={24} />
            </TouchableOpacity>
          </View>

          {/* Stats Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{totalSessions}</Text>
                <Text style={styles.summaryLabel}>Sessions</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{Math.round(averageAttendance)}%</Text>
                <Text style={styles.summaryLabel}>Avg Attendance</Text>
              </View>
            </View>
          </View>

          {/* Attendance Records */}
          {attendanceRecords.length === 0 ? (
            <View style={styles.emptyState}>
              <BookOpen size={64} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No Attendance Records</Text>
              <Text style={styles.emptyMessage}>
                Start by taking attendance for your classes to see the history here
              </Text>
              <TouchableOpacity 
                style={styles.takeAttendanceButton}
                onPress={handleTakeNewAttendance}
              >
                <Camera color="white" size={20} />
                <Text style={styles.takeAttendanceButtonText}>Take First Attendance</Text>
              </TouchableOpacity>
            </View>
          ) : (
            attendanceRecords.map((record) => {
              const { date, time } = formatDateTime(record.date);
              const attendancePercentage = record.total > 0 ? (record.present / record.total) * 100 : 0;
              const attendanceColor = getAttendanceColor(attendancePercentage);
              
              return (
                <View key={record.id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <View style={styles.recordTitleRow}>
                      <Text style={styles.recordClass}>Class {record.classroom}</Text>
                      <View style={[styles.attendanceChip, { backgroundColor: `${attendanceColor}15` }]}>
                        <Text style={[styles.attendancePercent, { color: attendanceColor }]}>
                          {Math.round(attendancePercentage)}%
                        </Text>
                      </View>
                    </View>
                    <View style={styles.recordDateTime}>
                      <Calendar size={14} color="#6b7280" />
                      <Text style={styles.recordDate}>{date}</Text>
                      <Text style={styles.recordTime}>{time}</Text>
                    </View>
                  </View>

                  <View style={styles.recordStats}>
                    <View style={styles.statColumn}>
                      <View style={styles.statItem}>
                        <Text style={styles.statNumberGreen}>{record.present}</Text>
                        <Text style={styles.statLabelSmall}>Present</Text>
                      </View>
                    </View>
                    <View style={styles.statColumn}>
                      <View style={styles.statItem}>
                        <Text style={styles.statNumberRed}>{record.absent}</Text>
                        <Text style={styles.statLabelSmall}>Absent</Text>
                      </View>
                    </View>
                    <View style={styles.statColumn}>
                      <View style={styles.statItem}>
                        <Text style={styles.statNumberGray}>{record.total}</Text>
                        <Text style={styles.statLabelSmall}>Total</Text>
                      </View>
                    </View>
                  </View>

                  {/* Photo count indicator */}
                  {record.photoUris && record.photoUris.length > 0 && (
                    <View style={styles.photoInfo}>
                      <Eye size={14} color="#6b7280" />
                      <Text style={styles.photoCount}>
                        {record.photoUris.length} photo{record.photoUris.length !== 1 ? 's' : ''} processed
                      </Text>
                    </View>
                  )}

                  {/* Results Preview */}
                  {record.results && record.results.length > 0 && (
                    <View style={styles.resultsPreview}>
                      <Text style={styles.previewTitle}>Students:</Text>
                      <View style={styles.studentTags}>
                        {record.results.slice(0, 3).map((result, index) => (
                          <View 
                            key={index} 
                            style={[
                              styles.studentTag,
                              result.status === 'present' ? styles.presentTag : styles.absentTag
                            ]}
                          >
                            <Text 
                              style={[
                                styles.studentTagText,
                                result.status === 'present' ? styles.presentTagText : styles.absentTagText
                              ]}
                            >
                              {result.name}
                            </Text>
                          </View>
                        ))}
                        {record.results.length > 3 && (
                          <Text style={styles.moreStudents}>+{record.results.length - 3} more</Text>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}

          {/* Help Text */}
          {attendanceRecords.length > 0 && (
            <View style={styles.helpCard}>
              <Text style={styles.helpTitle}>📊 Understanding Your Data</Text>
              <Text style={styles.helpText}>
                • Records show attendance processed via AI analysis{'\n'}
                • Percentage colors: Green (≥80%), Yellow (≥60%), Red (&lt;60%){'\n'}
                • Pull down to refresh latest records{'\n'}
                • Tap camera + to process new attendance
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
  takeAttendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  takeAttendanceButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  recordCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    padding: 20,
    marginBottom: 16,
  },
  recordHeader: {
    marginBottom: 16,
  },
  recordTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordClass: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  attendanceChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  attendancePercent: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  recordDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  recordTime: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  recordStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 16,
  },
  statColumn: {
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumberGreen: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  statNumberRed: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  statNumberGray: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  statLabelSmall: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  photoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  photoCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  resultsPreview: {
    borderTopWidth: 1,
    borderColor: '#f3f4f6',
    paddingTop: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  studentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  studentTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  presentTag: {
    backgroundColor: '#dcfce7',
  },
  absentTag: {
    backgroundColor: '#fee2e2',
  },
  studentTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  presentTagText: {
    color: '#16a34a',
  },
  absentTagText: {
    color: '#dc2626',
  },
  moreStudents: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
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
