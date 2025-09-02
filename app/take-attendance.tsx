import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { Camera, Upload, Home, ArrowLeft, FileText, Mail } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { ApiService, AttendanceResult } from '../services/api';
import * as ImagePicker from 'expo-image-picker';

type TakeAttendanceNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TakeAttendance'>;

export default function TakeAttendanceScreen() {
  const navigation = useNavigation<TakeAttendanceNavigationProp>();
  const [classRoom, setClassRoom] = useState('');
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [attendanceResults, setAttendanceResults] = useState<AttendanceResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePhotoCapture = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is required to capture class photos.');
        return;
      }

      Alert.alert(
        'Capture Class Photo',
        'Choose how to add the class photo',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Camera', onPress: () => openCamera() },
          { text: 'Gallery', onPress: () => openGallery() },
        ]
      );
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request camera permissions');
    }
  };

  const openCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        setPhotoUploaded(true);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        setPhotoUploaded(true);
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert('Error', 'Failed to select photo');
    }
  };

  const handleTakeAttendance = async () => {
    if (!classRoom) {
      Alert.alert('Missing Information', 'Please enter the class room');
      return;
    }

    if (!photoUploaded) {
      Alert.alert('Photo Required', 'Please capture or upload a class photo');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await ApiService.processAttendance({
        classroom: classRoom,
        photoUri: photoUri,
      });

      if (result.success && result.results) {
        setAttendanceResults(result.results);
        setShowResults(true);
      } else {
        Alert.alert('Processing Failed', result.message || 'Failed to process attendance');
      }
    } catch (error) {
      console.error('Error processing attendance:', error);
      Alert.alert('Error', 'An error occurred while processing attendance. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportToExcel = async () => {
    try {
      const attendanceRecord = {
        id: Date.now().toString(),
        classroom: classRoom,
        date: new Date().toISOString(),
        photoUri: photoUri,
        results: attendanceResults,
        present: attendanceResults.filter(r => r.status === 'present').length,
        absent: attendanceResults.filter(r => r.status === 'absent').length,
        total: attendanceResults.length,
      };

      const result = await ApiService.exportToExcel(attendanceRecord);
      
      if (result.success) {
        Alert.alert('Export Successful', result.message || 'Attendance exported to Excel successfully!');
      } else {
        Alert.alert('Export Failed', result.message || 'Failed to export attendance');
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      Alert.alert('Error', 'Failed to export attendance to Excel');
    }
  };

  const handleEmailAttendance = async () => {
    try {
      const attendanceRecord = {
        id: Date.now().toString(),
        classroom: classRoom,
        date: new Date().toISOString(),
        photoUri: photoUri,
        results: attendanceResults,
        present: attendanceResults.filter(r => r.status === 'present').length,
        absent: attendanceResults.filter(r => r.status === 'absent').length,
        total: attendanceResults.length,
      };

      const result = await ApiService.emailAttendance(attendanceRecord);
      
      if (result.success) {
        Alert.alert('Email Sent', result.message || 'Attendance report sent successfully!');
      } else {
        Alert.alert('Email Failed', result.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert('Error', 'Failed to send attendance via email');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#1e3c72', '#2a5298']} 
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Take Attendance</Text>
          </View>

          {!showResults ? (
            <>
              {/* Class Information Card */}
              <View style={styles.formCard}>
                <Text style={styles.cardTitle}>Class Information</Text>

                {/* Class Room Input */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>
                    <Home size={16} color="#6b7280" /> Class Room *
                  </Text>
                  <TextInput
                    value={classRoom}
                    onChangeText={setClassRoom}
                    placeholder="Enter class/section (e.g., 5A, 10B)"
                    style={styles.textInput}
                  />
                </View>

                {/* Photo Upload Section */}
                <View style={styles.photoSection}>
                  <Text style={styles.photoLabel}>Class Photo *</Text>
                  
                  <View style={styles.photoContainer}>
                    {photoUploaded ? (
                      <View style={styles.photoUploadedContainer}>
                        <View style={styles.photoUploadedBox}>
                          {photoUri ? (
                            <Image 
                              source={{ uri: photoUri }}
                              style={styles.uploadedPhoto}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.photoReadyContainer}>
                              <Upload color="#10b981" size={24} />
                              <Text style={styles.photoReadyText}>Photo Ready</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.photoUploadedText}>Photo Uploaded Successfully!</Text>
                        <TouchableOpacity 
                          onPress={handlePhotoCapture}
                          style={styles.changePhotoButton}
                        >
                          <Text style={styles.changePhotoText}>Change Photo</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={styles.photoUploadButton}
                        onPress={handlePhotoCapture}
                      >
                        <View style={styles.cameraIcon}>
                          <Camera color="#1e3c72" size={24} />
                        </View>
                        <Text style={styles.uploadButtonText}>Capture or Upload Class Photo</Text>
                        <Text style={styles.uploadButtonSubtext}>
                          Take a photo of your class or upload an existing one
                        </Text>
                      </TouchableOpacity>
                    )}
                    
                    <Text style={styles.photoNote}>
                      Photo will be used to identify present students
                    </Text>
                  </View>
                </View>

                {/* Take Attendance Button */}
                <TouchableOpacity 
                  style={[styles.processButton, isProcessing && styles.processButtonDisabled]}
                  onPress={handleTakeAttendance}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="white" />
                      <Text style={styles.loadingText}>Processing...</Text>
                    </View>
                  ) : (
                    <Text style={styles.processButtonText}>Process Attendance</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Instructions Card */}
              <View style={styles.instructionsCard}>
                <Text style={styles.instructionsTitle}>How It Works</Text>
                <View style={styles.instructionsList}>
                  <Text style={styles.instructionItem}>• Enter your class room information</Text>
                  <Text style={styles.instructionItem}>• Capture a clear photo of your entire class</Text>
                  <Text style={styles.instructionItem}>• Our system will identify present students</Text>
                  <Text style={styles.instructionItem}>• Review and export attendance results</Text>
                </View>
              </View>

              {/* Offline Notice */}
              <View style={styles.offlineNotice}>
                <Text style={styles.offlineText}>
                  ✅ Works offline - Data will sync when connection is available
                </Text>
              </View>
            </>
          ) : (
            /* Results Section */
            <View style={styles.resultsCard}>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>Attendance Results</Text>
                <Text style={styles.resultsClass}>Class: {classRoom}</Text>
              </View>

              {/* Summary Stats */}
              <View style={styles.summaryStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumberGreen}>
                    {attendanceResults.filter(s => s.status === 'present').length}
                  </Text>
                  <Text style={styles.statLabel}>Present</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumberRed}>
                    {attendanceResults.filter(s => s.status === 'absent').length}
                  </Text>
                  <Text style={styles.statLabel}>Absent</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumberGray}>
                    {attendanceResults.length}
                  </Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
              </View>

              {/* Attendance Table Header */}
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>Roll</Text>
                <Text style={[styles.tableHeaderText, styles.tableHeaderName]}>Name</Text>
                <Text style={styles.tableHeaderText}>Status</Text>
              </View>

              {/* Attendance List */}
              <ScrollView style={styles.attendanceList}>
                {attendanceResults.map((student) => (
                  <View key={student.rollNo} style={styles.attendanceRow}>
                    <Text style={styles.rollNumber}>{student.rollNo}</Text>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <View style={[
                      styles.statusBadge,
                      student.status === 'present' ? styles.presentBadge : styles.absentBadge
                    ]}>
                      <Text style={[
                        styles.statusText,
                        student.status === 'present' ? styles.presentText : styles.absentText
                      ]}>
                        {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={styles.exportButton}
                    onPress={handleExportToExcel}
                  >
                    <FileText color="white" size={20} />
                    <Text style={styles.exportButtonText}>Export to Excel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.emailButton}
                    onPress={handleEmailAttendance}
                  >
                    <Mail color="white" size={20} />
                    <Text style={styles.emailButtonText}>Email Report</Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  style={styles.backHomeButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.backHomeButtonText}>Back to Home</Text>
                </TouchableOpacity>
              </View>
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
    marginBottom: 32,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  formCard: {
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
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    color: '#374151',
    fontWeight: '500',
    marginBottom: 8,
    fontSize: 16,
  },
  textInput: {
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#1f2937',
    fontSize: 16,
  },
  photoSection: {
    marginBottom: 24,
  },
  photoLabel: {
    color: '#374151',
    fontWeight: '500',
    marginBottom: 12,
    fontSize: 16,
  },
  photoContainer: {
    alignItems: 'center',
  },
  photoUploadedContainer: {
    width: '100%',
  },
  photoUploadedBox: {
    width: '100%',
    height: 192,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#86efac',
    marginBottom: 16,
    overflow: 'hidden',
  },
  uploadedPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  photoReadyContainer: {
    alignItems: 'center',
  },
  photoReadyText: {
    color: '#15803d',
    fontWeight: '500',
    marginTop: 8,
  },
  photoUploadedText: {
    color: '#15803d',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  changePhotoButton: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
  },
  changePhotoText: {
    color: '#1d4ed8',
    fontSize: 14,
  },
  photoUploadButton: {
    width: '100%',
    height: 192,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#93c5fd',
    borderStyle: 'dashed',
  },
  cameraIcon: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  uploadButtonText: {
    color: '#1d4ed8',
    fontWeight: '500',
  },
  uploadButtonSubtext: {
    color: '#2563eb',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  photoNote: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  processButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  processButtonDisabled: {
    backgroundColor: '#60a5fa',
  },
  processButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
  },
  instructionsCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    padding: 24,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 12,
  },
  instructionsList: {
    gap: 8,
  },
  instructionItem: {
    color: '#1d4ed8',
  },
  offlineNotice: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  offlineText: {
    color: '#15803d',
    textAlign: 'center',
    fontWeight: '500',
  },
  resultsCard: {
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
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  resultsClass: {
    color: '#6b7280',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
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
    color: '#1f2937',
  },
  statLabel: {
    color: '#6b7280',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    color: '#6b7280',
    width: 48,
  },
  tableHeaderName: {
    flex: 1,
    width: 'auto',
  },
  attendanceList: {
    marginBottom: 24,
    maxHeight: 320,
  },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rollNumber: {
    color: '#1f2937',
    fontWeight: '500',
    width: 48,
  },
  studentName: {
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  presentBadge: {
    backgroundColor: '#dcfce7',
  },
  absentBadge: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontWeight: '500',
  },
  presentText: {
    color: '#15803d',
  },
  absentText: {
    color: '#dc2626',
  },
  actionButtons: {
    gap: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 16,
  },
  exportButton: {
    flex: 1,
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  exportButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emailButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  emailButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  backHomeButton: {
    backgroundColor: '#6b7280',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backHomeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
