import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Camera, Upload, User, Hash, Home, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { ApiService } from '../services/api';
import * as ImagePicker from 'expo-image-picker';

type RegisterStudentNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RegisterStudent'>;

export default function RegisterStudentScreen() {
  const navigation = useNavigation<RegisterStudentNavigationProp>();
  const [studentName, setStudentName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [classRoom, setClassRoom] = useState('');
  const [videoUploaded, setVideoUploaded] = useState(false);
  const [videoUri, setVideoUri] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const handleVideoCapture = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is required to capture student videos.');
        return;
      }

      Alert.alert(
        'Capture Student Video',
        'Choose how to add the student identification video',
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
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 30,
      });

      if (!result.canceled && result.assets[0]) {
        setVideoUri(result.assets[0].uri);
        setVideoUploaded(true);
      }
    } catch (error) {
      console.error('Error capturing video:', error);
      Alert.alert('Error', 'Failed to capture video');
    }
  };

  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setVideoUri(result.assets[0].uri);
        setVideoUploaded(true);
      }
    } catch (error) {
      console.error('Error selecting video:', error);
      Alert.alert('Error', 'Failed to select video');
    }
  };

  const handleRegister = async () => {
    if (!studentName || !rollNo || !classRoom) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    if (!videoUploaded) {
      Alert.alert('Video Required', 'Please upload a video of the student for face recognition');
      return;
    }

    setIsLoading(true);

    try {
      const result = await ApiService.registerStudent({
        name: studentName,
        rollNo: rollNo,
        classroom: classRoom,
        videoUri: videoUri,
      });

      if (result.success) {
        Alert.alert(
          'Registration Successful',
          `Student ${studentName} has been registered successfully!`,
          [
            { 
              text: 'OK', 
              onPress: () => {
                setStudentName('');
                setRollNo('');
                setClassRoom('');
                setVideoUploaded(false);
                setVideoUri(undefined);
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert('Registration Failed', result.message || 'Failed to register student');
      }
    } catch (error) {
      console.error('Error registering student:', error);
      Alert.alert('Error', 'An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
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
            <Text style={styles.headerTitle}>Register Student</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Student Information</Text>

            {/* Student Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                <User size={16} color="#6b7280" /> Student Name *
              </Text>
              <TextInput
                value={studentName}
                onChangeText={setStudentName}
                placeholder="Enter student's full name"
                style={styles.textInput}
              />
            </View>

            {/* Roll No */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                <Hash size={16} color="#6b7280" /> Roll No *
              </Text>
              <TextInput
                value={rollNo}
                onChangeText={setRollNo}
                placeholder="Enter roll number"
                keyboardType="numeric"
                style={styles.textInput}
              />
            </View>

            {/* Class Room */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                <Home size={16} color="#6b7280" /> Class Room *
              </Text>
              <TextInput
                value={classRoom}
                onChangeText={setClassRoom}
                placeholder="Enter class/section"
                style={styles.textInput}
              />
            </View>

            {/* Video Upload Section */}
            <View style={styles.videoSection}>
              <Text style={styles.videoLabel}>Student Identification Video *</Text>
              
              <View style={styles.videoContainer}>
                {videoUploaded ? (
                  <View style={styles.videoUploadedContainer}>
                    <View style={styles.videoUploadedBox}>
                      <View style={styles.uploadSuccessIcon}>
                        <Upload color="#10b981" size={24} />
                      </View>
                      <Text style={styles.videoUploadedText}>Video Uploaded Successfully!</Text>
                      <Text style={styles.videoReadyText}>Face recognition ready</Text>
                    </View>
                    <TouchableOpacity 
                      onPress={handleVideoCapture}
                      style={styles.changeVideoButton}
                    >
                      <Text style={styles.changeVideoText}>Change Video</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.videoUploadButton}
                    onPress={handleVideoCapture}
                  >
                    <View style={styles.cameraIcon}>
                      <Camera color="#1e3c72" size={24} />
                    </View>
                    <Text style={styles.uploadButtonText}>Upload Student Video</Text>
                    <Text style={styles.uploadButtonSubtext}>
                      Capture or upload a short video of the student's face
                    </Text>
                  </TouchableOpacity>
                )}
                
                <Text style={styles.videoNote}>
                  Video will be used for face recognition during attendance
                </Text>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={styles.loadingText}>Registering...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Register Student</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Instructions Card */}
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>Registration Tips</Text>
            <View style={styles.instructionsList}>
              <Text style={styles.instructionItem}>• Ensure good lighting when recording the student video</Text>
              <Text style={styles.instructionItem}>• Capture clear front-facing view of student's face</Text>
              <Text style={styles.instructionItem}>• Video should be at least 5 seconds long</Text>
              <Text style={styles.instructionItem}>• All fields marked with * are required</Text>
            </View>
          </View>

          {/* Offline Notice */}
          <View style={styles.offlineNotice}>
            <Text style={styles.offlineText}>
              ✅ Works offline - Data will sync when connection is available
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
  videoSection: {
    marginBottom: 24,
  },
  videoLabel: {
    color: '#374151',
    fontWeight: '500',
    marginBottom: 12,
    fontSize: 16,
  },
  videoContainer: {
    alignItems: 'center',
  },
  videoUploadedContainer: {
    width: '100%',
  },
  videoUploadedBox: {
    width: '100%',
    height: 192,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#86efac',
    marginBottom: 12,
  },
  uploadSuccessIcon: {
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  videoUploadedText: {
    color: '#15803d',
    fontWeight: '500',
  },
  videoReadyText: {
    color: '#16a34a',
    fontSize: 14,
    marginTop: 4,
  },
  changeVideoButton: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
  },
  changeVideoText: {
    color: '#1d4ed8',
    fontSize: 14,
  },
  videoUploadButton: {
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
  videoNote: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#60a5fa',
  },
  submitButtonText: {
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
});
