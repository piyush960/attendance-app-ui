import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import NetInfo from '@react-native-community/netinfo';
import { API_CONFIG, API_ENDPOINTS, TESTING_CONFIG } from '../config/api';

/**
 * API SERVICE WITH MIXED IMPLEMENTATION
 * 
 * This service combines real backend API calls with mock data for testing:
 * 
 * ✅ REAL API ENDPOINTS:
 * - registerStudent() → /vectordb/students/video
 * - processAttendance() → /attendance/images-attendance
 * - downloadExcelFile() → Handles Excel blob responses
 * 
 * 🧪 MOCK DATA FOR TESTING:
 * - getStudents() → Returns sample student data
 * - getAttendanceHistory() → Returns sample attendance records
 * - getClassroomStats() → Returns sample statistics for home screen
 * 
 * To disable mock data: Simply remove the mock implementations and 
 * make these functions return empty arrays/default values.
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
  photoUri?: string;
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
        // Create student object for local compatibility
        const newStudent: Student = {
          id: Date.now().toString(),
          name: data.name,
          rollNo: data.rollNo,
          classroom: data.classroom,
          videoUri: data.videoUri,
          createdAt: new Date().toISOString(),
        };

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

  // Get all students (with mock data for testing)
  async getStudents(classroom?: string): Promise<Student[]> {
    try {
      if (!TESTING_CONFIG.useMockData) {
        // If mock data is disabled, return empty array
        // TODO: Implement real API endpoint when available
        console.warn('getStudents: Real API endpoint not implemented. Enable mock data or implement backend endpoint.');
        return [];
      }
      
      // Return mock data for testing purposes
      // In a real implementation, this would come from your backend API
      
      const mockStudents: Student[] = [
        { id: '1', name: 'Aarav Patel', rollNo: '01', classroom: '5A', createdAt: new Date('2024-01-15').toISOString() },
        { id: '2', name: 'Aditi Sharma', rollNo: '02', classroom: '5A', createdAt: new Date('2024-01-16').toISOString() },
        { id: '3', name: 'Arjun Singh', rollNo: '03', classroom: '5A', createdAt: new Date('2024-01-17').toISOString() },
        { id: '4', name: 'Diya Kumar', rollNo: '04', classroom: '5A', createdAt: new Date('2024-01-18').toISOString() },
        { id: '5', name: 'Ishaan Reddy', rollNo: '05', classroom: '5A', createdAt: new Date('2024-01-19').toISOString() },
        { id: '6', name: 'Kiara Desai', rollNo: '06', classroom: '5A', createdAt: new Date('2024-01-20').toISOString() },
        { id: '7', name: 'Rohan Mehta', rollNo: '07', classroom: '5A', createdAt: new Date('2024-01-21').toISOString() },
        { id: '8', name: 'Saanvi Gupta', rollNo: '08', classroom: '5A', createdAt: new Date('2024-01-22').toISOString() },
        { id: '9', name: 'Vihaan Choudhary', rollNo: '09', classroom: '5A', createdAt: new Date('2024-01-23').toISOString() },
        { id: '10', name: 'Zara Khan', rollNo: '10', classroom: '5A', createdAt: new Date('2024-01-24').toISOString() },
        { id: '11', name: 'Ravi Kumar', rollNo: '01', classroom: '10B', createdAt: new Date('2024-01-25').toISOString() },
        { id: '12', name: 'Priya Singh', rollNo: '02', classroom: '10B', createdAt: new Date('2024-01-26').toISOString() },
        { id: '13', name: 'Ankur Sharma', rollNo: '03', classroom: '10B', createdAt: new Date('2024-01-27').toISOString() },
        { id: '14', name: 'Neha Joshi', rollNo: '04', classroom: '10B', createdAt: new Date('2024-01-28').toISOString() },
        { id: '15', name: 'Karan Bhatnagar', rollNo: '05', classroom: '10B', createdAt: new Date('2024-01-29').toISOString() },
        { id: '16', name: 'Pooja Agarwal', rollNo: '01', classroom: '8C', createdAt: new Date('2024-01-30').toISOString() },
        { id: '17', name: 'Vikram Rao', rollNo: '02', classroom: '8C', createdAt: new Date('2024-01-31').toISOString() },
        { id: '18', name: 'Sneha Verma', rollNo: '03', classroom: '8C', createdAt: new Date('2024-02-01').toISOString() },
      ];
      
      return new Promise((resolve) => {
        // Simulate API delay for realistic experience
        setTimeout(() => {
          if (classroom) {
            const filteredStudents = mockStudents.filter(
              s => s.classroom.toLowerCase() === classroom.toLowerCase()
            );
            resolve(filteredStudents);
          } else {
            resolve(mockStudents);
          }
        }, TESTING_CONFIG.mockDelays.students);
      });
    } catch (error) {
      console.error('Error getting students:', error);
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
          
          // For now, we'll return success with the blob
          // The UI will handle the download
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

  // Save attendance record (placeholder - attendance is now processed via Excel download)
  async saveAttendanceRecord(record: AttendanceRecord): Promise<void> {
    // This is no longer needed as attendance results are returned as Excel files
    // Keeping for backward compatibility
    console.log('Attendance record saved:', record.id);
  },

  // Get attendance history (with mock data for testing)
  async getAttendanceHistory(classroom?: string, limit: number = 20): Promise<AttendanceRecord[]> {
    try {
      if (!TESTING_CONFIG.useMockData) {
        // If mock data is disabled, return empty array
        // TODO: Implement real API endpoint when available
        console.warn('getAttendanceHistory: Real API endpoint not implemented. Enable mock data or implement backend endpoint.');
        return [];
      }
      
      // Return mock data for testing purposes
      // In a real implementation, this would come from your backend API
      
      const mockAttendanceRecords: AttendanceRecord[] = [
        {
          id: '1',
          classroom: '5A',
          date: new Date('2024-02-15T09:00:00').toISOString(),
          results: [
            { rollNo: '01', name: 'Aarav Patel', status: 'present' },
            { rollNo: '02', name: 'Aditi Sharma', status: 'present' },
            { rollNo: '03', name: 'Arjun Singh', status: 'absent' },
            { rollNo: '04', name: 'Diya Kumar', status: 'present' },
            { rollNo: '05', name: 'Ishaan Reddy', status: 'present' },
            { rollNo: '06', name: 'Kiara Desai', status: 'present' },
            { rollNo: '07', name: 'Rohan Mehta', status: 'absent' },
            { rollNo: '08', name: 'Saanvi Gupta', status: 'present' },
            { rollNo: '09', name: 'Vihaan Choudhary', status: 'present' },
            { rollNo: '10', name: 'Zara Khan', status: 'present' },
          ],
          present: 8,
          absent: 2,
          total: 10,
        },
        {
          id: '2',
          classroom: '10B',
          date: new Date('2024-02-15T10:30:00').toISOString(),
          results: [
            { rollNo: '01', name: 'Ravi Kumar', status: 'present' },
            { rollNo: '02', name: 'Priya Singh', status: 'present' },
            { rollNo: '03', name: 'Ankur Sharma', status: 'present' },
            { rollNo: '04', name: 'Neha Joshi', status: 'absent' },
            { rollNo: '05', name: 'Karan Bhatnagar', status: 'present' },
          ],
          present: 4,
          absent: 1,
          total: 5,
        },
        {
          id: '3',
          classroom: '8C',
          date: new Date('2024-02-14T09:15:00').toISOString(),
          results: [
            { rollNo: '01', name: 'Pooja Agarwal', status: 'present' },
            { rollNo: '02', name: 'Vikram Rao', status: 'present' },
            { rollNo: '03', name: 'Sneha Verma', status: 'present' },
          ],
          present: 3,
          absent: 0,
          total: 3,
        },
        {
          id: '4',
          classroom: '5A',
          date: new Date('2024-02-14T09:00:00').toISOString(),
          results: [
            { rollNo: '01', name: 'Aarav Patel', status: 'present' },
            { rollNo: '02', name: 'Aditi Sharma', status: 'absent' },
            { rollNo: '03', name: 'Arjun Singh', status: 'present' },
            { rollNo: '04', name: 'Diya Kumar', status: 'present' },
            { rollNo: '05', name: 'Ishaan Reddy', status: 'present' },
            { rollNo: '06', name: 'Kiara Desai', status: 'absent' },
            { rollNo: '07', name: 'Rohan Mehta', status: 'present' },
            { rollNo: '08', name: 'Saanvi Gupta', status: 'present' },
            { rollNo: '09', name: 'Vihaan Choudhary', status: 'present' },
            { rollNo: '10', name: 'Zara Khan', status: 'present' },
          ],
          present: 8,
          absent: 2,
          total: 10,
        },
      ];
      
      return new Promise((resolve) => {
        // Simulate API delay for realistic experience
        setTimeout(() => {
          let filteredRecords = mockAttendanceRecords;
          
          if (classroom) {
            filteredRecords = mockAttendanceRecords.filter(
              r => r.classroom.toLowerCase() === classroom.toLowerCase()
            );
          }
          
          const limitedRecords = filteredRecords.slice(0, limit);
          resolve(limitedRecords);
        }, TESTING_CONFIG.mockDelays.attendance);
      });
    } catch (error) {
      console.error('Error getting attendance history:', error);
      return [];
    }
  },

  // Get classroom statistics (with mock data for testing)
  async getClassroomStats(): Promise<{
    totalStudents: number;
    totalClasses: number;
    averageAttendance: number;
    recentAttendanceCount: number;
  }> {
    try {
      if (!TESTING_CONFIG.useMockData) {
        // If mock data is disabled, return default values
        // TODO: Implement real API endpoint when available
        console.warn('getClassroomStats: Real API endpoint not implemented. Enable mock data or implement backend endpoint.');
        return {
          totalStudents: 0,
          totalClasses: 0,
          averageAttendance: 0,
          recentAttendanceCount: 0,
        };
      }
      
      // Return mock data for testing purposes
      // In a real implementation, this would come from your backend API
      
      return new Promise((resolve) => {
        // Simulate API delay for realistic experience
        setTimeout(() => {
          resolve({
            totalStudents: 156, // Total registered students across all classes
            totalClasses: 12,   // Number of different classes (5A, 5B, 6A, etc.)
            averageAttendance: 78, // Average attendance percentage
            recentAttendanceCount: 24, // Number of recent attendance records
          });
        }, TESTING_CONFIG.mockDelays.stats);
      });
    } catch (error) {
      console.error('Error getting classroom stats:', error);
      return {
        totalStudents: 0,
        totalClasses: 0,
        averageAttendance: 0,
        recentAttendanceCount: 0,
      };
    }
  },
};

// Legacy compatibility - Initialize function (no longer needed)
export const initializeApp = async () => {
  console.log('App initialized with API-based backend');
};
