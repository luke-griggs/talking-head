import React from 'react';
import '../styles/TranscriptionCard.css';

interface TranscriptionCardProps {
  isRecording: boolean;
  transcripts: string[];
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export const TranscriptionCard: React.FC<TranscriptionCardProps> = ({
  isRecording,
  transcripts,
  onStartRecording,
  onStopRecording,
}) => {
  return (
    <div className="transcription-card">
      <div className="card-header">
        <h1 className="card-title">Voice Transcription</h1>
        <p className="card-subtitle">
          Real-time speech to text powered by AssemblyAI
        </p>
      </div>

      <div className="card-content">
        <div className="recording-section">
          <button
            className={`record-button ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? onStopRecording : onStartRecording}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <div className="button-content">
              {isRecording ? (
                <>
                  <div className="recording-indicator">
                    <span className="pulse-ring"></span>
                    <span className="pulse-ring"></span>
                    <span className="pulse-dot"></span>
                  </div>
                  <span>Stop Recording</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                  <span>Start Recording</span>
                </>
              )}
            </div>
          </button>

          {isRecording && (
            <div className="recording-status">
              <span className="status-dot"></span>
              <span>Listening...</span>
            </div>
          )}
        </div>

        <div className="transcripts-section">
          <div className="transcripts-header">
            <h2 className="transcripts-title">Transcripts</h2>
            {transcripts.length > 0 && (
              <span className="transcript-count">{transcripts.length}</span>
            )}
          </div>

          <div className="transcripts-container">
            {transcripts.length === 0 ? (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 9h6v6h-6z" />
                  <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z" />
                  <path d="M12 3v6m0 6v6m-9-9h6m6 0h6" strokeOpacity="0.3" />
                </svg>
                <p>No transcripts yet</p>
                <p className="empty-state-hint">Click the microphone to start recording</p>
              </div>
            ) : (
              <div className="transcripts-list">
                {transcripts.map((transcript, index) => (
                  <div key={index} className="transcript-item">
                    <div className="transcript-number">{index + 1}</div>
                    <div className="transcript-text">{transcript}</div>
                    <div className="transcript-time">
                      {new Date().toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card-footer">
        <p className="footer-text">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          Speak clearly for best results
        </p>
      </div>
    </div>
  );
};