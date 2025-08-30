import numpy as np
import re
from pydub import AudioSegment
from transformers import Speech2TextProcessor, Speech2TextForConditionalGeneration

model = Speech2TextForConditionalGeneration.from_pretrained("facebook/s2t-small-librispeech-asr")
processor = Speech2TextProcessor.from_pretrained("facebook/s2t-small-librispeech-asr")

# Word to digit mapping for number conversion
WORD_TO_DIGIT = {
    'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
    'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9'
}

def convert_spoken_numbers_to_digits(text):
    """
    Convert sequences of spoken numbers to digits to preserve sensitive information like:
    - Credit card numbers: "one two three four" -> "1234"
    - Phone numbers: "five five five one two three" -> "555123"
    - SSN: "one two three four five six seven eight nine" -> "123456789"
    """
    
    # Pattern to match sequences of spoken digit words
    # This matches 3+ consecutive spoken numbers (to avoid converting normal speech)
    number_words = '|'.join(WORD_TO_DIGIT.keys())
    pattern = rf'\b(?:(?:{number_words})\s*(?:dash|hyphen|-|\.|\s)*)+\b'
    
    def replace_number_sequence(match):
        sequence = match.group()
        # Extract just the number words, preserving separators
        words = re.findall(rf'\b({number_words})\b', sequence, re.IGNORECASE)
        
        # Only convert if we have 3+ consecutive numbers (likely sensitive data)
        if len(words) >= 3:
            # Convert words to digits
            digits = ''.join(WORD_TO_DIGIT.get(word.lower(), word) for word in words)
            
            # Preserve original formatting structure
            if 'dash' in sequence.lower() or '-' in sequence:
                # For sequences like "one two three dash four five six"
                # Try to maintain dash structure for credit cards, SSN etc
                if len(digits) == 4:  # Likely credit card group
                    return digits
                elif len(digits) == 9:  # Likely SSN
                    return f"{digits[:3]}-{digits[3:5]}-{digits[5:]}"
                elif len(digits) >= 6:  # Likely phone or credit card
                    # Insert dashes every 4 digits for credit cards
                    formatted = '-'.join([digits[i:i+4] for i in range(0, len(digits), 4)])
                    return formatted
                else:
                    return digits
            else:
                return digits
        else:
            # Keep original text for short sequences (normal speech)
            return sequence
    
    # Apply the conversion
    result = re.sub(pattern, replace_number_sequence, text, flags=re.IGNORECASE)
    
    # Additional patterns for common formats
    # Handle "credit card number is one two three four dash five six seven eight"
    credit_card_pattern = r'\bcredit card number is\s+([a-z\s\-]+)'
    def convert_cc_numbers(match):
        cc_text = match.group(1)
        words = re.findall(rf'\b({number_words})\b', cc_text, re.IGNORECASE)
        if len(words) >= 8:  # Minimum for partial credit card
            digits = ''.join(WORD_TO_DIGIT.get(word.lower(), word) for word in words)
            # Format as credit card groups
            formatted = '-'.join([digits[i:i+4] for i in range(0, len(digits), 4)])
            return f"credit card number is {formatted}"
        return match.group()
    
    result = re.sub(credit_card_pattern, convert_cc_numbers, result, flags=re.IGNORECASE)
    
    # Handle "phone number is five five five dash one two three dash four five six seven"
    phone_pattern = r'\b(?:phone|number|call)\s+(?:is\s+|me\s+at\s+)?([a-z\s\-()]+)'
    def convert_phone_numbers(match):
        phone_text = match.group(1)
        words = re.findall(rf'\b({number_words})\b', phone_text, re.IGNORECASE)
        if len(words) >= 7:  # Minimum for phone number
            digits = ''.join(WORD_TO_DIGIT.get(word.lower(), word) for word in words)
            if len(digits) == 10:  # US phone number
                return match.group().replace(phone_text, f"({digits[:3]}) {digits[3:6]}-{digits[6:]}")
            elif len(digits) >= 7:
                return match.group().replace(phone_text, f"{digits[:3]}-{digits[3:]}")
        return match.group()
    
    result = re.sub(phone_pattern, convert_phone_numbers, result, flags=re.IGNORECASE)
    
    return result

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
    
    # Convert spoken numbers to digits for sensitive data protection
    processed_transcription = convert_spoken_numbers_to_digits(transcription[0])

    return processed_transcription  # Return processed transcription

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
    
    # Convert spoken numbers to digits for sensitive data protection
    processed_transcription = convert_spoken_numbers_to_digits(transcription[0])
    
    return processed_transcription

def main():
    # Example 1: From file
    audio_file = "data/testaudio1.m4a"
    text = transcribe_audio(audio_file)
    print(f"Transcribed: {text}")

    print("Speech-to-text model loaded. Use transcribe_audio() or transcribe_audio_array()")

if __name__ == "__main__":
    main()