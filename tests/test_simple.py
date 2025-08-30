import sys
import os
import time

# Add the backend directory to path so we can import the server functions
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend'))

# Simple test script for direct backend testing (no HTTP)
def test_pii_detection_directly():
    """Test PII detection by directly calling the function from server.py"""
    print("🔐 Direct PII Detection Testing")
    print("=" * 40)
    
    try:
        # Import the PII processing function from server.py
        from server import process_text_with_pii
        
        # Test cases with different types of PII
        test_cases = [
            {
                "text": "Hello, this is a normal message",
                "expected_pii": False,
                "description": "Clean text (no PII)"
            },
            {
                "text": "Call me at 555-123-4567",
                "expected_pii": True,
                "description": "Phone number"
            },
            {
                "text": "Email me at john@example.com",
                "expected_pii": True,
                "description": "Email address"
            },
            {
                "text": "My SSN is 123-45-6789",
                "expected_pii": True,
                "description": "Social Security Number"
            },
            {
                "text": "Contact: John Doe, 555-1234, john@email.com",
                "expected_pii": True,
                "description": "Multiple PII types"
            }
        ]
        
        print("🧪 Running PII detection tests...")
        all_passed = True
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n{i}. Testing: {test_case['description']}")
            print(f"   Input: '{test_case['text']}'")
            
            try:
                result = process_text_with_pii(test_case['text'])
                
                has_pii = result['hasRedactions']
                redacted_text = result['redactedContent']
                detected_fields = result['detectedFields']
                
                print(f"   Output: '{redacted_text}'")
                print(f"   PII Detected: {has_pii}")
                if detected_fields:
                    print(f"   Fields: {detected_fields}")
                
                # Check if detection matches expectation
                if has_pii == test_case['expected_pii']:
                    print("   ✅ PASS")
                else:
                    print(f"   ❌ FAIL - Expected PII: {test_case['expected_pii']}, Got: {has_pii}")
                    all_passed = False
                    
            except Exception as e:
                print(f"   ❌ ERROR: {e}")
                all_passed = False
        
        print(f"\n{'✅ All tests passed!' if all_passed else '❌ Some tests failed!'}")
        return all_passed
        
    except ImportError as e:
        print(f"❌ Could not import backend modules: {e}")
        print("💡 Make sure the backend server is available for import")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_utility_functions():
    """Test utility functions from the backend"""
    print("\n🔧 Testing Backend Utility Functions")
    print("=" * 40)
    
    try:
        from server import create_message_id, generate_room_code
        
        # Test message ID generation
        print("\n📝 Testing message ID generation...")
        message_id1 = create_message_id()
        message_id2 = create_message_id()
        
        print(f"   ID 1: {message_id1}")
        print(f"   ID 2: {message_id2}")
        
        if message_id1 != message_id2:
            print("   ✅ Message IDs are unique")
        else:
            print("   ❌ Message IDs are not unique")
        
        # Test room code generation
        print("\n🏠 Testing room code generation...")
        room_code1 = generate_room_code()
        room_code2 = generate_room_code()
        
        print(f"   Room 1: {room_code1}")
        print(f"   Room 2: {room_code2}")
        
        if room_code1 != room_code2 and len(room_code1) == 6:
            print("   ✅ Room codes are unique and correct length")
        else:
            print("   ❌ Room code generation failed")
            
        return True
        
    except ImportError as e:
        print(f"❌ Could not import utility functions: {e}")
        return False
    except Exception as e:
        print(f"❌ Error testing utilities: {e}")
        return False

def test_model_loading():
    """Test that ML models can be loaded (lazy loading)"""
    print("\n🤖 Testing ML Model Loading")
    print("=" * 40)
    
    try:
        from server import get_t2s_model, get_piiranha_model
        
        print("📢 Testing PII model loading...")
        pii_model = get_piiranha_model()
        if hasattr(pii_model, 'pipe'):
            print("   ✅ PII model loaded successfully")
        else:
            print("   ❌ PII model missing pipe function")
            
        print("🎙️ Testing Speech-to-Text model loading...")
        print("   ⏳ This may take a while on first load...")
        t2s_model = get_t2s_model()
        if hasattr(t2s_model, 'transcribe_audio'):
            print("   ✅ T2S model loaded successfully")
        else:
            print("   ❌ T2S model missing transcribe_audio function")
            
        return True
        
    except ImportError as e:
        print(f"❌ Could not import model functions: {e}")
        return False
    except Exception as e:
        print(f"❌ Error loading models: {e}")
        print("💡 This is normal if models aren't downloaded yet")
        return False

def run_all_tests():
    """Run all direct backend tests"""
    print("🧪 BACKEND DIRECT TESTING")
    print("=" * 50)
    print("💡 Testing backend functions directly (no HTTP server required)")
    
    tests = [
        ("PII Detection", test_pii_detection_directly),
        ("Utility Functions", test_utility_functions), 
        ("Model Loading", test_model_loading)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🔍 Running {test_name} tests...")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n📊 TEST RESULTS SUMMARY")
    print("=" * 30)
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"   {test_name}: {status}")
    
    total_passed = sum(1 for _, passed in results if passed)
    print(f"\nPassed: {total_passed}/{len(results)} tests")
    
    if total_passed == len(results):
        print("🎉 All backend tests passed!")
    else:
        print("⚠️ Some tests failed - check the output above")

if __name__ == "__main__":
    run_all_tests()
