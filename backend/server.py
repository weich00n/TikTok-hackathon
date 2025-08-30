from flask import Flask, request, jsonify, session, send_from_directory
from flask_socketio import SocketIO, join_room, leave_room, send
from flask_cors import CORS
from werkzeug.utils import secure_filename
import uuid
from datetime import datetime
import os
import time
import random
import string
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'util'))
import importlib.util
from pydub import AudioSegment
import subprocess

# Lazy loading variables for ML models
_t2s_model = None
_piiranha_model = None

def get_t2s_model():
    """Lazy load the text-to-speech model"""
    global _t2s_model
    if _t2s_model is None:
        t2s_spec = importlib.util.spec_from_file_location("t2s_model", os.path.join(os.path.dirname(__file__), '..', 'util', 't2s-model.py'))
        _t2s_model = importlib.util.module_from_spec(t2s_spec)
        t2s_spec.loader.exec_module(_t2s_model)
    return _t2s_model

def get_piiranha_model():
    """Lazy load the PII detection model"""
    global _piiranha_model
    if _piiranha_model is None:
        pii_spec = importlib.util.spec_from_file_location("piiranha_model", os.path.join(os.path.dirname(__file__), '..', 'util', 'piiranha-model.py'))
        _piiranha_model = importlib.util.module_from_spec(pii_spec)
        pii_spec.loader.exec_module(_piiranha_model)
    return _piiranha_model

app = Flask(__name__)
app.config["SECRET_KEY"] = "supersecretkey"
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB upload limit
CORS(app, supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins="*")

# File uploads (kept under backend/ so backend/.gitignore can ignore them)
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads', 'audio')
ALLOWED_AUDIO_EXTENSIONS = {'.wav', '.mp3', '.ogg', '.m4a', '.webm', '.aac', '.amr', '.flac', '.opus'}
MAX_AUDIO_DURATION = 300  # 5 minutes max
MAX_AUDIO_SIZE = 50 * 1024 * 1024  # 50MB max
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Enhanced data structures matching frontend schemas
rooms = {}  # room_code -> Chat object
users = {}  # user_id -> User object

def generate_room_code(length=6):
    while True:
        code = ''.join(random.choices(string.ascii_letters + string.digits, k=length))
        if code not in rooms:
            return code

def get_audio_duration(file_path):
    try:
        audio = AudioSegment.from_file(file_path)
        duration = len(audio) / 1000.0  # duration in seconds
        return duration
    except Exception as e:
        print(f"Error getting audio duration with pydub: {e}")
        return 1

