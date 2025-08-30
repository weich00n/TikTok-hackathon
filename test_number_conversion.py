#!/usr/bin/env python3
"""
Test script for the number conversion functionality
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'util'))

# Import the function directly
sys.path.append('util')
import importlib.util
spec = importlib.util.spec_from_file_location("t2s_model", "util/t2s-model.py")
t2s_model = importlib.util.module_from_spec(spec)
spec.loader.exec_module(t2s_model)
convert_spoken_numbers_to_digits = t2s_model.convert_spoken_numbers_to_digits

def test_number_conversion():
    """Test various number conversion scenarios"""
    
    test_cases = [
        {
            "input": "my credit card number is one two three four dash five six seven eight dash nine zero one two dash three four five six",
            "expected_contains": ["1234", "5678", "9012", "3456"],
            "description": "Credit card number"
        },
        {
            "input": "call me at five five five dash one two three dash four five six seven",
            "expected_contains": ["555", "123", "4567"],
            "description": "Phone number"
        },
        {
            "input": "my social security number is one two three dash four five dash six seven eight nine",
            "expected_contains": ["123", "45", "6789"],
            "description": "SSN"
        },
        {
            "input": "the code is one two three four five six seven eight nine zero",
            "expected_contains": ["1234567890"],
            "description": "Long digit sequence"
        },
        {
            "input": "I have one apple and two oranges",
            "expected_unchanged": True,
            "description": "Normal speech with numbers (should not change)"
        },
        {
            "input": "my pin is one two three four",
            "expected_contains": ["1234"],
            "description": "PIN number"
        },
        {
            "input": "the verification code is nine eight seven six five four",
            "expected_contains": ["987654"],
            "description": "Verification code"
        }
    ]
    
    print("🧪 Testing Number Conversion Function")
    print("=" * 50)
    
    passed = 0
    total = len(test_cases)
    
    for i, test in enumerate(test_cases, 1):
        input_text = test["input"]
        result = convert_spoken_numbers_to_digits(input_text)
        
        print(f"\n📝 Test {i}: {test['description']}")
        print(f"Input:  {input_text}")
        print(f"Output: {result}")
        
        if test.get("expected_unchanged"):
            if result == input_text:
                print("✅ PASS - Text unchanged as expected")
                passed += 1
            else:
                print("❌ FAIL - Text was changed when it shouldn't have been")
        else:
            expected = test.get("expected_contains", [])
            all_found = all(str(exp) in result for exp in expected)
            
            if all_found:
                print(f"✅ PASS - Found all expected patterns: {expected}")
                passed += 1
            else:
                missing = [exp for exp in expected if str(exp) not in result]
                print(f"❌ FAIL - Missing patterns: {missing}")
    
    print("\n" + "=" * 50)
    print(f"📊 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Number conversion is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the implementation.")
    
    return passed == total

if __name__ == "__main__":
    test_number_conversion()
