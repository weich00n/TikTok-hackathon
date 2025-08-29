from flask import Flask, request, jsonify, session, send_from_directory
from flask_socketio import SocketIO, join_room, leave_room, send
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import time
import random
import string

app = Flask(__name__)
app.config["SECRET_KEY"] = "supersecretkey"
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# File uploads (kept under backend/ so backend/.gitignore can ignore them)
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'backend', 'uploads', 'audio')
ALLOWED_AUDIO_EXTENSIONS = {'.wav', '.mp3', '.ogg', '.m4a', '.webm', '.aac', '.amr'}
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# A mock database to persist data
rooms = {}

def generate_room_code(length=6):
    while True:
        code = ''.join(random.choices(string.ascii_letters + string.digits, k=length))
        if code not in rooms:
            return code

# REST routes
@app.route('/conversations', methods=['POST'])
def create_conversation():
    room_code = generate_room_code()
    rooms[room_code] = {'members': 0, 'messages': []}
    return jsonify({"room_code": room_code}), 201

@app.route('/messages/<room_code>', methods=['GET'])
def get_messages(room_code):
    if room_code not in rooms:
        return jsonify({"error": "Room not found"}), 404
    return jsonify(rooms[room_code]['messages']), 200

@app.route('/voice/<room_code>', methods=['POST'])
def upload_voice(room_code):
    if room_code not in rooms:
        return jsonify({"error": "Room not found"}), 404
    if 'audio' not in request.files:
        return jsonify({"error": "No 'audio' file part"}), 400
    file = request.files['audio']
    if not file or file.filename == '':
        return jsonify({"error": "Empty filename"}), 400
    _, ext = os.path.splitext(file.filename)
    ext = ext.lower()
    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        return jsonify({"error": f"Unsupported file type: {ext}"}), 400
    safe_name = secure_filename(file.filename)
    timestamp_ms = int(time.time() * 1000)
    final_name = f"{timestamp_ms}_{safe_name}"
    room_dir = os.path.join(app.config['UPLOAD_FOLDER'], room_code)
    os.makedirs(room_dir, exist_ok=True)
    save_path = os.path.join(room_dir, final_name)
    file.save(save_path)
    public_url = f"/voice/{room_code}/{final_name}"
    message = {"sender": session.get('name'), "type": "voice", "url": public_url}
    rooms[room_code]['messages'].append(message)
    send(message, to=room_code)
    return jsonify({"url": public_url}), 201

@app.route('/voice/<room_code>/<filename>', methods=['GET'])
def get_voice(room_code, filename):
    room_dir = os.path.join(app.config['UPLOAD_FOLDER'], room_code)
    return send_from_directory(room_dir, filename, as_attachment=False)

@app.route('/session', methods=['POST'])
def set_session():
    data = request.get_json(silent=True) or {}
    name = data.get('name')
    room = data.get('room')
    if not name or not room:
        return jsonify({"error": "'name' and 'room' are required"}), 400
    session['name'] = name
    session['room'] = room
    return jsonify({"ok": True}), 200

@socketio.on('connect')
def handle_connect():
    name = session.get('name')
    room = session.get('room')
    if not name or not room or room not in rooms:
        return
    join_room(room)
    rooms[room]['members'] += 1
    send({"message": f"{name} has joined the room", "sender": ""}, to=room)

@socketio.on('message')
def handle_message(data):
    room = session.get('room')
    name = session.get('name')
    if room not in rooms:
        return
    message_text = (data or {}).get('message')
    if not message_text:
        return
    message = {"sender": name, "message": message_text}
    rooms[room]['messages'].append(message)
    send(message, to=room)

@socketio.on('disconnect')
def handle_disconnect():
    room = session.get('room')
    name = session.get('name')
    if room in rooms:
        rooms[room]['members'] -= 1
        if rooms[room]['members'] <= 0:
            del rooms[room]
        else:
            send({"message": f"{name} has left the room", "sender": ""}, to=room)
    leave_room(room)

if __name__ == "__main__":
    socketio.run(app, debug=True)