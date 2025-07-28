import RecordRTC from "recordrtc";

// --- Configuration ---
const VITE_ASSEMBLY_KEY = import.meta.env.VITE_ASSEMBLY_KEY;
const CONNECTION_PARAMS = {
  sample_rate: 16000,
  format_turns: true, // Request formatted final transcripts
};

// Audio Configuration
const SAMPLE_RATE = CONNECTION_PARAMS.sample_rate;

const API_ENDPOINT = `wss://streaming.assemblyai.com/v3/ws?sample_rate=${SAMPLE_RATE}&token=${VITE_ASSEMBLY_KEY}`;

// Global variables
let ws: WebSocket | null = null;
let recorder: RecordRTC | null = null;
let mediaStream: MediaStream | null = null;


function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}


export async function run(userTranscripts: string[], onTranscriptUpdate?: (transcripts: string[]) => void) {
  console.log("Starting AssemblyAI real-time transcription...");
  console.log("Audio will be saved to a WAV file when the session ends.");

  ws = new WebSocket(API_ENDPOINT);

  ws?.addEventListener("open", () => {
    console.log("WebSocket connection opened.");
    console.log(`Connected to: ${API_ENDPOINT}`);
    // Start the microphone
    startMicrophone();
  });

  ws?.addEventListener("message", (message: MessageEvent) => {
    try {
      const data = JSON.parse(message.data);
      const msgType = data.type;

      if (msgType === "Begin") {
        const sessionId = data.id;
        const expiresAt = data.expires_at;
        console.log(
          `\nSession began: ID=${sessionId}, ExpiresAt=${formatTimestamp(
            expiresAt
          )}`
        );
      } else if (msgType === "Turn") {
        console.log("TURN", data);
        const transcript = data.transcript || "";

        if (data.end_of_turn_confidence > 0.8) {
          userTranscripts.push(data.transcript);
          console.log("USER_SPEECH", userTranscripts);
          if (onTranscriptUpdate) {
            onTranscriptUpdate([...userTranscripts]);
          }
          // get model response and add to array
          // tts and play the audio
        } else {
          console.log(`\r${transcript}`);
        }
      } else if (msgType === "Termination") {
        const audioDuration = data.audio_duration_seconds;
        const sessionDuration = data.session_duration_seconds;
        console.log(
          `\nSession Terminated: Audio Duration=${audioDuration}s, Session Duration=${sessionDuration}s`
        );
      }
    } catch (error) {
      console.error(`\nError handling message: ${error}`);
      console.error(`Message data: ${message}`);
    }
  });

  ws?.addEventListener("error", (error) => {
    console.error(`\nWebSocket Error: ${error}`);
    cleanup();
  });

  ws?.addEventListener("close", (event) => {
    console.log(
      `\nWebSocket Disconnected: Status=${event.code}, reason=${
        event.reason || "No reason provided"
      }`
    );
    cleanup();
  });
}

function startMicrophone() {
  try {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaStream = stream; // Store the stream reference
        recorder = new RecordRTC(stream, {
          type: "audio",
          mimeType: "audio/wav",
          recorderType: RecordRTC.StereoAudioRecorder,
          desiredSampRate: SAMPLE_RATE,
          numberOfAudioChannels: 1,
          bufferSize: 4096,
          timeSlice: 100,
          ondataavailable: (blob) => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              // Convert blob to ArrayBuffer and send raw audio data
              blob.arrayBuffer().then((buffer) => {
                if (buffer.byteLength > 0) {
                  // For WAV files, we need to skip the WAV header (44 bytes)
                  // and send only the raw PCM data
                  const pcmData = buffer.slice(44);
                  console.log("Sending PCM data, size:", pcmData.byteLength);
                  ws?.send(pcmData);
                }
              });
            }
          },
        });
        recorder.startRecording();
      })
      .catch(console.error);
    console.log("Microphone stream opened successfully.");
  } catch (error) {
    console.error(`Error opening microphone stream: ${error}`);
    cleanup();
  }
}

export async function stopMicrophone() {
  if (!recorder && !mediaStream) {
    console.log("attempted to close stop microphone but not recording");
  }

  if (recorder) {
    recorder.stopRecording();
    recorder = null;
  }

  // Stop all MediaStream tracks to release the microphone
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => {
      track.stop();
    });
    mediaStream = null;
    console.log("MediaStream tracks stopped - microphone released");
  }
}

export function cleanup() {
  if (
    ws &&
    (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
  ) {
    try {
      // Send termination message if possible
      if (ws.readyState === WebSocket.OPEN) {
        const terminateMessage = { type: "Terminate" };
        console.log(
          `Sending termination message: ${JSON.stringify(terminateMessage)}`
        );
        ws.send(JSON.stringify(terminateMessage));
      }
      ws.close();
    } catch (error) {
      console.error(`Error closing WebSocket: ${error}`);
    }
    ws = null;
    console.log("stopping microphone");
    stopMicrophone();
  }
  console.log("Cleanup complete.");
}
