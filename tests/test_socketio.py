import socketio
import time
import requests
import json
import sys
import os

# Add backend path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# SocketIO client for testing real-time features
sio = socketio.Client()

BASE_URL = "http://127.0.0.1:5000"
room_code = None
session_data = None

@sio.event
def connect():
    print("✅ Connected to SocketIO server")

@sio.event
def disconnect():
    print("❌ Disconnected from SocketIO server")

@sio.event
def message(data):
    print(f"📨 Received message: {data}")

def setup_session_and_room():
    """Create a room and set up session"""
    global room_code, session_data
    
    print("🔧 Setting up test environment...")
    
    # Create conversation
    response = requests.post(f"{BASE_URL}/conversations")
    if response.status_code == 201:
        room_code = response.json()['room_code']
        print(f"✅ Created room: {room_code}")
    else:
        print(f"❌ Failed to create room: {response.status_code}")
        return False
    
    # Set session
    session_data = {
        "name": "SocketIOTester",
        "room": room_code
    }
    
    # Use requests session to set cookies
    session = requests.Session()
    response = session.post(f"{BASE_URL}/session", json=session_data)
    if response.status_code == 200:
        print(f"✅ Session set for user: SocketIOTester")
        
        # Get cookies from the session
        cookies = session.cookies.get_dict()
        print(f"🍪 Got session cookies: {list(cookies.keys())}")
        return True
    else:
        print(f"❌ Failed to set session: {response.status_code}")
        return False

def test_socketio_messaging():
    """Test SocketIO real-time messaging"""
    global room_code
    
    if not setup_session_and_room():
        return
    
    try:
        # Connect to SocketIO with session info
        print(f"🔌 Connecting to SocketIO server...")
        
        # Set connection timeout
        sio.connect(BASE_URL, transports=['polling', 'websocket'], wait_timeout=10)
        
        # Wait a moment for connection
        time.sleep(2)
        
        if not sio.connected:
            print("❌ Failed to connect to SocketIO server")
            return
        
        # Test sending messages
        test_messages = [
            "Hello, this is a test message!",
            "Testing PII detection with phone: 123-456-7890",
            "My email is test@example.com",
            "Regular message without PII"
        ]
        
        print(f"\n📤 Sending test messages to room {room_code}...")
        for i, msg in enumerate(test_messages, 1):
            try:
                print(f"   {i}. Sending: {msg}")
                sio.emit('message', {'message': msg})
                time.sleep(1)  # Shorter wait between messages
            except Exception as e:
                print(f"   ❌ Failed to send message {i}: {e}")
        
        # Keep connection alive to receive responses
        print("\n⏳ Waiting for responses...")
        time.sleep(3)  # Shorter wait time
        
        print("✅ SocketIO test completed")
        
    except Exception as e:
        print(f"❌ SocketIO test failed: {e}")
        print("   This might be due to session/cookie issues or server configuration")
    finally:
        # Always try to disconnect
        try:
            if sio.connected:
                sio.disconnect()
        except:
            pass

def test_multiple_users():
    """Simulate multiple users in the same room"""
    print("\n👥 Testing multiple users...")
    
    # This would require multiple SocketIO clients
    # For now, we'll just demonstrate the concept
    print("ℹ️  Multiple user testing would require multiple SocketIO client instances")
    print("   Each client would need its own session and user name")

if __name__ == "__main__":
    print("🧪 SocketIO Real-time Testing")
    print("=" * 50)
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Server is running")
            test_socketio_messaging()
        else:
            print("❌ Server health check failed")
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        print("   Make sure your Flask app is running on http://127.0.0.1:5000")
    
    print("\n✨ SocketIO testing completed!")
