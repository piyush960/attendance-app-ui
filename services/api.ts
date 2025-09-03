import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import NetInfo from '@react-native-community/netinfo';
import { API_CONFIG, API_ENDPOINTS } from '../config/api';

// Local storage keys
const STUDENTS_STORAGE_KEY = '@attendance_app_students';
const ATTENDANCE_STORAGE_KEY = '@attendance_app_attendance';

/**
 * API SERVICE WITH REAL BACKEND + LOCAL STORAGE
 * 
 * This service uses:
 * ✅ REAL API ENDPOINTS for processing:
 * - registerStudent() → /vectordb/students/video (then stores locally)
 * - processAttendance() → /attendance/images-attendance (then stores locally)
 * - downloadExcelFile() → Handles Excel blob responses
 * 
 * 💾 LOCAL STORAGE for data persistence:
 * - getStudents() → Returns locally stored student data
 * - getAttendanceHistory() → Returns locally stored attendance records
 * - getClassroomStats() → Calculates stats from local data
 */

// API Request/Response Interfaces
export interface RegisterStudentRequest {
  name: string;
  roll_number: string;
  division: string;
  standard: string;
  video: any; // File blob
  min_required_images?: number;
  frame_interval?: number;
  max_frames?: number;
}

export interface RegisterStudentResponse {
  status: 'success' | 'error';
  message: string;
  video_info?: {
    duration: number;
    frames_extracted: number;
    faces_detected: number;
    unique_embeddings: number;
  };
  processing_summary?: {
    successful_frames: number;
    failed_frames: number;
    total_frames: number;
  };
}

export interface AttendanceRequest {
  standard: string;
  division: string;
  images: any[]; // File blobs
}

export interface AttendanceResult {
  rollNo: string;
  name: string;
  status: 'present' | 'absent';
}

// Legacy interfaces for compatibility
export interface Student {
  id: string;
  name: string;
  rollNo: string;
  classroom: string;
  videoUri?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  classroom: string;
  date: string;
  photoUri?: string; // Legacy single photo support
  photoUris?: string[]; // New multiple photos support
  results: AttendanceResult[];
  present: number;
  absent: number;
  total: number;
}

// Helper function to create form data
const createFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value !== undefined && value !== null) {
      if (key === 'video' || key === 'images') {
        // Handle file uploads
        if (Array.isArray(value)) {
          // Multiple files (images)
          value.forEach((file, index) => {
            formData.append(key, file);
          });
        } else {
          // Single file (video)
          formData.append(key, value);
        }
      } else {
        formData.append(key, value.toString());
      }
    }
  });
  
  return formData;
};

// Helper function to create file object from URI
const createFileFromUri = async (uri: string, type: 'video' | 'image'): Promise<any> => {
  const filename = uri.split('/').pop() || 'file';
  const fileType = type === 'video' ? 'video/mp4' : 'image/jpeg';
  
  return {
    uri,
    type: fileType,
    name: filename,
  };
};