def convert_to_wav(input_path):
    output_path = input_path.rsplit('.', 1)[0] + ".wav"
    try:
        result = subprocess.run(
            [
                "ffmpeg", "-y", "-i", input_path,
                "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", output_path
            ],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        print("ffmpeg stdout:", result.stdout.decode())
        print("ffmpeg stderr:", result.stderr.decode())
        return output_path
    except Exception as e:
        print(f"FFmpeg conversion failed: {e}")
        return None

def process_audio_message(audio_path, room_code, sender_name):
    """Process audio message: transcribe, detect PII, create message object"""
    message_id = create_message_id()
    timestamp = datetime.now()
    public_url = f"/voice/{room_code}/{os.path.basename(audio_path)}"
    
    # Get audio duration
    duration = float(get_audio_duration(audio_path))
    
    try:
        # Transcribe the audio
        t2s_model = get_t2s_model()
        print(f"🎙️ Transcribing audio: {audio_path}")
        transcription = t2s_model.transcribe_audio(audio_path)
        print(f"📝 Transcription: {transcription}")
        
        # Process transcription through PII detection
        pii_result = process_text_with_pii(transcription)
        print(f"🔒 PII detected: {pii_result['hasRedactions']}")
        
        # Create enhanced message with all metadata
        message = {
            "id": message_id,
            "chatId": room_code,
            "senderId": sender_name,
            "content": pii_result["redactedContent"] if pii_result["redactedContent"].strip() else "[Voice message]",
            "type": "voice",
            "timestamp": timestamp.isoformat(),
            "timestampMs": int(timestamp.timestamp() * 1000),
            "duration": float(round(duration, 2)),
            "audioUrl": public_url,
            "audioPath": audio_path,
            "transcription": {
                "original": transcription,
                "redacted": pii_result["redactedContent"],
                "hasRedactions": pii_result["hasRedactions"]
            },
            "piiDetection": {
                "hasRedactions": pii_result["hasRedactions"],
                "detectedFields": pii_result["detectedFields"],
                "detectionDetails": pii_result["detectionDetails"]
            },
            "metadata": {
                "fileSize": os.path.getsize(audio_path),
                "format": os.path.splitext(audio_path)[1].lower(),
                "processed": True
            }
        }
        
        print(f"✅ Audio message processed successfully")
        return message
        
    except Exception as e:
        print(f"❌ Audio processing failed: {e}")
        # Fallback message if transcription fails
        return {
            "id": message_id,
            "chatId": room_code,
            "senderId": sender_name,
            "content": "[Voice message - processing failed]",
            "type": "voice",
            "timestamp": timestamp.isoformat(),
            "timestampMs": int(timestamp.timestamp() * 1000),
            "duration": float(round(duration, 2)),
            "audioUrl": public_url,
            "audioPath": audio_path,
            "transcription": {
                "original": "[Transcription failed]",
                "redacted": "[Transcription failed]",
                "hasRedactions": False
            },
            "piiDetection": {
                "hasRedactions": False,
                "detectedFields": [],
                "detectionDetails": []
            },
            "metadata": {
                "fileSize": os.path.getsize(audio_path),
                "format": os.path.splitext(audio_path)[1].lower(),
                "processed": False,
                "error": str(e)
            }
        }

def create_message_id():
    return str(uuid.uuid4())

def process_text_with_pii(text):
    """Process text through PII detection and redaction"""
    piiranha_model = get_piiranha_model()
    results = piiranha_model.pipe(text)
    redacted_content = piiranha_model.redact_text(text, results)
    detected_fields = [r['entity_group'] for r in results]
    
    return {
        "hasRedactions": len(results) > 0,
        "redactedContent": redacted_content,
        "detectedFields": detected_fields,
        "originalContent": text,
        "detectionDetails": [
            {
                "type": r['entity_group'],
                "original": text[r['start']:r['end']],
                "confidence": float(r['score']),
                "position": [r['start'], r['end']]
            } for r in results
        ]
    }

# REST routes
@app.route('/conversations', methods=['POST'])
def create_conversation():
    room_code = generate_room_code()
    chat = {
        "id": room_code,
        "name": None,
        "participants": [],
        "messages": [],
        "lastMessage": None,
        "createdAt": datetime.now(),
        "updatedAt": datetime.now(),
        "isGroup": False
    }
    rooms[room_code] = chat
    return jsonify({"room_code": room_code}), 201

@app.route('/conversations/<room_code>', methods=['GET'])
def get_conversation(room_code):
    if room_code not in rooms:
        return jsonify({"error": "Room not found"}), 404
    chat = rooms[room_code]
    return jsonify({
        "id": chat["id"],
        "name": chat["name"],
        "participants": chat["participants"],
        "messageCount": len(chat["messages"]),
        "lastMessage": chat["lastMessage"],
        "createdAt": chat["createdAt"],
        "updatedAt": chat["updatedAt"],
        "isGroup": chat["isGroup"]
    }), 200

@app.route('/messages/<room_code>', methods=['GET'])
def get_messages(room_code):
    if room_code not in rooms:
        return jsonify({"error": "Room not found"}), 404
    chat = rooms[room_code]
    return jsonify(chat["messages"]), 200

@app.route('/voice/<room_code>', methods=['POST'])
def upload_voice(room_code):
    """Enhanced voice message upload with comprehensive processing"""
    print(f"🎙️ Voice upload request for room: {room_code}")
    
    # Validate room exists
    if room_code not in rooms:
        print("❌ Room not found:", room_code)
        return jsonify({"error": "Room not found"}), 404
    
    # Validate file upload
    if 'audio' not in request.files:
        print("❌ No 'audio' file part in request")
        return jsonify({"error": "No 'audio' file part"}), 400
    
    file = request.files['audio']
    if not file or file.filename == '':
        print("❌ Empty filename")
        return jsonify({"error": "Empty filename"}), 400
    
    # Validate file type
    _, ext = os.path.splitext(file.filename)
    ext = ext.lower()
    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        print(f"❌ Unsupported file type: {ext}")
        return jsonify({
            "error": f"Unsupported file type: {ext}",
            "supportedTypes": list(ALLOWED_AUDIO_EXTENSIONS)
        }), 400
    
    # Check file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    
    if file_size > MAX_AUDIO_SIZE:
        print(f"❌ File too large: {file_size} bytes (max: {MAX_AUDIO_SIZE} bytes)")
        return jsonify({
            "error": f"File too large: {file_size} bytes (max: {MAX_AUDIO_SIZE} bytes)"
        }), 400
    
    # Generate secure filename with timestamp
    safe_name = secure_filename(file.filename)
    timestamp_ms = int(time.time() * 1000)
    sender_name = session.get('name', 'Unknown')
    final_name = f"{timestamp_ms}_{sender_name}_{safe_name}"
    
    # Create room directory and save file
    room_dir = os.path.join(app.config['UPLOAD_FOLDER'], room_code)
    os.makedirs(room_dir, exist_ok=True)
    save_path = os.path.join(room_dir, final_name)
    
    try:
        file.save(save_path)
        print(f"💾 Saved audio file: {save_path}")
        
        # Process the audio message (transcribe, PII detect, etc.)
        message = process_audio_message(save_path, room_code, sender_name)
        
        # Add message to room and broadcast via SocketIO
        chat = rooms[room_code]
        chat["messages"].append(message)
        chat["lastMessage"] = {
            "id": message["id"],
            "content": message["content"],
            "type": "voice",
            "timestamp": message["timestamp"],
            "senderId": message["senderId"]
        }
        chat["updatedAt"] = datetime.now()
        
        # Broadcast to all users in the room
        socketio.emit('new_message', message, room=room_code)
        
        print(f"📤 Broadcasted voice message to room {room_code}")
        
        return jsonify({
            "success": True,
            "message": {
                "id": message["id"],
                "audioUrl": message["audioUrl"],
                "duration": message["duration"],
                "transcription": message["transcription"]["redacted"],
                "hasRedactions": message["piiDetection"]["hasRedactions"],
                "timestamp": message["timestamp"]
            }
        }), 201
        
    except Exception as e:
        # Clean up file if processing failed
        if os.path.exists(save_path):
            os.remove(save_path)
        
        print(f"❌ Voice upload failed: {e}")
        return jsonify({
            "error": "Failed to process voice message",
            "details": str(e)
        }), 500

@app.route('/voice/<room_code>/<filename>', methods=['GET'])
def get_voice(room_code, filename):
    """Serve audio files with proper headers"""
    room_dir = os.path.join(app.config['UPLOAD_FOLDER'], room_code)
    file_path = os.path.join(room_dir, filename)
    
    if not os.path.exists(file_path):
        return jsonify({"error": "Audio file not found"}), 404
    
    return send_from_directory(room_dir, filename, as_attachment=False)

@app.route('/voice/<room_code>/<message_id>/transcription', methods=['GET'])
def get_transcription(room_code, message_id):
    """Get detailed transcription data for a voice message"""
    if room_code not in rooms:
        return jsonify({"error": "Room not found"}), 404
    
    chat = rooms[room_code]
    message = next((msg for msg in chat["messages"] if msg["id"] == message_id), None)
    
    if not message or message["type"] != "voice":
        return jsonify({"error": "Voice message not found"}), 404
    
    return jsonify({
        "messageId": message_id,
        "transcription": message.get("transcription", {}),
        "piiDetection": message.get("piiDetection", {}),
        "timestamp": message.get("timestamp"),
        "duration": message.get("duration", 0)
    }), 200

@app.route('/voice/<room_code>/history', methods=['GET'])
def get_voice_history(room_code):
    """Get all voice messages in a room with metadata"""
    if room_code not in rooms:
        return jsonify({"error": "Room not found"}), 404
    
    chat = rooms[room_code]
    voice_messages = [
        {
            "id": msg["id"],
            "senderId": msg["senderId"], 
            "timestamp": msg["timestamp"],
            "duration": msg.get("duration", 0),
            "audioUrl": msg["audioUrl"],
            "transcription": msg.get("piiDetection", {}).get("redacted", ""),
            "hasRedactions": msg.get("piiDetection", {}).get("hasRedactions", False),
            "detectedFields": msg.get("piiDetection", {}).get("detectedFields", [])
        }
        for msg in chat["messages"] if msg["type"] == "voice"
    ]
    
    return jsonify({
        "roomCode": room_code,
        "voiceMessages": voice_messages,
        "totalCount": len(voice_messages)
    }), 200

@app.route('/session', methods=['POST'])
def set_session():
    data = request.get_json(silent=True) or {}
    name = data.get('name')
    room = data.get('room')
    if not name or not room:
        return jsonify({"error": "'name' and 'room' are required"}), 400
    
    # Create or update user
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "name": name,
        "email": f"{name}@example.com",  # Placeholder
        "avatar": None,
        "isOnline": True,
        "lastSeen": datetime.now()
    }
    users[user_id] = user
    
    session['name'] = name
    session['room'] = room
    session['user_id'] = user_id
    
    # Add user to room participants if not already there
    if room in rooms and name not in rooms[room]["participants"]:
        rooms[room]["participants"].append(name)
    
    return jsonify({"ok": True}), 200

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"ok": True}), 200

