import sys
import os
import time
import argparse
from pathlib import Path

# Add the backend directory to path so we can import the server functions
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend'))

def test_audio_file(audio_path, show_details=True):
    """Test any audio file with the backend transcription and PII detection"""
    print(f"🎙️ Testing Audio File: {audio_path}")
    print("=" * 60)
    
    # Check if file exists
    if not os.path.exists(audio_path):
        print(f"❌ File not found: {audio_path}")
        return False
    
    # Check file size
    file_size = os.path.getsize(audio_path)
    print(f"📁 File size: {file_size:,} bytes ({file_size / (1024*1024):.2f} MB)")
    
    # Check file extension
    file_ext = os.path.splitext(audio_path)[1].lower()
    supported_formats = {'.wav', '.mp3', '.ogg', '.m4a', '.webm', '.aac', '.amr', '.flac', '.opus'}
    
    if file_ext in supported_formats:
        print(f"✅ File format supported: {file_ext}")
    else:
        print(f"⚠️ File format may not be supported: {file_ext}")
        print(f"   Supported formats: {', '.join(supported_formats)}")
    
    try:
        # Import backend functions
        from server import get_t2s_model, process_text_with_pii, get_audio_duration
        
        print("\n🤖 Loading ML models...")
        
        # Get audio duration first (if possible)
        try:
            duration = get_audio_duration(audio_path)
            print(f"⏱️ Audio duration: {duration:.2f} seconds")
        except Exception as e:
            print(f"⚠️ Could not determine duration: {str(e)[:100]}...")
            duration = 0
        
        # Load speech-to-text model
        print("📢 Loading speech-to-text model...")
        t2s_model = get_t2s_model()
        print("✅ Speech-to-text model loaded")
        
        # Transcribe the audio
        print(f"\n🎯 Transcribing audio file...")
        start_time = time.time()
        
        transcription = t2s_model.transcribe_audio(audio_path)
        
        transcription_time = time.time() - start_time
        print(f"⏱️ Transcription completed in {transcription_time:.2f} seconds")
        
        print(f"\n📝 TRANSCRIPTION RESULT:")
        print(f"🔤 Original text: \"{transcription}\"")
        print(f"📊 Length: {len(transcription)} characters")
        
        if not transcription.strip():
            print("⚠️ Transcription is empty - audio may be silent or unclear")
            return True
        
        # Process through PII detection
        print(f"\n🔒 Running PII detection...")
        pii_result = process_text_with_pii(transcription)
        
        print(f"\n🛡️ PII DETECTION RESULTS:")
        print(f"🔍 Has PII detected: {pii_result['hasRedactions']}")
        print(f"🔤 Redacted text: \"{pii_result['redactedContent']}\"")
        
        if pii_result['hasRedactions']:
            print(f"⚠️ Detected PII fields: {pii_result['detectedFields']}")
            
            if show_details:
                print(f"\n📋 DETAILED PII DETECTION:")
                for detail in pii_result['detectionDetails']:
                    print(f"   🏷️ Type: {detail['type']}")
                    print(f"   📍 Original: \"{detail['original']}\"")
                    print(f"   🎯 Confidence: {detail['confidence']:.3f}")
                    print(f"   📍 Position: {detail['position']}")
                    print()
        else:
            print("✅ No PII detected - text is safe")
        
        # Summary
        print(f"\n📊 PROCESSING SUMMARY:")
        print(f"   📁 File: {os.path.basename(audio_path)}")
        print(f"   ⏱️ Duration: {duration:.2f}s")
        print(f"   🔤 Transcription: {len(transcription)} chars")
        print(f"   ⚡ Processing time: {transcription_time:.2f}s")
        print(f"   🛡️ PII detected: {'Yes' if pii_result['hasRedactions'] else 'No'}")
        
        return True
        
    except ImportError as e:
        print(f"❌ Cannot import backend modules: {e}")
        print("💡 Make sure the backend is properly set up")
        return False
    except Exception as e:
        print(f"❌ Audio processing failed: {e}")
        print(f"💡 Error details: {type(e).__name__}: {str(e)}")
        if "NoBackendError" in str(e):
            print("🔧 SOLUTION: Install audio backend libraries:")
            print("   pip install ffmpeg-python soundfile pydub")
            print("   Or download FFmpeg from https://ffmpeg.org/download.html")
        return False

