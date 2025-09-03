import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { Camera, Upload, Home, ArrowLeft, FileText, Plus, X } from 'lucide-react-native';
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
  const [photosUploaded, setPhotosUploaded] = useState(false);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [attendanceResults, setAttendanceResults] = useState<AttendanceResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [excelBlob, setExcelBlob] = useState<Blob | null>(null);

  // Debug effect to log photo state changes
  useEffect(() => {
    console.log('Photo state changed - URIs:', photoUris.length, 'Uploaded flag:', photosUploaded);
  }, [photoUris, photosUploaded]);

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
        mediaTypes: 'images',
        allowsEditing: false, // Disabled to allow consistent behavior with gallery
        quality: 0.8,
        aspect: [4, 3], // Standard photo aspect ratio
      });

      if (!result.canceled && result.assets[0]) {
        const newUri = result.assets[0].uri;
        console.log('Camera photo captured:', newUri);
        setPhotoUris(prev => [...prev, newUri]);
        setPhotosUploaded(true);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false, // Must be false when allowsMultipleSelection is true
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 10, // Limit to 10 photos max
      });

      if (!result.canceled && result.assets) {
        const newUris = result.assets.map(asset => asset.uri);
        console.log('Gallery photos selected:', newUris);
        setPhotoUris(prev => [...prev, ...newUris]);
        setPhotosUploaded(true);
      }
    } catch (error) {
      console.error('Error selecting photos:', error);
      Alert.alert('Error', 'Failed to select photos');
    }
  };

  const handleTakeAttendance = async () => {
    if (!classRoom) {
      Alert.alert('Missing Information', 'Please enter the class room');
      return;
    }

    if (photoUris.length === 0) {
      Alert.alert('Photos Required', 'Please capture or upload at least one class photo');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await ApiService.processAttendance({
        classroom: classRoom,
        photoUris: photoUris,
      });

      if (result.success && result.excelData) {
        // Store the Excel blob for download
        setExcelBlob(result.excelData);
        setShowResults(true);
        // Show success message and download option
        Alert.alert(
          'Attendance Processed Successfully',
          'Your attendance report is ready! You can download the Excel file.',
          [{ text: 'OK' }]
        );
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

  const handleDownloadExcel = async () => {
    if (!excelBlob) {
      Alert.alert('No Data', 'No Excel file available for download');
      return;
    }

    try {
      const result = await ApiService.downloadExcelFile(excelBlob, classRoom);
      
      if (result.success) {
        Alert.alert('Download Successful', result.message || 'Attendance report downloaded successfully!');
      } else {
        Alert.alert('Download Failed', result.message || 'Failed to download attendance report');
      }
    } catch (error) {
      console.error('Error downloading Excel:', error);
      Alert.alert('Error', 'Failed to download Excel file');
    }
  };

  const removePhoto = (index: number) => {
    console.log('Removing photo at index:', index);
    setPhotoUris(prev => {
      const newUris = [...prev];
      newUris.splice(index, 1);
      console.log('Photos after removal:', newUris);
      if (newUris.length === 0) {
        setPhotosUploaded(false);
        console.log('All photos removed, setting photosUploaded to false');
      }
      return newUris;
    });
  };

  const clearAllPhotos = () => {
    Alert.alert(
      'Clear All Photos',
      'Are you sure you want to remove all photos?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            setPhotoUris([]);
            setPhotosUploaded(false);
          }
        }
      ]
    );
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
                  <Text style={styles.photoLabel}>Class Photos * (Multiple photos recommended for better accuracy)</Text>
                  
                  <View style={styles.photoContainer}>
                    {photoUris.length > 0 ? (
                      <View style={styles.photoUploadedContainer}>
                        <ScrollView 
                          horizontal 
                          style={styles.photosScrollView}
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.photosScrollContent}
                        >
                          {photoUris.map((uri, index) => (
                            <View key={`photo-${index}`} style={styles.photoItem}>
                              <Image 
                                source={{ uri }}
                                style={styles.uploadedPhoto}
                                resizeMode="cover"
                                onError={(error) => {
                                  console.warn('Image loading error for URI:', uri, error.nativeEvent.error);
                                }}
                                onLoad={() => {
                                  console.log('Image loaded successfully:', uri);
                                }}
                              />
                              <TouchableOpacity
                                style={styles.removePhotoButton}
                                onPress={() => removePhoto(index)}
                              >
                                <X color="white" size={16} />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </ScrollView>
                        
                        <Text style={styles.photoUploadedText}>
                          {photoUris.length} photo{photoUris.length > 1 ? 's' : ''} uploaded successfully!
                        </Text>
                        
                        <View style={styles.photoActionButtons}>
                          <TouchableOpacity 
                            onPress={handlePhotoCapture}
                            style={styles.addMoreButton}
                          >
                            <Plus color="#1d4ed8" size={16} />
                            <Text style={styles.addMoreText}>Add More</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            onPress={clearAllPhotos}
                            style={styles.clearAllButton}
                          >
                            <Text style={styles.clearAllText}>Clear All</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={styles.photoUploadButton}
                        onPress={handlePhotoCapture}
                      >
                        <View style={styles.cameraIcon}>
                          <Camera color="#1e3c72" size={24} />
                        </View>
                        <Text style={styles.uploadButtonText}>Capture or Upload Class Photos</Text>
                        <Text style={styles.uploadButtonSubtext}>
                          Take multiple photos from different angles for better coverage
                        </Text>
                      </TouchableOpacity>
                    )}
                    
                    <Text style={styles.photoNote}>
                      Multiple photos from different angles improve attendance accuracy
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
                  <Text style={styles.instructionItem}>• Enter your class room information (e.g., 5A, 10B)</Text>
                  <Text style={styles.instructionItem}>• Capture multiple clear photos from different angles</Text>
                  <Text style={styles.instructionItem}>• More photos = better attendance accuracy</Text>
                  <Text style={styles.instructionItem}>• Download your Excel attendance report</Text>
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
                <Text style={styles.resultsTitle}>Attendance Processed Successfully!</Text>
                <Text style={styles.resultsClass}>Class: {classRoom}</Text>
              </View>

              {/* Success Message */}
              <View style={styles.successMessage}>
                <View style={styles.successIcon}>
                  <Upload color="#10b981" size={32} />
                </View>
                <Text style={styles.successTitle}>Processing Complete</Text>
                <Text style={styles.successDescription}>
                  Your attendance has been processed using {photoUris.length} classroom photo{photoUris.length > 1 ? 's' : ''}.
                  The detailed attendance report is ready for download.
                </Text>
              </View>

              {/* Download Information */}
              <View style={styles.downloadInfo}>
                <Text style={styles.downloadInfoTitle}>Excel Report Contains:</Text>
                <View style={styles.downloadInfoList}>
                  <Text style={styles.downloadInfoItem}>• Class attendance metadata</Text>
                  <Text style={styles.downloadInfoItem}>• Individual student attendance status</Text>
                  <Text style={styles.downloadInfoItem}>• Attendance summary statistics</Text>
                  <Text style={styles.downloadInfoItem}>• Date and time of processing</Text>
                </View>
              </View>

              {/* Download Button */}
              <TouchableOpacity 
                style={styles.downloadButton}
                onPress={handleDownloadExcel}
              >
                <FileText color="white" size={24} />
                <Text style={styles.downloadButtonText}>Download Excel Report</Text>
              </TouchableOpacity>
              
              {/* Back Button */}
              <TouchableOpacity 
                style={styles.backHomeButton}
                onPress={() => {
                  // Reset state
                  setShowResults(false);
                  setPhotoUris([]);
                  setPhotosUploaded(false);
                  setExcelBlob(null);
                  setClassRoom('');
                  console.log('State reset for new class processing');
                }}
              >
                <Text style={styles.backHomeButtonText}>Process Another Class</Text>
              </TouchableOpacity>
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
    borderRadius: 8,
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
  // New styles for multiple photo support
  photosScrollView: {
    marginBottom: 16,
  },
  photosScrollContent: {
    paddingHorizontal: 4,
  },
  photoItem: {
    position: 'relative',
    marginRight: 12,
    width: 120, // Fixed width for consistent sizing
    height: 120, // Fixed height for consistent sizing
    borderRadius: 8,
    overflow: 'hidden', // Ensure image stays within bounds
    backgroundColor: '#f3f4f6', // Background color while loading
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  photoActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 4,
  },
  addMoreText: {
    color: '#1d4ed8',
    fontSize: 14,
    fontWeight: '500',
  },
  clearAllButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearAllText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
  // New styles for results section
  successMessage: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 24,
  },
  successIcon: {
    backgroundColor: '#dcfce7',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#15803d',
    marginBottom: 8,
  },
  successDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  downloadInfo: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  downloadInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  downloadInfoList: {
    gap: 6,
  },
  downloadInfoItem: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  downloadButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  downloadButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
