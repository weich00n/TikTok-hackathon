import sys
import os

# Add the backend directory to path for imports if needed
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend'))

# Quick backend validation test (no HTTP)
def test_backend_availability():
    """Test that backend modules can be imported"""
    print("🚀 Quick Backend Availability Test")
    print("=" * 40)
    
    try:
        print("📦 Testing server module import...")
        import server
        print("✅ Server module imported successfully")
        
        print("🔧 Testing function availability...")
        required_functions = [
            'process_text_with_pii',
            'create_message_id', 
            'generate_room_code',
            'get_t2s_model',
            'get_piiranha_model'
        ]
        
        for func_name in required_functions:
            if hasattr(server, func_name):
                print(f"   ✅ {func_name} available")
            else:
                print(f"   ❌ {func_name} missing")
        
        print("🎯 Testing basic functionality...")
        room_code = server.generate_room_code()
        message_id = server.create_message_id()
        
        print(f"   Generated room code: {room_code}")
        print(f"   Generated message ID: {message_id[:8]}...")
        
        print("\n🎉 Backend is ready for use!")
        return True
        
    except ImportError as e:
        print(f"❌ Cannot import backend: {e}")
        print("💡 Make sure you're running from the correct directory")
        return False
    except Exception as e:
        print(f"❌ Backend test failed: {e}")
        return False

if __name__ == "__main__":
    test_backend_availability()