def test_multiple_files(directory_path, file_pattern="*"):
    """Test multiple audio files in a directory"""
    print(f"🎵 Testing Multiple Audio Files")
    print(f"📁 Directory: {directory_path}")
    print(f"🔍 Pattern: {file_pattern}")
    print("=" * 60)
    
    if not os.path.exists(directory_path):
        print(f"❌ Directory not found: {directory_path}")
        return
    
    # Find audio files
    supported_extensions = {'.wav', '.mp3', '.ogg', '.m4a', '.webm', '.aac', '.amr', '.flac', '.opus'}
    audio_files = []
    
    for ext in supported_extensions:
        pattern = f"*{ext}"
        audio_files.extend(Path(directory_path).glob(pattern))
    
    if not audio_files:
        print(f"❌ No audio files found in {directory_path}")
        return
    
    print(f"📋 Found {len(audio_files)} audio files:")
    for i, file_path in enumerate(audio_files, 1):
        print(f"   {i}. {file_path.name}")
    
    print("\n🚀 Processing files...")
    
    successful = 0
    failed = 0
    
    for i, file_path in enumerate(audio_files, 1):
        print(f"\n{'='*20} FILE {i}/{len(audio_files)} {'='*20}")
        
        try:
            result = test_audio_file(str(file_path), show_details=False)
            if result:
                successful += 1
            else:
                failed += 1
        except Exception as e:
            print(f"❌ Failed to process {file_path.name}: {e}")
            failed += 1
        
        if i < len(audio_files):
            print("\n⏳ Waiting 2 seconds before next file...")
            time.sleep(2)
    
    print(f"\n📊 BATCH PROCESSING SUMMARY:")
    print(f"   ✅ Successful: {successful}")
    print(f"   ❌ Failed: {failed}")
    print(f"   📁 Total: {len(audio_files)}")

def interactive_audio_tester():
    """Interactive audio file tester"""
    print("🎙️ INTERACTIVE AUDIO FILE TESTER")
    print("=" * 50)
    print("💡 Test any audio file with transcription and PII detection")
    print()
    
    while True:
        print("\nOptions:")
        print("1. Test a single audio file")
        print("2. Test all audio files in a directory")
        print("3. Quit")
        
        choice = input("\nEnter your choice (1-3): ").strip()
        
        if choice == '1':
            file_path = input("\n📁 Enter the path to your audio file: ").strip()
            if file_path:
                # Remove quotes if user added them
                file_path = file_path.strip('"\'')
                print()
                test_audio_file(file_path)
            
        elif choice == '2':
            dir_path = input("\n📁 Enter the directory path: ").strip()
            if dir_path:
                # Remove quotes if user added them
                dir_path = dir_path.strip('"\'')
                print()
                test_multiple_files(dir_path)
            
        elif choice == '3':
            print("\n👋 Goodbye!")
            break
            
        else:
            print("❌ Invalid choice. Please try again.")
        
        input("\nPress Enter to continue...")

def main():
    """Main function with command line argument support"""
    parser = argparse.ArgumentParser(description='Test audio files with transcription and PII detection')
    parser.add_argument('audio_file', nargs='?', help='Path to audio file to test')
    parser.add_argument('--directory', '-d', help='Test all audio files in directory')
    parser.add_argument('--interactive', '-i', action='store_true', help='Run in interactive mode')
    parser.add_argument('--no-details', action='store_true', help='Hide detailed PII information')
    
    args = parser.parse_args()
    
    if args.interactive:
        interactive_audio_tester()
    elif args.directory:
        test_multiple_files(args.directory)
    elif args.audio_file:
        test_audio_file(args.audio_file, show_details=not args.no_details)
    else:
        # No arguments provided, run interactive mode
        interactive_audio_tester()

if __name__ == "__main__":
    main()
