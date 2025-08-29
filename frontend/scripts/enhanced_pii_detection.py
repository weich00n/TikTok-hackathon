import re
import json
import hashlib
from typing import Dict, List, Tuple, Optional
from datetime import datetime

class EnhancedPIIDetector:
    """
    Production-grade PII detection system with advanced pattern matching,
    confidence scoring, and comprehensive logging.
    """
    
    def __init__(self):
        # Enhanced PII patterns with confidence weights
        self.patterns = {
            'phone_number': {
                'patterns': [
                    r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',  # US phone numbers
                    r'\b$$\d{3}$$\s?\d{3}[-.]?\d{4}\b',  # (123) 456-7890
                    r'\b\+\d{1,3}[-.\s]?\d{1,14}\b',  # International format
                    r'\b\d{3}\s\d{3}\s\d{4}\b'  # Spaced format
                ],
                'weight': 0.9
            },
            'email': {
                'patterns': [
                    r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
                    r'\b[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\s*\.\s*[A-Z|a-z]{2,}\b'
                ],
                'weight': 0.95
            },
            'ssn': {
                'patterns': [
                    r'\b\d{3}[-.]?\d{2}[-.]?\d{4}\b',
                    r'\b\d{3}\s\d{2}\s\d{4}\b'
                ],
                'weight': 0.98
            },
            'credit_card': {
                'patterns': [
                    r'\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b',
                    r'\b\d{13,19}\b'
                ],
                'weight': 0.85
            },
            'address': {
                'patterns': [
                    r'\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl|Way|Circle|Cir)\b',
                    r'\b\d+\s+[A-Za-z\s]+(?:St\.|Ave\.|Rd\.|Blvd\.|Ln\.|Dr\.|Ct\.|Pl\.)\b'
                ],
                'weight': 0.8
            },
            'ip_address': {
                'patterns': [
                    r'\b(?:\d{1,3}\.){3}\d{1,3}\b',  # IPv4
                    r'\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b'  # IPv6
                ],
                'weight': 0.9
            },
            'date_of_birth': {
                'patterns': [
                    r'\b(?:0[1-9]|1[0-2])[-/.](?:0[1-9]|[12]\d|3[01])[-/.](?:19|20)\d{2}\b',
                    r'\b(?:0[1-9]|[12]\d|3[01])[-/.](?:0[1-9]|1[0-2])[-/.](?:19|20)\d{2}\b',
                    r'\b(?:19|20)\d{2}[-/.](?:0[1-9]|1[0-2])[-/.](?:0[1-9]|[12]\d|3[01])\b'
                ],
                'weight': 0.85
            }
        }
        
        # Context-based confidence adjustments
        self.context_modifiers = {
            'phone_number': {
                'positive': ['call', 'phone', 'number', 'contact', 'reach'],
                'negative': ['price', 'cost', 'amount', 'total', 'sum']
            },
            'address': {
                'positive': ['live', 'address', 'street', 'home', 'mail', 'send'],
                'negative': ['website', 'url', 'link']
            }
        }
        
        self.detection_log = []
    
    def detect_pii(self, text: str, message_id: str = None) -> Dict:
        """
        Advanced PII detection with confidence scoring and context analysis.
        """
        redacted_text = text
        detected_fields = []
        redactions_made = []
        total_confidence = 0
        
        for pii_type, config in self.patterns.items():
            patterns = config['patterns']
            base_weight = config['weight']
            
            for pattern in patterns:
                matches = re.finditer(pattern, text, re.IGNORECASE)
                for match in matches:
                    original_value = match.group()
                    confidence = self._calculate_confidence(
                        pii_type, original_value, text, base_weight
                    )
                    
                    # Only redact if confidence exceeds threshold
                    if confidence > 0.7:
                        detected_fields.append(pii_type)
                        redacted_value = self._get_redaction_text(pii_type)
                        redacted_text = redacted_text.replace(original_value, redacted_value)
                        
                        redaction_info = {
                            'type': pii_type,
                            'original': original_value,
                            'position': match.span(),
                            'confidence': confidence,
                            'hash': hashlib.sha256(original_value.encode()).hexdigest()[:8]
                        }
                        redactions_made.append(redaction_info)
                        total_confidence += confidence
        
        # Log detection event
        detection_event = {
            'message_id': message_id or f"msg_{datetime.now().timestamp()}",
            'timestamp': datetime.now().isoformat(),
            'original_length': len(text),
            'redacted_length': len(redacted_text),
            'pii_types': list(set(detected_fields)),
            'redaction_count': len(redactions_made),
            'avg_confidence': total_confidence / len(redactions_made) if redactions_made else 0
        }
        self.detection_log.append(detection_event)
        
        return {
            'has_redactions': len(detected_fields) > 0,
            'redacted_content': redacted_text,
            'detected_fields': list(set(detected_fields)),
            'original_content': text,
            'redactions': redactions_made,
            'detection_metadata': detection_event
        }
    
    def _calculate_confidence(self, pii_type: str, match: str, context: str, base_weight: float) -> float:
        """Calculate confidence score based on pattern match and context."""
        confidence = base_weight
        
        # Apply context modifiers
        if pii_type in self.context_modifiers:
            modifiers = self.context_modifiers[pii_type]
            context_lower = context.lower()
            
            # Boost confidence for positive context
            for positive_word in modifiers.get('positive', []):
                if positive_word in context_lower:
                    confidence = min(0.98, confidence + 0.05)
            
            # Reduce confidence for negative context
            for negative_word in modifiers.get('negative', []):
                if negative_word in context_lower:
                    confidence = max(0.3, confidence - 0.2)
        
        # Special validation for specific PII types
        if pii_type == 'credit_card':
            confidence *= 0.9 if self._validate_credit_card(match) else 0.5
        elif pii_type == 'ip_address':
            confidence *= 0.9 if self._validate_ip_address(match) else 0.4
        
        return confidence
    
    def _validate_credit_card(self, card_number: str) -> bool:
        """Validate credit card using Luhn algorithm."""
        digits = re.sub(r'\D', '', card_number)
        if len(digits) < 13 or len(digits) > 19:
            return False
        
        # Luhn algorithm
        total = 0
        reverse_digits = digits[::-1]
        
        for i, digit in enumerate(reverse_digits):
            n = int(digit)
            if i % 2 == 1:
                n *= 2
                if n > 9:
                    n -= 9
            total += n
        
        return total % 10 == 0
    
    def _validate_ip_address(self, ip: str) -> bool:
        """Validate IPv4 address."""
        parts = ip.split('.')
        if len(parts) != 4:
            return False
        
        try:
            return all(0 <= int(part) <= 255 for part in parts)
        except ValueError:
            return False
    
    def _get_redaction_text(self, pii_type: str) -> str:
        """Get appropriate redaction text for PII type."""
        redaction_map = {
            'phone_number': '[PHONE REDACTED]',
            'email': '[EMAIL REDACTED]',
            'ssn': '[SSN REDACTED]',
            'credit_card': '[CARD REDACTED]',
            'address': '[ADDRESS REDACTED]',
            'ip_address': '[IP REDACTED]',
            'date_of_birth': '[DOB REDACTED]'
        }
        return redaction_map.get(pii_type, '[REDACTED]')
    
    def get_detection_statistics(self) -> Dict:
        """Get comprehensive detection statistics."""
        if not self.detection_log:
            return {'total_messages': 0, 'messages_with_pii': 0}
        
        total_messages = len(self.detection_log)
        messages_with_pii = sum(1 for log in self.detection_log if log['redaction_count'] > 0)
        
        pii_type_counts = {}
        total_redactions = 0
        
        for log in self.detection_log:
            total_redactions += log['redaction_count']
            for pii_type in log['pii_types']:
                pii_type_counts[pii_type] = pii_type_counts.get(pii_type, 0) + 1
        
        return {
            'total_messages': total_messages,
            'messages_with_pii': messages_with_pii,
            'redaction_rate': messages_with_pii / total_messages if total_messages > 0 else 0,
            'total_redactions': total_redactions,
            'pii_type_distribution': pii_type_counts,
            'avg_redactions_per_message': total_redactions / total_messages if total_messages > 0 else 0
        }

