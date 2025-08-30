import requests
import json
import time
import os
import wave
import struct
import sys
from io import BytesIO

# Add backend path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Test configuration
BASE_URL = "http://127.0.0.1:5000"
TEST_ROOM = None
TEST_SESSION = None

def create_test_audio(filename="test_audio.wav", duration=3, frequency=440):
    """Create a test WAV file with a sine wave"""
    sample_rate = 44100
    frames = int(duration * sample_rate)
    
    # Create sine wave data
    audio_data = []
    for i in range(frames):
        # Generate sine wave
        value = int(32767 * 0.3 * 
                   (math.sin(2 * math.pi * frequency * i / sample_rate)))
        audio_data.append(struct.pack('<h', value))
    
    # Write to WAV file
    with wave.open(filename, 'wb') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(b''.join(audio_data))
    
    return filename

def test_setup():
    """Setup test environment"""
    global TEST_ROOM, TEST_SESSION
    
    print("🔧 Setting up test environment...")
    
    # Create conversation
    response = requests.post(f"{BASE_URL}/conversations")
    if response.status_code == 201:
        TEST_ROOM = response.json()['room_code']
        print(f"✅ Created test room: {TEST_ROOM}")
    else:
        print(f"❌ Failed to create room: {response.status_code}")
        return False
    
    # Create session
    TEST_SESSION = requests.Session()
    session_data = {
        "name": "AudioTester", 
        "room": TEST_ROOM
    }
    
    response = TEST_SESSION.post(f"{BASE_URL}/session", json=session_data)
    if response.status_code == 200:
        print(f"✅ Session created for AudioTester")
        return True
    else:
        print(f"❌ Failed to create session: {response.status_code}")
        return False

def test_voice_upload_with_pii():
    """Test voice upload with PII content simulation"""
    print("\n🎙️ Testing voice upload with PII detection...")
    
    # Create a simple WAV file
    try:
        import math
        audio_file = create_test_audio("pii_test.wav")
        print(f"📁 Created test audio file: {audio_file}")
    except ImportError:
        # Fallback: create minimal WAV header
        wav_header = b'RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00'
        audio_data = b'\x00' * 8000  # 8KB of silence
        
        with open("pii_test.wav", "wb") as f:
            f.write(wav_header + audio_data)
        audio_file = "pii_test.wav"
        print(f"📁 Created minimal test audio file: {audio_file}")
    
    try:
        # Upload the audio file
        with open(audio_file, 'rb') as f:
            files = {'audio': (audio_file, f, 'audio/wav')}
            response = TEST_SESSION.post(f"{BASE_URL}/voice/{TEST_ROOM}", files=files)
        
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Voice upload successful!")
            print(f"   Audio URL: {result['message']['audioUrl']}")
            print(f"   Duration: {result['message']['duration']}s")
            print(f"   Transcription: {result['message']['transcription']}")
            print(f"   PII Detected: {result['message']['hasRedactions']}")
            return result['message']
        else:
            print(f"❌ Voice upload failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Voice upload error: {e}")
        return None
    finally:
        # Clean up test file
        if os.path.exists(audio_file):
            os.remove(audio_file)

def test_voice_history():
    """Test getting voice message history"""
    print("\n📜 Testing voice message history...")
    
    response = TEST_SESSION.get(f"{BASE_URL}/voice/{TEST_ROOM}/history")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Voice history retrieved!")
        print(f"   Total voice messages: {data['totalCount']}")
        for msg in data['voiceMessages']:
            print(f"   - {msg['senderId']}: {msg['transcription']} ({msg['duration']}s)")
        return data
    else:
        print(f"❌ Failed to get voice history: {response.status_code}")
        return None

def test_transcription_details():
    """Test getting detailed transcription data"""
    print("\n📝 Testing transcription details...")
    
    # First get the voice history to find a message ID
    history = test_voice_history()
    if not history or not history['voiceMessages']:
        print("❌ No voice messages found for transcription test")
        return None
    
    message_id = history['voiceMessages'][0]['id']
    response = TEST_SESSION.get(f"{BASE_URL}/voice/{TEST_ROOM}/{message_id}/transcription")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Transcription details retrieved!")
        print(f"   Message ID: {data['messageId']}")
        print(f"   Original: {data['transcription'].get('original', 'N/A')}")
        print(f"   Redacted: {data['transcription'].get('redacted', 'N/A')}")
        print(f"   PII Fields: {data['piiDetection'].get('detectedFields', [])}")
        return data
    else:
        print(f"❌ Failed to get transcription details: {response.status_code}")
        return None

