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
      // Stop old recorder if running
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          setAudioState((s) => ({ ...s, isProcessing: true }));

          const ttsBlob = await sendAudioChunk(e.data);
          if (ttsBlob) {
            playResponseAndRestart(ttsBlob);
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

      recorder.start(); // start now
      mediaRecorderRef.current = recorder;
      setAudioState((s) => ({ ...s, isListening: true }));
      console.log('🎙 Started recording...');
    } catch (err) {
      console.error(err);
      setAudioState((s) => ({ ...s, error: 'Could not access microphone' }));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setAudioState((s) => ({ ...s, isListening: false }));
      console.log('🛑 Stopped recording...');
    }
  };

  const playResponseAndRestart = (ttsBlob) => {
    const audioUrl = URL.createObjectURL(ttsBlob);
    const audio = new Audio(audioUrl);
    currentAudioRef.current = audio;

    audio.onended = () => {
      console.log('✅ Response finished playing, starting recording again...');
      startRecording();
    };

    audio.onerror = (e) => {
      console.error('Audio playback error:', e);
      // Try to restart anyway
      startRecording();
    };

    audio.play().catch((err) => {
      console.error('Audio play failed:', err);
      // Try to restart recording anyway
      startRecording();
    });
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
    console.error('Fetch failed:', e);
    return null;
  }
}