@socketio.on('connect')
def handle_connect():
    """Handle user connection to SocketIO"""
    name = session.get('name')
    room = session.get('room')
    if not name or not room or room not in rooms:
        return
    
    join_room(room)
    print(f"👤 {name} connected to room {room}")
    
    # Update user online status
    user_id = session.get('user_id')
    if user_id and user_id in users:
        users[user_id]["isOnline"] = True
        users[user_id]["lastSeen"] = datetime.now()
    
    # Notify room of user joining
    socketio.emit('user_joined', {
        "message": f"{name} joined the room",
        "userId": name,
        "timestamp": datetime.now().isoformat()
    }, room=room)

@socketio.on('message')
def handle_message(data):
    """Handle text messages with PII detection"""
    room = session.get('room')
    name = session.get('name')
    
    if room not in rooms:
        return
    
    message_text = (data or {}).get('message')
    if not message_text:
        return
    
    print(f"💬 Text message from {name} in {room}: {message_text}")
    
    # Process text through PII detection
    pii_result = process_text_with_pii(message_text)
    
    # Create enhanced message
    message = {
        "id": create_message_id(),
        "chatId": room,
        "senderId": name,
        "content": pii_result["redactedContent"],
        "type": "text",
        "timestamp": datetime.now().isoformat(),
        "timestampMs": int(datetime.now().timestamp() * 1000),
        "transcription": {
            "original": message_text,
            "redacted": pii_result["redactedContent"],
            "hasRedactions": pii_result["hasRedactions"]
        },
        "piiDetection": {
            "hasRedactions": pii_result["hasRedactions"],
            "detectedFields": pii_result["detectedFields"],
            "detectionDetails": pii_result["detectionDetails"]
        }
    }
    
    # Add to room and broadcast
    chat = rooms[room]
    chat["messages"].append(message)
    chat["lastMessage"] = {
        "id": message["id"],
        "content": message["content"],
        "type": "text",
        "timestamp": message["timestamp"],
        "senderId": message["senderId"]
    }
    chat["updatedAt"] = datetime.now()
    
    # Broadcast to all users in room
    socketio.emit('new_message', message, room=room)
    print(f"📤 Broadcasted text message to room {room}")