export const ApiService = {
  // Check network connectivity
  async isConnected(): Promise<boolean> {
    const networkState = await NetInfo.fetch();
    return networkState.isConnected ?? false;
  },

  // Register a new student with video
  async registerStudent(data: {
    name: string;
    rollNo: string;
    classroom: string; // This will be parsed into standard and division
    videoUri?: string;
    minRequiredImages?: number;
    frameInterval?: number;
    maxFrames?: number;
  }): Promise<{ success: boolean; student?: Student; message?: string; response?: RegisterStudentResponse }> {
    try {
      if (!data.videoUri) {
        return { success: false, message: 'Video is required for student registration' };
      }

      // Parse classroom into standard and division
      const classroomMatch = data.classroom.match(/^([0-9]+)([A-Z])$/);
      if (!classroomMatch) {
        return { success: false, message: 'Classroom format should be like "5A", "10B", etc.' };
      }
      
      const [, standard, division] = classroomMatch;
      
      // Create file object from video URI
      const videoFile = await createFileFromUri(data.videoUri, 'video');
      
      // Prepare form data
      const formData = createFormData({
        name: data.name,
        roll_number: data.rollNo,
        division: division,
        standard: standard + 'th',
        video: videoFile,
        min_required_images: data.minRequiredImages || 5,
        frame_interval: data.frameInterval || 30,
        max_frames: data.maxFrames || 100,
      });

      const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.registerStudent}`, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type for form data, let the browser set it
        },
      });

      const responseData: RegisterStudentResponse = await response.json();

      if (response.ok && responseData.status === 'success') {
        // Create student object for local storage
          const newStudent: Student = {
            id: Date.now().toString(),
            name: data.name,
            rollNo: data.rollNo,
            classroom: data.classroom,
            videoUri: data.videoUri,
            createdAt: new Date().toISOString(),
          };

        // Store student in local storage
        await this.storeStudentLocally(newStudent);

        return { 
          success: true, 
          student: newStudent, 
          message: responseData.message,
          response: responseData 
        };
      } else {
        return { 
          success: false, 
          message: responseData.message || 'Failed to register student' 
        };
      }
        } catch (error) {
          console.error('Error registering student:', error);
      return { success: false, message: 'Network error. Please check your connection and try again.' };
    }
  },

  // Store student in local storage
  async storeStudentLocally(student: Student): Promise<void> {
    try {
      const existingStudents = await this.getStudents();
      const updatedStudents = [...existingStudents, student];
      await AsyncStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(updatedStudents));
      console.log('Student stored locally:', student.name);
    } catch (error) {
      console.error('Error storing student locally:', error);
    }
  },

  // Get all students from local storage
  async getStudents(classroom?: string): Promise<Student[]> {
    try {
      const studentsString = await AsyncStorage.getItem(STUDENTS_STORAGE_KEY);
      const students: Student[] = studentsString ? JSON.parse(studentsString) : [];
      
      if (classroom) {
        return students.filter(s => s.classroom.toLowerCase() === classroom.toLowerCase());
      }
      
      return students;
    } catch (error) {
      console.error('Error getting students from local storage:', error);
      return [];
    }
  },

  // Process attendance from class photos
  async processAttendance(data: {
    classroom: string;
    photoUris: string[];
  }): Promise<{ success: boolean; results?: AttendanceResult[]; message?: string; excelData?: Blob }> {
    try {
      if (!data.photoUris || data.photoUris.length === 0) {
        return { success: false, message: 'At least one photo is required for attendance processing' };
      }

      // Parse classroom into standard and division
      const classroomMatch = data.classroom.match(/^([0-9]+)([A-Z])$/);
      if (!classroomMatch) {
        return { success: false, message: 'Classroom format should be like "5A", "10B", etc.' };
      }
      
      const [, standard, division] = classroomMatch;
      
      // Create file objects from photo URIs
      const imageFiles = await Promise.all(
        data.photoUris.map(uri => createFileFromUri(uri, 'image'))
      );
      
      // Prepare form data
      const formData = createFormData({
        standard: standard + 'th',
        division: division,
        images: imageFiles,
      });

      const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.takeAttendance}`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // Check if response is Excel file
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('spreadsheetml')) {
          // Response is Excel file
          const excelBlob = await response.blob();
          
          // Create attendance record from processed data
          const attendanceRecord: AttendanceRecord = {
            id: Date.now().toString(),
            classroom: data.classroom,
            date: new Date().toISOString(),
            photoUris: data.photoUris,
            results: [], // Excel contains the detailed results
            present: 0, // Will be calculated from Excel if needed
            absent: 0,
            total: 0,
          };

          // Store attendance record locally
          await this.storeAttendanceRecordLocally(attendanceRecord);
          
          return { 
            success: true, 
            results: [], // Results are in the Excel file
            message: 'Attendance processed successfully',
            excelData: excelBlob
          };
        } else {
          return { success: false, message: 'Unexpected response format' };
        }
      } else {
        const errorData = await response.json();
        return { 
          success: false, 
          message: errorData.detail || 'Failed to process attendance' 
        };
      }
        } catch (error) {
          console.error('Error processing attendance:', error);
      return { success: false, message: 'Network error. Please check your connection and try again.' };
    }
  },

  // Download Excel file from blob
  async downloadExcelFile(excelBlob: Blob, classroom: string): Promise<{ success: boolean; filePath?: string; message?: string }> {
    try {
      // Create filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `attendance_${classroom}_${timestamp}.xlsx`;
      const filePath = `${FileSystem.documentDirectory}${filename}`;
      
      // Convert blob to base64
      const reader = new FileReader();
      
      return new Promise((resolve) => {
        reader.onload = async () => {
          try {
            const base64Data = (reader.result as string).split(',')[1];
            
            // Write file
            await FileSystem.writeAsStringAsync(filePath, base64Data, {
              encoding: FileSystem.EncodingType.Base64,
            });
            
            // Share the file
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(filePath, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: 'Save Attendance Report',
              });
            }
            
            resolve({
              success: true,
              filePath,
              message: 'Attendance report downloaded successfully!'
            });
          } catch (error) {
            console.error('Error saving Excel file:', error);
            resolve({
              success: false,
              message: 'Failed to save Excel file'
            });
          }
        };
        
        reader.onerror = () => {
          resolve({
            success: false,
            message: 'Failed to process Excel file'
          });
        };
        
        reader.readAsDataURL(excelBlob);
      });
    } catch (error) {
      console.error('Error downloading Excel file:', error);
      return {
        success: false,
        message: 'Failed to download Excel file'
      };
    }
  },

  // Store attendance record in local storage
  async storeAttendanceRecordLocally(record: AttendanceRecord): Promise<void> {
    try {
      const existingRecords = await this.getAttendanceHistory();
      const updatedRecords = [record, ...existingRecords]; // Add to beginning
      
      // Keep only last 100 records to avoid storage bloat
      if (updatedRecords.length > 100) {
        updatedRecords.splice(100);
      }
      
      await AsyncStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(updatedRecords));
      console.log('Attendance record stored locally:', record.classroom, record.date);
    } catch (error) {
      console.error('Error storing attendance record locally:', error);
    }
  },

  // Save attendance record (legacy compatibility)
  async saveAttendanceRecord(record: AttendanceRecord): Promise<void> {
    await this.storeAttendanceRecordLocally(record);
  },

    // Get attendance history from local storage
  async getAttendanceHistory(classroom?: string, limit: number = 20): Promise<AttendanceRecord[]> {
    try {
      const recordsString = await AsyncStorage.getItem(ATTENDANCE_STORAGE_KEY);
      const records: AttendanceRecord[] = recordsString ? JSON.parse(recordsString) : [];
      
      let filteredRecords = records;
      
      if (classroom) {
        filteredRecords = records.filter(
          r => r.classroom.toLowerCase() === classroom.toLowerCase()
        );
      }
      
      return filteredRecords.slice(0, limit);
    } catch (error) {
      console.error('Error getting attendance history from local storage:', error);
      return [];
    }
  },

  // Get classroom statistics from local storage data
  async getClassroomStats(): Promise<{
    totalStudents: number;
    totalClasses: number;
    averageAttendance: number;
    recentAttendanceCount: number;
  }> {
    try {
      const students = await this.getStudents();
      const attendanceRecords = await this.getAttendanceHistory();
      
      // Calculate unique classes
      const uniqueClasses = [...new Set(students.map(s => s.classroom))].length;
      
      // Calculate average attendance from recent records
      let totalPresentPercentage = 0;
      let recordCount = 0;
      
      // Use last 10 records for average calculation
      attendanceRecords.slice(0, 10).forEach(record => {
        if (record.total > 0) {
          totalPresentPercentage += (record.present / record.total) * 100;
          recordCount++;
        }
      });
      
      const averageAttendance = recordCount > 0 ? totalPresentPercentage / recordCount : 0;
      
      return {
        totalStudents: students.length,
        totalClasses: uniqueClasses,
        averageAttendance: Math.round(averageAttendance),
        recentAttendanceCount: attendanceRecords.length,
      };
    } catch (error) {
      console.error('Error calculating classroom stats from local storage:', error);
      return {
        totalStudents: 0,
        totalClasses: 0,
        averageAttendance: 0,
        recentAttendanceCount: 0,
      };
    }
  },
};

// Clear all local storage (for testing/reset purposes)
export const clearAllLocalData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STUDENTS_STORAGE_KEY);
    await AsyncStorage.removeItem(ATTENDANCE_STORAGE_KEY);
    console.log('All local data cleared');
  } catch (error) {
    console.error('Error clearing local data:', error);
  }
};

// Legacy compatibility - Initialize function (no longer needed)
export const initializeApp = async () => {
  console.log('App initialized with real API + local storage backend');
};
