# Audio File Testing Examples

## 🎙️ How to Test Your Audio Files

### 1. Interactive Mode (Recommended)
```bash
python tests/test_audio_file.py
```
This will start an interactive menu where you can:
- Test a single audio file
- Test all audio files in a directory
- Easy to use interface

### 2. Test Single File
```bash
python tests/test_audio_file.py "path/to/your/audio.wav"
```

### 3. Test All Files in Directory
```bash
python tests/test_audio_file.py --directory "path/to/audio/folder"
```

### 4. Hide Detailed PII Info
```bash
python tests/test_audio_file.py "audio.wav" --no-details
```

## 📁 Supported Audio Formats
- WAV (.wav)
- MP3 (.mp3)
- OGG (.ogg)
- M4A (.m4a)
- WebM (.webm)
- AAC (.aac)
- AMR (.amr)
- FLAC (.flac)
- OPUS (.opus)

## 🔍 What the Test Does

1. **File Validation**: Checks if file exists and format is supported
2. **Duration Analysis**: Calculates audio length
3. **Transcription**: Converts speech to text using Facebook S2T model
4. **PII Detection**: Scans for sensitive information like:
   - Phone numbers
   - Email addresses
   - Social Security Numbers
   - Names and addresses
5. **Redaction**: Shows how text would be filtered for privacy
6. **Performance**: Reports processing time

## 📊 Example Output

```
🎙️ Testing Audio File: my_recording.wav
============================================================
📁 File size: 2,453,248 bytes (2.34 MB)
✅ File format supported: .wav
⏱️ Audio duration: 15.23 seconds

🤖 Loading ML models...
📢 Loading speech-to-text model...
✅ Speech-to-text model loaded

🎯 Transcribing audio file...
⏱️ Transcription completed in 3.45 seconds

📝 TRANSCRIPTION RESULT:
🔤 Original text: "Hi, call me at 555-123-4567 or email john@example.com"
📊 Length: 54 characters

🔒 Running PII detection...

🛡️ PII DETECTION RESULTS:
🔍 Has PII detected: True
🔤 Redacted text: "Hi, call me at [REDACTED] or email [REDACTED]"
⚠️ Detected PII fields: ['PHONE_NUMBER', 'EMAIL']

📊 PROCESSING SUMMARY:
   📁 File: my_recording.wav
   ⏱️ Duration: 15.23s
   🔤 Transcription: 54 chars
   ⚡ Processing time: 3.45s
   🛡️ PII detected: Yes
```

## 💡 Tips

- First run may be slower due to model loading
- Clear audio works best for transcription
- Background noise may affect accuracy
- Longer files take more time to process
- PII detection works on the transcribed text

## 🚀 Quick Start

1. Make sure your backend server models are set up
2. Place your audio file somewhere accessible
3. Run: `python tests/test_audio_file.py`
4. Choose option 1 and enter your file path
5. Watch the magic happen! ✨
