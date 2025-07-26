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

// WAV recording variables
const recordedFrames: Buffer[] = []; // Store audio frames for WAV file

// --- Helper functions ---
function clearLine() {
  console.log("\r" + " ".repeat(80) + "\r");
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

function createWavHeader(
  sampleRate: number,
  channels: number,
  dataLength: number
): Buffer {
  const buffer = Buffer.alloc(44);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8);

  // fmt chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * 2, 28); // byte rate
  buffer.writeUInt16LE(channels * 2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataLength, 40);

  return buffer;
}

// --- Main function ---
export async function run(user_speech: string[]) {
  console.log("Starting AssemblyAI real-time transcription...");
  console.log("Audio will be saved to a WAV file when the session ends.");

  // Initialize WebSocket connection
  ws = new WebSocket(API_ENDPOINT);

  // Setup WebSocket event handlers
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
        const transcript = data.transcript || "";
        const formatted = data.turn_is_formatted;

        if (formatted) {
          clearLine();
          console.log(transcript);
          if (data.end_of_turn_confidence > 0.75) {
            // if there's a high likelihood the turn is over, add to user_speech array
            user_speech.push(data.transcript);
          }
          console.log("DATA", data);
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
          mimeType: "audio/webm;codecs=pcm",
          desiredSampRate: SAMPLE_RATE,
          numberOfAudioChannels: 1,
          bufferSize: 4096,
          timeSlice: 100, // 100ms chunks for better compliance
          ondataavailable: (blob) => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              blob.arrayBuffer().then((buffer) => {
                // Only send non-empty buffers
                if (buffer.byteLength > 0) {
                  ws?.send(buffer);
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
    console.log("attempted to close stop microphone but not recording")
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
