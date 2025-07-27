import './styles/theme.css';
import './styles/App.css';
import { Layout } from './Layout';
import { TranscriptionCard } from './components/TranscriptionCard';
import { useTranscription } from './hooks/useTranscription';

function App() {
  const { transcripts, isRecording, startRecording, stopRecording } = useTranscription();

  return (
    <Layout>
      <TranscriptionCard
        isRecording={isRecording}
        transcripts={transcripts}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
      />
    </Layout>
  );
}

export default App;
