from transformers import pipeline
import re


pipe = pipeline("token-classification",
                model="iiiorg/piiranha-v1-detect-personal-information",
                aggregation_strategy="simple")


# core logic
# TODO: take in unedited text input, return edited text output
def main():

    text = "This is Harry and you can contact him by phone at +182 88991 129374"
    results = pipe(text)

    print(results)
    print("Original:", text)
    print("Redacted:", redact_text(text, results))

def redact_text(text, results):
    redacted = text
    # Process in reverse order to avoid messing up character indices
    for r in sorted(results, key=lambda x: x['start'], reverse=True):
        redacted = redacted[:r['start']] + "[REDACTED]" + redacted[r['end']:]
    return re.sub(r'(\[REDACTED\])+', '[REDACTED]', redacted)



if __name__ == "__main__":
    main()