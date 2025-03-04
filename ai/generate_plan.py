import sys
import json
from transformers import pipeline

def generate_plan(prompt):
    generator = pipeline("text-generation", model="mistralai/Mistral-7B-Instruct-v0.1")
    response = generator(prompt, max_length=1024, do_sample=True, temperature=0.7)
    return response[0]["generated_text"]

if __name__ == "__main__":
    prompt = sys.argv[1]
    try:
        output = generate_plan(prompt)
        print(output)
    except Exception as e:
        print(f"Erreur dans la génération : {str(e)}", file=sys.stderr)
        sys.exit(1)
