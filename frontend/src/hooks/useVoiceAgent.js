import { useState, useRef } from 'react';

export default function useVoiceAgent() {
  const [audioState, setAudioState] = useState({
    isListening: false,
    isProcessing: false,
    error: null,
    responseAudio: null,
  });
  const mediaRecorderRef = useRef(null);
  const currentAudioRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          setAudioState((s) => ({ ...s, isProcessing: true }));
          const ttsBlob = await sendAudioChunk(e.data);
          if (ttsBlob) {
            playAndRestart(ttsBlob);
            setAudioState((s) => ({ ...s, responseAudio: ttsBlob }));
          } else {
            setAudioState((s) => ({ ...s, error: 'Transcription or TTS failed' }));
          }
          setAudioState((s) => ({ ...s, isProcessing: false }));
        }
      };

      recorder.onstop = () => {
        setAudioState((s) => ({ ...s, isListening: false }));
      };

      recorder.start(); // start immediately
      mediaRecorderRef.current = recorder;
      setAudioState((s) => ({ ...s, isListening: true }));
    } catch (err) {
      console.error(err);
      setAudioState((s) => ({ ...s, error: 'Could not access microphone' }));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setAudioState((s) => ({ ...s, isListening: false }));
    }
  };

  const playAndRestart = (ttsBlob) => {
    const audioUrl = URL.createObjectURL(ttsBlob);
    const audio = new Audio(audioUrl);
    currentAudioRef.current = audio;

    audio.onended = () => {
      console.log('✅ Response finished playing, starting recording again...');
      startRecording();
    };

    audio.play();
  };

  const clearError = () => setAudioState((s) => ({ ...s, error: null }));

  return {
    audioState,
    startRecording,
    stopRecording,
    clearError,
  };
}

async function sendAudioChunk(audioBlob) {
  const formData = new FormData();
  formData.append('file', audioBlob, 'chunk.wav');
  try {
    const res = await fetch('http://127.0.0.1:8000/transcribe-and-respond', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      console.error('Backend error:', await res.text());
      return null;
    }
    return await res.blob();
  } catch (e) {
    console.error(e);
    return null;
  }
}
