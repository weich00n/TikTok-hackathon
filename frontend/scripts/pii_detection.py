import re
import json
from typing import Dict, List, Tuple

class PIIDetector:
    """
    Advanced PII detection system for messaging applications.
    Detects and redacts various types of personally identifiable information.
    """
    
    def __init__(self):
        # Define PII patterns
        self.patterns = {
            'phone_number': [
                r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',  # US phone numbers
                r'\b$$\d{3}$$\s?\d{3}[-.]?\d{4}\b',  # (123) 456-7890
                r'\b\+\d{1,3}[-.\s]?\d{1,14}\b'  # International format
            ],
            'email': [
                r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            ],
            'ssn': [
                r'\b\d{3}[-.]?\d{2}[-.]?\d{4}\b'  # Social Security Number
            ],
            'credit_card': [
                r'\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b'  # Credit card numbers
            ],
            'address': [
                r'\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl)\b'
            ],
            'ip_address': [
                r'\b(?:\d{1,3}\.){3}\d{1,3}\b'  # IPv4 addresses
            ]
        }
    
    def detect_pii(self, text: str) -> Dict:
        """
        Detect PII in text and return redacted version with metadata.
        
        Args:
            text (str): Input text to scan for PII
            
        Returns:
            Dict: Contains redacted text, detected fields, and original content
        """
        redacted_text = text
        detected_fields = []
        redactions_made = []
        
        for pii_type, patterns in self.patterns.items():
            for pattern in patterns:
                matches = re.finditer(pattern, text, re.IGNORECASE)
                for match in matches:
                    detected_fields.append(pii_type)
                    original_value = match.group()
                    redacted_value = f"[REDACTED]"
                    redacted_text = redacted_text.replace(original_value, redacted_value)
                    redactions_made.append({
                        'type': pii_type,
                        'original': original_value,
                        'position': match.span()
                    })
        
        return {
            'has_redactions': len(detected_fields) > 0,
            'redacted_content': redacted_text,
            'detected_fields': list(set(detected_fields)),
            'original_content': text,
            'redactions': redactions_made
        }
    
    def process_voice_transcript(self, transcript: str) -> Dict:
        """
        Process voice message transcript for PII detection.
        
        Args:
            transcript (str): Transcribed voice message text
            
        Returns:
            Dict: PII detection results for voice message
        """
        result = self.detect_pii(transcript)
        result['message_type'] = 'voice'
        return result

# Example usage and testing
if __name__ == "__main__":
    detector = PIIDetector()
    
    # Test cases
    test_messages = [
        "Hi! My phone number is 555-123-4567 and email is john@example.com",
        "Can you send the report to jane.doe@company.com?",
        "My SSN is 123-45-6789 for verification",
        "I live at 123 Main Street, Anytown",
        "The server IP is 192.168.1.1"
    ]
    
    print("PII Detection Test Results:")
    print("=" * 50)
    
    for i, message in enumerate(test_messages, 1):
        result = detector.detect_pii(message)
        print(f"\nTest {i}:")
        print(f"Original: {result['original_content']}")
        print(f"Redacted: {result['redacted_content']}")
        print(f"Detected PII: {result['detected_fields']}")
        print(f"Has Redactions: {result['has_redactions']}")