@socketio.on('disconnect')
def handle_disconnect():
    """Handle user disconnection"""
    room = session.get('room')
    name = session.get('name')
    user_id = session.get('user_id')
    
    print(f"👤 {name} disconnected from room {room}")
    
    # Update user offline status
    if user_id and user_id in users:
        users[user_id]["isOnline"] = False
        users[user_id]["lastSeen"] = datetime.now()
    
    if room in rooms:
        # Remove user from participants
        if name in rooms[room]["participants"]:
            rooms[room]["participants"].remove(name)
        
        # Delete room if no participants left
        if len(rooms[room]["participants"]) == 0:
            print(f"🗑️ Deleting empty room {room}")
            del rooms[room]
        else:
            # Notify remaining users
            socketio.emit('user_left', {
                "message": f"{name} left the room",
                "userId": name,
                "timestamp": datetime.now().isoformat()
            }, room=room)
    
    leave_room(room)

@app.route('/api/process_voice', methods=['POST'])
def process_voice_api():
    # Use a default room code or require one in the request
    room_code = request.args.get('room') or 'default'
    # Auto-create the room if it doesn't exist
    if room_code not in rooms:
        print(f"ℹ️ Auto-creating room: {room_code}")
        chat = {
            "id": room_code,
            "name": None,
            "participants": [],
            "messages": [],
            "lastMessage": None,
            "createdAt": datetime.now(),
            "updatedAt": datetime.now(),
            "isGroup": False
        }
        rooms[room_code] = chat
    return api_test_audio_file()

