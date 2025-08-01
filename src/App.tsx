import './styles/theme.css';
import './styles/App.css';
import { Layout } from './Layout';
import { TranscriptionCard } from './components/TranscriptionCard';
import { useTranscription } from './hooks/useTranscription';
import Face from './components/face';
import AsciiSelector from './components/AsciiSelector';

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
      <Face />
      <AsciiSelector />
    </Layout>
  );
}

export default App;