def test_multiple_audio_formats():
    """Test uploading different audio formats"""
    print("\n🎵 Testing multiple audio formats...")
    
    formats = [
        ("test.wav", "audio/wav"),
        ("test.mp3", "audio/mpeg"),
        ("test.ogg", "audio/ogg"),
        ("test.m4a", "audio/mp4")
    ]
    
    # Create minimal test data for each format
    test_data = b'RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00' + b'\x00' * 1000
    
    for filename, mime_type in formats:
        try:
            files = {'audio': (filename, BytesIO(test_data), mime_type)}
            response = TEST_SESSION.post(f"{BASE_URL}/voice/{TEST_ROOM}", files=files)
            
            if response.status_code == 201:
                print(f"   ✅ {filename}: Upload successful")
            else:
                print(f"   ❌ {filename}: Upload failed ({response.status_code})")
                
        except Exception as e:
            print(f"   ❌ {filename}: Error - {e}")

def test_audio_download():
    """Test downloading uploaded audio files"""
    print("\n⬇️ Testing audio file download...")
    
    # Get voice history to find an audio file
    history_response = TEST_SESSION.get(f"{BASE_URL}/voice/{TEST_ROOM}/history")
    
    if history_response.status_code != 200:
        print("❌ Cannot get voice history for download test")
        return
    
    history = history_response.json()
    if not history['voiceMessages']:
        print("❌ No voice messages found for download test")
        return
    
    audio_url = history['voiceMessages'][0]['audioUrl']
    download_response = requests.get(f"{BASE_URL}{audio_url}")
    
    if download_response.status_code == 200:
        print(f"✅ Audio download successful!")
        print(f"   File size: {len(download_response.content)} bytes")
        print(f"   Content type: {download_response.headers.get('Content-Type', 'Unknown')}")
    else:
        print(f"❌ Audio download failed: {download_response.status_code}")

def test_error_cases():
    """Test various error scenarios"""
    print("\n❌ Testing error cases...")
    
    # Test upload to non-existent room
    test_data = b'fake audio data'
    files = {'audio': ('test.wav', BytesIO(test_data), 'audio/wav')}
    response = requests.post(f"{BASE_URL}/voice/NONEXISTENT", files=files)
    print(f"   Non-existent room: {response.status_code} ✅" if response.status_code == 404 else f" ❌")
    
    # Test upload without file
    response = TEST_SESSION.post(f"{BASE_URL}/voice/{TEST_ROOM}")
    print(f"   No file: {response.status_code} ✅" if response.status_code == 400 else f" ❌")
    
    # Test unsupported file type
    files = {'audio': ('test.txt', BytesIO(b'text file'), 'text/plain')}
    response = TEST_SESSION.post(f"{BASE_URL}/voice/{TEST_ROOM}", files=files)
    print(f"   Unsupported format: {response.status_code} ✅" if response.status_code == 400 else f" ❌")

def run_comprehensive_audio_tests():
    """Run all audio-related tests"""
    print("🎙️ COMPREHENSIVE AUDIO MESSAGE TESTING")
    print("=" * 50)
    
    # Setup
    if not test_setup():
        print("❌ Setup failed, cannot continue")
        return
    
    # Core functionality tests
    test_voice_upload_with_pii()
    test_voice_history() 
    test_transcription_details()
    test_audio_download()
    
    # Format and error tests
    test_multiple_audio_formats()
    test_error_cases()
    
    print("\n🎉 Audio testing completed!")
    print(f"📊 Test Summary:")
    print(f"   Room: {TEST_ROOM}")
    print(f"   Features tested: Upload, PII Detection, Transcription, Download, History")

if __name__ == "__main__":
    import math  # For sine wave generation
    run_comprehensive_audio_tests()