# Example usage and comprehensive testing
if __name__ == "__main__":
    detector = EnhancedPIIDetector()
    
    # Comprehensive test cases
    test_messages = [
        "Hi! My phone number is 555-123-4567 and email is john@example.com",
        "Can you call me at (555) 987-6543? I live at 123 Main Street, Anytown.",
        "My SSN is 123-45-6789 and credit card is 4532-1234-5678-9012",
        "The server IP is 192.168.1.1 and my DOB is 01/15/1990",
        "This costs $555.123.4567 - that's not a phone number!",
        "Visit our website at https://example.com for more info",
        "Emergency contact: Jane Doe at jane.doe@hospital.com or 555-HELP-NOW"
    ]
    
    print("Enhanced PII Detection Test Results:")
    print("=" * 60)
    
    for i, message in enumerate(test_messages, 1):
        result = detector.detect_pii(message, f"test_msg_{i}")
        print(f"\nTest {i}:")
        print(f"Original: {result['original_content']}")
        print(f"Redacted: {result['redacted_content']}")
        print(f"Detected PII: {result['detected_fields']}")
        print(f"Redactions: {len(result['redactions'])}")
        
        if result['redactions']:
            for redaction in result['redactions']:
                print(f"  - {redaction['type']}: confidence {redaction['confidence']:.2f}")
    
    # Print overall statistics
    print(f"\n{'='*60}")
    print("Detection Statistics:")
    stats = detector.get_detection_statistics()
    for key, value in stats.items():
        print(f"{key}: {value}")
