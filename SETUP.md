# SchoolTrack - Attendance App Setup Guide

## 🚀 Quick Start

### 1. Configure Your Backend API

**Option A: Update app.json (Recommended)**
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-ngrok-url.ngrok-free.app"
    }
  }
}
```

**Option B: Environment Variable**
```bash
export EXPO_PUBLIC_API_BASE_URL=https://your-ngrok-url.ngrok-free.app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the App
```bash
npm start
```

## 📱 Features

### ✅ Backend Integration
- **Student Registration**: `/vectordb/students/video` endpoint
- **Attendance Processing**: `/attendance/images-attendance` endpoint
- **Excel Download**: Automatic Excel file generation and download

### 🧪 Mock Data for Testing
- **Home Screen Statistics**: Shows realistic numbers (156 students, 12 classes, 78% attendance)
- **Student Lists**: Sample student data across multiple classes (5A, 10B, 8C)
- **Attendance History**: Sample attendance records with dates and results

## ⚙️ Configuration

### Enable/Disable Mock Data
Edit `/config/api.ts`:
```typescript
export const TESTING_CONFIG = {
  useMockData: true, // Set to false to disable mock data
  mockDelays: {
    students: 600,   // API simulation delay in ms
    stats: 800,
    attendance: 700,
  },
};
```

### API Endpoints
The app integrates with these backend endpoints:
- `POST /vectordb/students/video` - Register student with video
- `POST /attendance/images-attendance` - Process attendance from images

## 🎯 Testing the App

### 1. Test Student Registration
- Use classroom format: `5A`, `10B`, `8C`, etc.
- Upload a clear video showing student's face
- Watch real-time processing steps
- View detailed success information with AI processing stats

### 2. Test Attendance Processing
- Enter classroom (e.g., "5A")
- Upload multiple classroom photos (recommended for accuracy)
- Process attendance and download Excel report
- Excel includes metadata, individual status, and summary stats

### 3. View Mock Data
- Home screen shows realistic statistics
- Mock data includes 18 sample students across 3 classes
- Sample attendance records with various attendance patterns

## 🔧 Development

### File Structure
```
app/
├── home.tsx          # Home screen with statistics
├── register-student.tsx # Student registration with video
├── take-attendance.tsx   # Attendance processing with photos
└── index.tsx         # Login screen

services/
├── api.ts           # API service with backend integration
└── auth.ts          # Authentication service

config/
└── api.ts           # API configuration and testing settings
```

### Key Components
- **Real Backend Integration**: Student registration and attendance processing
- **Excel Download**: Proper file handling with native sharing
- **Multiple Photo Support**: Upload several photos for better accuracy
- **Detailed Feedback**: Step-by-step processing information
- **Error Handling**: Specific error messages for different failure types

## 🐛 Troubleshooting

### Common Issues

**"Connection Error"**
- Check your NGrok URL in configuration
- Ensure your backend server is running
- Verify network connectivity

**"Invalid Classroom Format"**
- Use format like "5A", "10B", "12C"
- Number followed by single letter

**"Video File Too Large"**
- Maximum file size: 100MB
- Supported formats: MP4, AVI, MOV, MKV, WMV, FLV, WebM

**Mock Data Not Showing**
- Ensure `TESTING_CONFIG.useMockData = true`
- Check console for any error messages
- Try restarting the app

## 📋 Default Login Credentials
- **Username**: `teacher`
- **Password**: `password123`

---

**Happy Testing! 🎉**
