import { useState } from "react";
import "./App.css";
import { run } from "./speech/user-speech";
import { cleanup } from "./speech/user-speech";
import UserBubble from "./components/user-bubble";

function App() {
  const [userSpeech, setUserSpeech] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="main">
      <h1>Talking Head</h1>
      <p className="subtitle">Voice-to-text transcription made simple</p>

      <div className="card">
        {isRecording ? (
          <button className="record-button" onClick={() => {
            setIsRecording(false);
            cleanup();
          }}>
            Stop Recording
          </button>
        ) : (
          <button className="record-button" onClick={() => {
            setIsRecording(true);
            run(userSpeech);
          }}>
            Start Recording
          </button>
        )}

        <div className="transcripts-container">
          {userSpeech.length === 0 ? (
            <div className="empty-state">
              Click "Start Recording" to begin transcribing your speech
            </div>
          ) : (
            userSpeech.map((transcript, index) => (
              <div key={index} className="transcript-item">
                {transcript}
              </div>
            ))
          )}
        </div>
      </div>

      <p className="read-the-docs">
        Speak clearly for best transcription results
      </p>
    </div>
  );
}

export default App;
