import React from 'react';
import { RotateCcw } from 'lucide-react';
import useVoiceAgent from './hooks/useVoiceAgent';
import { useTheme } from './hooks/useTheme';
import { ThemeSelector } from './components/ThemeSelector';
import { RecordingButton } from './components/RecordingButton';
import { AudioPlayer } from './components/AudioPlayer';
import { StatusMessage } from './components/StatusMessage';
import { WaveformAnimation } from './components/WaveformAnimation';
import React, { useEffect } from 'react';




  function App() {
  const { theme } = useTheme();
  const {
    audioState,
    startRecording,
    stopRecording,
    clearError,
  } = useVoiceAgent();
   useEffect(() => {
    startRecording();
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col transition-all duration-300"
      style={{
        background: 'linear-gradient(to right, #1b1442, #0078c3)',
        color: 'white',
      }}
    >
      {/* Header */}
      <header className="w-full p-6 border-b border-white/20 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.jpg" alt="Finova Logo" className="h-10 rounded-md" />
            <div>
              <h1 className="text-3xl font-bold text-white">Finova Voice AI</h1>
              <p className="text-white/70 text-sm mt-1">Your secure voice assistant</p>
            </div>
          </div>
          <ThemeSelector />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md mx-auto">
          <div
            className="p-8 rounded-2xl shadow-2xl transition-all duration-300 border border-white/20 backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
            {/* Status Messages */}
            <div className="mb-6 space-y-3">
              {audioState.error && (
                <StatusMessage
                  type="error"
                  message={audioState.error}
                  onDismiss={clearError}
                />
              )}
              {audioState.isProcessing && (
                <StatusMessage
                  type="loading"
                  message="Processing your request..."
                />
              )}
              {audioState.isRecording && (
                <StatusMessage
                  type="info"
                  message="Listening... Click to stop and send"
                />
              )}
            </div>

            {/* Recording Section */}
            <div className="text-center mb-8">
              <div className="mb-6">
                <RecordingButton
                  isRecording={audioState.isRecording}
                  onStartRecording={startRecording}
                  onStopRecording={stopRecording}
                  disabled={audioState.isProcessing}
                />
              </div>

              <div className="mb-6">
                <WaveformAnimation isActive={audioState.isRecording || audioState.isProcessing} />
              </div>

              <div className="mb-6">
                {audioState.isRecording ? (
                  <p className="text-white/60">
                    Listening... recording will stop when you're done speaking
                  </p>
                ) : audioState.isProcessing ? (
                  <p className="text-white">
                    Processing your message...
                  </p>
                ) : audioState.responseAudio ? (
                  <p className="text-white">
                    Response ready to play
                  </p>
                ) : (
                  <p className="text-white/50">
                    Click to start conversation
                  </p>
                )}
              </div>

              {(audioState.audioBlob || audioState.responseAudio || audioState.isProcessing) && (
                <div className="flex justify-center">
                  <button
                    onClick={reset}
                    disabled={audioState.isProcessing}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RotateCcw size={20} />
                    New Conversation
                  </button>
                </div>
              )}
            </div>

            {/* Play Response Buttons */}
            {audioState.responseAudio && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <button
                  onClick={() => playResponse()}
                  className="px-6 py-3 rounded-lg font-medium text-white bg-[#0078c3] hover:bg-[#005fa3] transition-all duration-200"
                >
                  ▶️ Play Response
                </button>

                <button
                  onClick={stopPlaying}
                  className="px-6 py-3 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-all duration-200"
                >
                  ⏹️ Stop
                </button>
              </div>
            )}

            {audioState.responseAudio && (
              <p className="text-sm text-white/60 mt-2 text-center">
                Tap play to hear the response.
              </p>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 text-center">
            <div
              className="p-4 rounded-lg border border-white/10 backdrop-blur-sm transition-all duration-300"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
            >
              <h3 className="font-semibold mb-2 text-white">How to use:</h3>
              <ol className="text-sm space-y-1 text-white/60">
                <li>1. Click the microphone to start recording</li>
                <li>2. Speak your question or request</li>
                <li>3. Recording will automatically stop when you're done speaking</li>
                <li>4. Tap play to hear the AI response</li>
                <li>5. Start a new conversation anytime</li>
              </ol>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full p-6 text-center border-t border-white/10">
        <p className="text-white/60 text-sm">
          Powered by Groq, Whisper, and ElevenLabs — Styled for Finova
        </p>
      </footer>
    </div>
  );
}

export default App;
