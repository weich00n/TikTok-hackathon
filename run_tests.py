#!/usr/bin/env python3
"""
Test runner for the TikTok Hackathon project
"""
import os
import sys
import subprocess

def run_test(test_name):
    """Run a specific test file"""
    test_path = os.path.join('tests', f'test_{test_name}.py')
    if not os.path.exists(test_path):
        print(f"❌ Test file not found: {test_path}")
        return False
    
    print(f"🧪 Running {test_name} tests...")
    try:
        result = subprocess.run([sys.executable, test_path], 
                              capture_output=False, 
                              text=True, 
                              cwd=os.path.dirname(__file__))
        return result.returncode == 0
    except Exception as e:
        print(f"❌ Error running test: {e}")
        return False

def main():
    """Main test runner"""
    print("🧪 TikTok Hackathon Test Runner")
    print("=" * 40)
    
    available_tests = [
        ('quick', 'Quick backend availability test'),
        ('simple', 'Direct backend function tests (no server required)'),
        ('audio_file', 'Test any audio file with transcription and PII detection'),
        ('audio_enhanced', 'Audio messaging with PII detection (requires server)'),
        ('socketio', 'Real-time SocketIO messaging tests (requires server)')
    ]
    
    print("Available tests:")
    for i, (test_name, description) in enumerate(available_tests, 1):
        print(f"  {i}. {test_name} - {description}")
    print("  a. Run all tests")
    print("  q. Quit")
    
    while True:
        choice = input("\nSelect test to run (1-4, a, q): ").strip().lower()
        
        if choice == 'q':
            break
        elif choice == 'a':
            print("\n🚀 Running all tests...")
            for test_name, _ in available_tests:
                run_test(test_name)
                print()
            break
        elif choice.isdigit() and 1 <= int(choice) <= len(available_tests):
            test_name = available_tests[int(choice) - 1][0]
            run_test(test_name)
            break
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()
