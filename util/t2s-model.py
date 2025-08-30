import numpy as np
from pydub import AudioSegment
from transformers import Speech2TextProcessor, Speech2TextForConditionalGeneration

model = Speech2TextForConditionalGeneration.from_pretrained("facebook/s2t-small-librispeech-asr")
processor = Speech2TextProcessor.from_pretrained("facebook/s2t-small-librispeech-asr")

def transcribe_audio(audio_file_path):
    """
    Transcribe audio file to text using pydub (no torchaudio)
    Args:
        audio_file_path: Path to audio file (wav, mp3, etc.)
    Returns:
        Transcribed text
    """
    # Load audio using pydub
    audio = AudioSegment.from_file(audio_file_path)
    samples = np.array(audio.get_array_of_samples()).astype(np.float32) / (2 ** (8 * audio.sample_width - 1))
    # If stereo, convert to mono
    if audio.channels > 1:
        samples = samples.reshape((-1, audio.channels))
        samples = samples.mean(axis=1)
    sampling_rate = audio.frame_rate

    # Resample if needed
    target_sr = 16000
    if sampling_rate != target_sr:
        from scipy.signal import resample
        num_samples = int(len(samples) * target_sr / sampling_rate)
        samples = resample(samples, num_samples)
        sampling_rate = target_sr

    # Process audio for the model
    input_features = processor(
        samples,
        sampling_rate=target_sr,
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
    input_features = processor(
        audio_array,
        sampling_rate=sampling_rate,
        return_tensors="pt"
    ).input_features

    generated_ids = model.generate(input_features=input_features)
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