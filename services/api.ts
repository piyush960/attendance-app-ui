import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import NetInfo from '@react-native-community/netinfo';

const STUDENTS_KEY = '@attendance_app_students';
const ATTENDANCE_KEY = '@attendance_app_attendance';

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  classroom: string;
  videoUri?: string;
  createdAt: string;
}

export interface AttendanceResult {
  rollNo: string;
  name: string;
  status: 'present' | 'absent';
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

// Mock student data for demo purposes
const mockStudentData: Student[] = [
  { id: '1', name: 'Aarav Patel', rollNo: '01', classroom: '5A', createdAt: new Date().toISOString() },
  { id: '2', name: 'Aditi Sharma', rollNo: '02', classroom: '5A', createdAt: new Date().toISOString() },
  { id: '3', name: 'Arjun Singh', rollNo: '03', classroom: '5A', createdAt: new Date().toISOString() },
  { id: '4', name: 'Diya Kumar', rollNo: '04', classroom: '5A', createdAt: new Date().toISOString() },
  { id: '5', name: 'Ishaan Reddy', rollNo: '05', classroom: '5A', createdAt: new Date().toISOString() },
  { id: '6', name: 'Kiara Desai', rollNo: '06', classroom: '5A', createdAt: new Date().toISOString() },
  { id: '7', name: 'Rohan Mehta', rollNo: '07', classroom: '5A', createdAt: new Date().toISOString() },
  { id: '8', name: 'Saanvi Gupta', rollNo: '08', classroom: '5A', createdAt: new Date().toISOString() },
  { id: '9', name: 'Vihaan Choudhary', rollNo: '09', classroom: '5A', createdAt: new Date().toISOString() },
  { id: '10', name: 'Zara Khan', rollNo: '10', classroom: '5A', createdAt: new Date().toISOString() },
  { id: '11', name: 'Ravi Kumar', rollNo: '11', classroom: '10B', createdAt: new Date().toISOString() },
  { id: '12', name: 'Priya Singh', rollNo: '12', classroom: '10B', createdAt: new Date().toISOString() },
  { id: '13', name: 'Ankur Sharma', rollNo: '13', classroom: '10B', createdAt: new Date().toISOString() },
];

export const ApiService = {
  // Initialize mock data if not already present
  async initializeMockData(): Promise<void> {
    try {
      const existingStudents = await AsyncStorage.getItem(STUDENTS_KEY);
      if (!existingStudents) {
        await AsyncStorage.setItem(STUDENTS_KEY, JSON.stringify(mockStudentData));
      }
    } catch (error) {
      console.error('Error initializing mock data:', error);
    }
  },

  // Check network connectivity
  async isConnected(): Promise<boolean> {
    const networkState = await NetInfo.fetch();
    return networkState.isConnected ?? false;
  },

  // Register a new student
  async registerStudent(data: {
    name: string;
    rollNo: string;
    classroom: string;
    videoUri?: string;
  }): Promise<{ success: boolean; student?: Student; message?: string }> {
    return new Promise(async (resolve) => {
      setTimeout(async () => {
        try {
          // Get existing students
          const studentsString = await AsyncStorage.getItem(STUDENTS_KEY);
          const students: Student[] = studentsString ? JSON.parse(studentsString) : [];

          // Check if student with same roll number and classroom already exists
          const existingStudent = students.find(
            s => s.rollNo === data.rollNo && s.classroom === data.classroom
          );

          if (existingStudent) {
            resolve({ success: false, message: 'Student with this roll number already exists in the class' });
            return;
          }

          // Create new student
          const newStudent: Student = {
            id: Date.now().toString(),
            name: data.name,
            rollNo: data.rollNo,
            classroom: data.classroom,
            videoUri: data.videoUri,
            createdAt: new Date().toISOString(),
          };

          // Save student
          students.push(newStudent);
          await AsyncStorage.setItem(STUDENTS_KEY, JSON.stringify(students));

          resolve({ success: true, student: newStudent });
        } catch (error) {
          console.error('Error registering student:', error);
          resolve({ success: false, message: 'Failed to register student' });
        }
      }, 1500); // Simulate network delay
    });
  },

  // Get all students
  async getStudents(classroom?: string): Promise<Student[]> {
    try {
      const studentsString = await AsyncStorage.getItem(STUDENTS_KEY);
      const students: Student[] = studentsString ? JSON.parse(studentsString) : [];
      
      if (classroom) {
        return students.filter(s => s.classroom.toLowerCase() === classroom.toLowerCase());
      }
      
      return students;
    } catch (error) {
      console.error('Error getting students:', error);
      return [];
    }
  },

  // Process attendance from class photo
  async processAttendance(data: {
    classroom: string;
    photoUri?: string;
  }): Promise<{ success: boolean; results?: AttendanceResult[]; message?: string }> {
    return new Promise(async (resolve) => {
      setTimeout(async () => {
        try {
          // Get students for the classroom
          const students = await this.getStudents(data.classroom);
          
          if (students.length === 0) {
            resolve({ success: false, message: 'No students found for this classroom' });
            return;
          }

          // Generate mock attendance results (simulate face recognition)
          const results: AttendanceResult[] = students.map(student => ({
            rollNo: student.rollNo,
            name: student.name,
            status: Math.random() > 0.2 ? 'present' : 'absent' // 80% chance of being present
          }));

          // Create attendance record
          const attendanceRecord: AttendanceRecord = {
            id: Date.now().toString(),
            classroom: data.classroom,
            date: new Date().toISOString(),
            photoUri: data.photoUri,
            results,
            present: results.filter(r => r.status === 'present').length,
            absent: results.filter(r => r.status === 'absent').length,
            total: results.length,
          };

          // Save attendance record
          await this.saveAttendanceRecord(attendanceRecord);

          resolve({ success: true, results });
        } catch (error) {
          console.error('Error processing attendance:', error);
          resolve({ success: false, message: 'Failed to process attendance' });
        }
      }, 2000); // Simulate processing delay
    });
  },

  // Save attendance record
  async saveAttendanceRecord(record: AttendanceRecord): Promise<void> {
    try {
      const recordsString = await AsyncStorage.getItem(ATTENDANCE_KEY);
      const records: AttendanceRecord[] = recordsString ? JSON.parse(recordsString) : [];
      
      records.unshift(record); // Add to beginning of array
      
      // Keep only last 50 records
      if (records.length > 50) {
        records.splice(50);
      }
      
      await AsyncStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
    } catch (error) {
      console.error('Error saving attendance record:', error);
    }
  },

  // Get attendance history
  async getAttendanceHistory(classroom?: string, limit: number = 20): Promise<AttendanceRecord[]> {
    try {
      const recordsString = await AsyncStorage.getItem(ATTENDANCE_KEY);
      const records: AttendanceRecord[] = recordsString ? JSON.parse(recordsString) : [];
      
      let filteredRecords = records;
      
      if (classroom) {
        filteredRecords = records.filter(r => r.classroom.toLowerCase() === classroom.toLowerCase());
      }
      
      return filteredRecords.slice(0, limit);
    } catch (error) {
      console.error('Error getting attendance history:', error);
      return [];
    }
  },

  // Export attendance to Excel (mock)
  async exportToExcel(attendanceRecord: AttendanceRecord): Promise<{ success: boolean; filePath?: string; message?: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // In a real app, this would generate an Excel file
        resolve({ 
          success: true, 
          filePath: FileSystem.documentDirectory + `attendance_${attendanceRecord.classroom}_${new Date().toISOString().split('T')[0]}.xlsx`,
          message: 'Attendance exported to Excel successfully!'
        });
      }, 1000);
    });
  },

  // Send attendance via email (mock)
  async emailAttendance(attendanceRecord: AttendanceRecord, emailAddress?: string): Promise<{ success: boolean; message?: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // In a real app, this would send an email via the backend API
        resolve({ 
          success: true, 
          message: `Attendance report for ${attendanceRecord.classroom} sent successfully${emailAddress ? ` to ${emailAddress}` : ''}!`
        });
      }, 1500);
    });
  },

  // Get classroom statistics
  async getClassroomStats(): Promise<{
    totalStudents: number;
    totalClasses: number;
    averageAttendance: number;
    recentAttendanceCount: number;
  }> {
    try {
      const students = await this.getStudents();
      const attendanceRecords = await this.getAttendanceHistory();
      
      const uniqueClasses = [...new Set(students.map(s => s.classroom))].length;
      
      // Calculate average attendance from recent records
      let totalPresentPercentage = 0;
      let recordCount = 0;
      
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
