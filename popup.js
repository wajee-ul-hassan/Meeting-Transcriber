let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let timerInterval;
let elapsedTime = 0;
let transcriptionText = "";
let notesText = "";

const toggleButton = document.getElementById("toggleRecording");
const timerDisplay = document.getElementById("timer");
const statusDisplay = document.getElementById("status");
const fileUpload = document.getElementById("uploadFile");

toggleButton.addEventListener("click", async () => {
    if (!isRecording) {
        await startRecording();
    } else {
        stopRecording();
    }
});

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
            uploadAudio(audioBlob);
            resetTimer();
        };

        mediaRecorder.start();
        toggleButton.textContent = "Stop Recording";
        isRecording = true;
        statusDisplay.textContent = "Recording...";
        startTimer();
    } catch (error) {
        statusDisplay.textContent = "Microphone access error.";
        console.error("Recording error:", error);
    }
}

function stopRecording() {
    mediaRecorder.stop();
    toggleButton.textContent = "Start Recording";
    isRecording = false;
    statusDisplay.textContent = "Processing audio...";
}

function startTimer() {
    elapsedTime = 0;
    timerInterval = setInterval(() => {
        elapsedTime++;
        const minutes = String(Math.floor(elapsedTime / 60)).padStart(2, "0");
        const seconds = String(elapsedTime % 60).padStart(2, "0");
        timerDisplay.textContent = `${minutes}:${seconds}`;
    }, 1000);
}

function resetTimer() {
    clearInterval(timerInterval);
    timerDisplay.textContent = "00:00";
}

fileUpload.addEventListener("change", event => {
    const file = event.target.files[0];
    if (file) {
        uploadAudio(file);
    }
});

function uploadAudio(audioBlob) {
    const formData = new FormData();
    formData.append("file", audioBlob, "meeting_audio.wav");

    statusDisplay.textContent = "Processing audio...";

    fetch("http://127.0.0.1:5000/transcribe", {
        method: "POST",
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        transcriptionText = data.transcription;
        notesText = data.key_points;
        statusDisplay.textContent = "Processing complete.";
    })
    .catch(error => {
        statusDisplay.textContent = "Error processing audio.";
        console.error("Error:", error);
    });
}

document.getElementById("saveNotes").addEventListener("click", () => {
    if (!notesText) {
        alert("No notes available to save.");
        return;
    }
    const blob = new Blob([notesText], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Meeting_Notes.txt";
    link.click();
});

document.getElementById("saveTranscription").addEventListener("click", () => {
    if (!transcriptionText) {
        alert("No transcription available to save.");
        return;
    }
    const blob = new Blob([transcriptionText], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Full_Transcription.txt";
    link.click();
});
