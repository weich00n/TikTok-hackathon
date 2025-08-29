import torch
from transformers import Speech2TextProcessor, Speech2TextForConditionalGeneration
import librosa

model = Speech2TextForConditionalGeneration.from_pretrained("facebook/s2t-small-librispeech-asr")
processor = Speech2TextProcessor.from_pretrained("facebook/s2t-small-librispeech-asr")

def transcribe_audio(audio_file_path):
    """
    Transcribe audio file to text
    Args:
        audio_file_path: Path to audio file (wav, mp3, etc.)
    Returns:
        Transcribed text
    """
    # Load audio using librosa
    audio_array, sampling_rate = librosa.load(audio_file_path, sr=16000)
    
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

def transcribe_audio_array(audio_array, sampling_rate=16000):
    """
    Transcribe audio numpy array to text
    Args:
        audio_array: numpy array of audio data
        sampling_rate: sampling rate of audio
    Returns:
        Transcribed text
    """
    # Process audio for the model
    input_features = processor(
        audio_array,
        sampling_rate=sampling_rate,
        return_tensors="pt"
    ).input_features
    
    # Generate transcription
    generated_ids = model.generate(input_features=input_features)
    
    # Decode the transcription
    transcription = processor.batch_decode(generated_ids, skip_special_tokens=True)
    
    return transcription[0]

def main():
    # Example 1: From file
    audio_file = "data/testaudio1.m4a"
    text = transcribe_audio(audio_file)
    print(f"Transcribed: {text}")
    
    print("Speech-to-text model loaded. Use transcribe_audio() or transcribe_audio_array()")

if __name__ == "__main__":
    main()