# 🎙️ TikTok Hackathon - Audio Messaging with PII Detection

A real-time chat application with voice messaging and automatic PII (Personally Identifiable Information) detection and redaction.

## 📁 Project Structure

```
TikTok-hackathon/
├── backend/                 # Backend server and API
│   ├── server.py           # Main Flask-SocketIO server
│   ├── uploads/            # Audio file storage
│   └── ...
├── frontend/               # Frontend React/Next.js application
│   ├── components/
│   ├── app/
│   └── ...
├── util/                   # ML models and utilities
│   ├── t2s-model.py       # Speech-to-text transcription
│   ├── piiranha-model.py  # PII detection and redaction
│   └── ...
├── tests/                  # Test suite
│   ├── test_quick.py      # Quick backend availability test
│   ├── test_simple.py     # Direct backend function tests 
│   ├── test_audio_enhanced.py # Audio messaging tests
│   ├── test_socketio.py   # Real-time messaging tests
│   └── test_data.json     # Test data and scenarios
├── run_server.py          # Server startup script
├── run_tests.py           # Test runner script
└── requirements.txt       # Python dependencies
```

## 🚀 Quick Start

### 1. Start the Backend Server
```bash
python run_server.py
```
The server will be available at `http://127.0.0.1:5000`

### 2. Run Tests
```bash
python run_tests.py
```
Choose from available test suites or run all tests.

### 3. Start Frontend (separate terminal)
```bash
cd frontend
npm run dev
```

## 🎯 Features

### ✅ Audio Messaging
- **Upload/Download**: Support for WAV, MP3, OGG, M4A, WebM, AAC, AMR, FLAC, OPUS
- **Real-time Broadcasting**: Instant delivery via SocketIO
- **Duration Tracking**: Automatic audio length calculation
- **File Validation**: Size and format restrictions

### ✅ Speech-to-Text
- **Auto-Transcription**: Facebook S2T model integration
- **Timestamp Metadata**: Precise timing information
- **Error Handling**: Graceful fallbacks for failed transcriptions

### ✅ PII Detection & Redaction
- **Real-time Scanning**: Every message checked for sensitive data
- **Auto-Redaction**: Phone numbers, emails, SSNs → `[REDACTED]`
- **Detailed Reports**: Shows detected field types and confidence
- **Privacy First**: Original content stored securely for admin review only

### ✅ Real-time Chat
- **SocketIO Integration**: Instant message delivery
- **Room-based**: Isolated conversations
- **User Management**: Online/offline status tracking
- **Message History**: Persistent conversation storage

## 🔧 API Endpoints

### Chat Management
- `POST /conversations` - Create new chat room
- `GET /conversations/{room_code}` - Get room details
- `POST /session` - Set user session
- `GET /health` - Server health check

### Messaging
- `GET /messages/{room_code}` - Get all messages
- `POST /voice/{room_code}` - Upload voice message
- `GET /voice/{room_code}/{filename}` - Download audio file
- `GET /voice/{room_code}/history` - Get voice message history
- `GET /voice/{room_code}/{id}/transcription` - Get transcription details

### Real-time (SocketIO)
- `connect` - Join room
- `message` - Send text message
- `new_message` - Receive new message
- `user_joined/left` - User status updates

## 🧪 Testing

### Test Categories
1. **Quick Tests** - Backend availability and basic function tests
2. **Simple Tests** - Direct backend function testing (no server required)
3. **Audio Enhanced** - Voice messaging with PII detection (requires server)
4. **SocketIO Tests** - Real-time messaging functionality (requires server)

### Example Test Commands
```bash
# Run specific test
python tests/test_simple.py       # Direct backend testing
python tests/test_quick.py        # Quick availability check

# Run via test runner
python run_tests.py

# Quick validation (no server required)
python tests/test_simple.py
```

## 📋 Example Message Structure

### Text Message
```json
{
  "id": "uuid",
  "type": "text",
  "senderId": "username", 
  "content": "Hello [REDACTED]!",
  "timestamp": "2025-08-30T10:30:00.000Z",
  "piiDetection": {
    "hasRedactions": true,
    "detectedFields": ["PERSON_NAME"],
    "detectionDetails": [...]
  }
}
```

### Voice Message
```json
{
  "id": "uuid",
  "type": "voice",
  "senderId": "username",
  "duration": 3.45,
  "audioUrl": "/voice/ABC123/file.wav",
  "timestamp": "2025-08-30T10:30:00.000Z",
  "transcription": {
    "original": "Call me at 555-123-4567",
    "redacted": "Call me at [REDACTED]",
    "hasRedactions": true
  },
  "piiDetection": {
    "hasRedactions": true,
    "detectedFields": ["PHONE_NUMBER"],
    "detectionDetails": [...]
  }
}
```

## 🔒 Privacy & Security

- **Automatic PII Detection**: Scans all text and voice transcriptions
- **Smart Redaction**: Preserves message context while hiding sensitive data
- **Admin Oversight**: Original content available for authorized review
- **Secure Storage**: Audio files organized by room with access controls

## 🛠️ Development

### Adding New Tests
1. Create test file in `tests/` directory
2. Follow naming convention: `test_[feature].py` 
3. Update `run_tests.py` to include new test

### ML Model Integration
- Models are lazy-loaded for faster startup
- Located in `util/` directory
- Easy to swap or upgrade models

## 📝 Notes

- Backend server runs on port 5000
- Frontend development server typically on port 3000
- Audio files stored in `backend/uploads/audio/`
- Session management via Flask sessions + SocketIO
- Real-time updates broadcast to room participants only