@app.route('/api/test_audio_file', methods=['POST'])
def api_test_audio_file():
    if 'audio' not in request.files:
        print("❌ No 'audio' file part in request")
        return jsonify({"error": "No 'audio' file part"}), 400

    file = request.files['audio']
    if not file or file.filename == '':
        print("❌ Empty filename")
        return jsonify({"error": "Empty filename"}), 400

    # Validate file type
    _, ext = os.path.splitext(file.filename)
    ext = ext.lower()
    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        print(f"❌ Unsupported file type: {ext}")
        return jsonify({
            "error": f"Unsupported file type: {ext}",
            "supportedTypes": list(ALLOWED_AUDIO_EXTENSIONS)
        }), 400

    # Save file temporarily
    temp_dir = os.path.join(app.config['UPLOAD_FOLDER'], "test_uploads")
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, secure_filename(file.filename))
    file.save(temp_path)
    print(f"💾 Saved file to {temp_path}")

    # If the uploaded file is a webm, convert it to wav
    if ext == ".webm":
        wav_path = convert_to_wav(temp_path)
        if wav_path and os.path.exists(wav_path):
            temp_path = wav_path
            ext = ".wav"
        else:
            print("❌ Could not convert webm to wav")
            return jsonify({"error": "Audio conversion failed"}), 500

    try:
        print("⏱️ Getting audio duration...")
        duration = float(get_audio_duration(temp_path))
        print(f"⏱️ Duration: {duration}")

        print("🧠 Loading T2S model...")
        t2s_model = get_t2s_model()
        print("🗣️ Transcribing audio...")
        transcription = t2s_model.transcribe_audio(temp_path)
        print(f"📝 Transcribed text: {transcription}")

        print("🔎 Running PII detection...")
        pii_result = process_text_with_pii(transcription)
        print(f"🛡️ Redacted text: {pii_result['redactedContent']}")  # <-- Add this line

        result = {
            "file": file.filename,
            "fileSize": float(os.path.getsize(temp_path)),  # Ensure JSON serializable
            "duration": float(duration),                   # Ensure JSON serializable
            "transcription": transcription,
            "piiDetection": {
                "hasRedactions": pii_result["hasRedactions"],
                "redactedContent": pii_result["redactedContent"],
                "detectedFields": pii_result["detectedFields"],
                "detectionDetails": pii_result["detectionDetails"]
            }
        }
        print("✅ Finished processing audio file.")
        return jsonify(result), 200

    except Exception as e:
        print(f"❌ Exception in /api/test_audio_file: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.route('/api/process_text', methods=['POST'])
def api_process_text():
    """
    Process text input directly through PII detection without speech-to-text
    Accepts JSON with 'text' field and returns PII detection results
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        # Extract text from request
        text_input = data.get('text', '').strip()
        if not text_input:
            return jsonify({"error": "No 'text' field provided or text is empty"}), 400
        
        print(f"📝 Processing text input: {text_input[:100]}...")  # Log first 100 chars
        
        # Process text directly through PII detection
        print("🔎 Running PII detection on text...")
        pii_result = process_text_with_pii(text_input)
        print(f"🛡️ PII detection complete. Has redactions: {pii_result['hasRedactions']}")
        print(f"🛡️ Redacted text: {pii_result['redactedContent']}")
        
        # Optional: Add to specific room if room_code is provided
        room_code = data.get('room_code') or request.args.get('room')
        sender_name = data.get('sender_name', 'API User')
        
        # Prepare response
        result = {
            "originalText": text_input,
            "processedText": pii_result["redactedContent"],
            "piiDetection": {
                "hasRedactions": pii_result["hasRedactions"],
                "redactedContent": pii_result["redactedContent"],
                "detectedFields": pii_result["detectedFields"],
                "detectionDetails": pii_result["detectionDetails"]
            },
            "metadata": {
                "textLength": len(text_input),
                "redactedLength": len(pii_result["redactedContent"]),
                "processingTime": datetime.now().isoformat()
            }
        }
        
        # If room_code is provided, optionally add as message to room
        if room_code and room_code in rooms:
            print(f"📤 Adding processed text to room: {room_code}")
            
            # Create message object
            message = {
                "id": create_message_id(),
                "chatId": room_code,
                "senderId": sender_name,
                "content": pii_result["redactedContent"],
                "type": "text",
                "timestamp": datetime.now().isoformat(),
                "timestampMs": int(datetime.now().timestamp() * 1000),
                "transcription": {
                    "original": text_input,
                    "redacted": pii_result["redactedContent"],
                    "hasRedactions": pii_result["hasRedactions"]
                },
                "piiDetection": {
                    "hasRedactions": pii_result["hasRedactions"],
                    "detectedFields": pii_result["detectedFields"],
                    "detectionDetails": pii_result["detectionDetails"]
                }
            }
            
            # Add to room
            chat = rooms[room_code]
            chat["messages"].append(message)
            chat["lastMessage"] = {
                "id": message["id"],
                "content": message["content"],
                "type": "text",
                "timestamp": message["timestamp"],
                "senderId": message["senderId"]
            }
            chat["updatedAt"] = datetime.now()
            
            # Broadcast to room if desired
            socketio.emit('new_message', message, room=room_code)
            
            result["message"] = {
                "id": message["id"],
                "addedToRoom": room_code,
                "broadcasted": True
            }
        
        print("✅ Text processing completed successfully")
        return jsonify(result), 200
        
    except Exception as e:
        print(f"❌ Exception in /api/process_text: {e}")
        return jsonify({
            "error": "Failed to process text",
            "details": str(e)
        }), 500
    
if __name__ == "__main__":
    socketio.run(app, debug=True)