import { useState, useCallback, useRef } from 'react';
import { run, cleanup } from '../speech/user-speech';

export const useTranscription = () => {
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const transcriptsRef = useRef<string[]>([]);

  const startRecording = useCallback(() => {
    setIsRecording(true);
    setTranscripts([]);
    transcriptsRef.current = [];
    
    run(transcriptsRef.current, (updatedTranscripts) => {
      setTranscripts(updatedTranscripts);
    });
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    cleanup();
  }, []);

  return {
    transcripts,
    isRecording,
    startRecording,
    stopRecording,
  };
};