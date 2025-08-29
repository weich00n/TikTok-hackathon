from transformers import pipeline
import torch

pipe = pipeline("automatic-speech-recognition", model="facebook/s2t-small-librispeech-asr")

def transcribe_audio(audio_file_path):
    """
    Transcribe audio file to text
    Args:
        audio_file_path: Path to audio file (wav, mp3, etc.)
    Returns:
        Transcribed text
    """
    result = pipe(audio_file_path)
    return result["text"]

def transcribe_audio_array(audio_array, sampling_rate=16000):
    """
    Transcribe audio numpy array to text
    Args:
        audio_array: numpy array of audio data
        sampling_rate: sampling rate of audio
    Returns:
        Transcribed text
    """
    result = pipe({"array": audio_array, "sampling_rate": sampling_rate})
    return result["text"]

def main():
    # Example 1: From file
    audio_file = "data/testaudio1.m4a"
    text = transcribe_audio(audio_file)
    print(f"Transcribed: {text}")
    
    # Example 2: From microphone (requires additional setup)
    # import sounddevice as sd
    # duration = 5  # seconds
    # sample_rate = 16000
    # audio = sd.rec(int(duration * sample_rate), samplerate=sample_rate, channels=1)
    # sd.wait()
    # text = transcribe_audio_array(audio.flatten(), sample_rate)
    # print(f"Transcribed: {text}")
    
    print("Speech-to-text model loaded. Use transcribe_audio() or transcribe_audio_array()")

if __name__ == "__main__":
    main()