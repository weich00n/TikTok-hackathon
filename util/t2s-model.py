import torch
from transformers import Speech2TextProcessor, Speech2TextForConditionalGeneration
import numpy as np
import os
import ffmpeg

model = Speech2TextForConditionalGeneration.from_pretrained("facebook/s2t-small-librispeech-asr")
processor = Speech2TextProcessor.from_pretrained("facebook/s2t-small-librispeech-asr")

def transcribe_audio(audio_file_path):
    """
    Transcribe audio file to text using ffmpeg for audio loading
    """
    try:
        # Check if file exists
        if not os.path.exists(audio_file_path):
            raise FileNotFoundError(f"Audio file not found: {audio_file_path}")
        
        print(f"🎵 Loading audio file: {audio_file_path}")
        
        # Use ffmpeg to convert audio to raw numpy array
        try:
            # Read audio using ffmpeg-python
            out, _ = (
                ffmpeg
                .input(audio_file_path)
                .output('pipe:', format='f32le', acodec='pcm_f32le', ac=1, ar=16000)
                .run(capture_stdout=True, capture_stderr=True)
            )
            
            # Convert bytes to numpy array
            audio_array = np.frombuffer(out, np.float32)
            sampling_rate = 16000
            
        except Exception as e:
            print(f"❌ FFmpeg audio loading failed: {e}")
            raise Exception(f"Could not load audio file with ffmpeg: {e}")
        
        print(f"✅ Audio loaded: {len(audio_array)} samples at {sampling_rate}Hz")
        
        # Process audio for the model
        input_features = processor(
            audio_array,
            sampling_rate=16000,
            return_tensors="pt"
        ).input_features
        
        # Generate transcription
        generated_ids = model.generate(input_features=input_features)
        
        # Decode the transcription
        transcription = processor.batch_decode(generated_ids, skip_special_tokens=True)
        
        return transcription[0]  # Return first (and only) transcription
        
    except Exception as e:
        print(f"❌ Error in transcribe_audio: {e}")
        raise e

def main():
    # Test the transcription
    audio_file = "data/testaudio1.m4a"
    try:
        text = transcribe_audio(audio_file)
        print(f"Transcribed: {text}")
    except Exception as e:
        print(f"Failed to transcribe: {e}")

if __name__ == "__main__":
    main()