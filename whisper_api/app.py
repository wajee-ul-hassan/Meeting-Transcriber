from flask import Flask, request, jsonify
import whisper
import os
import google.generativeai as genai

app = Flask(__name__)
model = whisper.load_model("base")

# Set your Gemini API key here
genai.configure(api_key="AIzaSyAzUG3TgCRBf5NTO44jqLbQA9jJa6X0Pkk")

@app.route("/transcribe", methods=["POST"])
def transcribe():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    audio_file = request.files["file"]
    audio_path = "temp_audio.wav"
    audio_file.save(audio_path)

    # Transcription
    result = model.transcribe(audio_path)
    transcription = result["text"]

    # Extract Key Points using Gemini
    key_points = extract_key_points_with_gemini(transcription)

    os.remove(audio_path)  # Cleanup

    return jsonify({
        "transcription": transcription,
        "key_points": key_points
    })

def extract_key_points_with_gemini(text):
    try:
        # Initialize the Gemini model
        model = genai.GenerativeModel('gemini-pro')

        # Generate key points using Gemini
        response = model.generate_content(
            f"Extract the key points and important notes from the following meeting transcription:\n\n{text}"
        )

        # Extract the generated key points from the Gemini response
        key_points = response.text.strip()
        return key_points if key_points else "No key points found."
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return "Error generating key points."

if __name__ == "__main__":
    app.run(debug=True)