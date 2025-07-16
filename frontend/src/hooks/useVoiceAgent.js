import { useState, useRef } from 'react';

export default function useVoiceAgent() {
  const [audioState, setAudioState] = useState({
    isRecording: false,
    isProcessing: false,
    error: null,
    responseAudio: null,
  });
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          console.log('🎙 Sending chunk to backend...');
          setAudioState((s) => ({ ...s, isProcessing: true }));

          const ttsBlob = await sendAudioChunk(e.data);
          if (ttsBlob) {
            playAudio(ttsBlob);
            setAudioState((s) => ({ ...s, responseAudio: ttsBlob }));
          }

          setAudioState((s) => ({ ...s, isProcessing: false }));
        }
      };

      mediaRecorderRef.current.onstop = () => {
        setAudioState((s) => ({ ...s, isRecording: false }));
        console.log('🛑 Recorder stopped');
      };

      mediaRecorderRef.current.start(2000); // every 2 seconds
      setAudioState((s) => ({ ...s, isRecording: true }));
    } catch (err) {
      console.error(err);
      setAudioState((s) => ({ ...s, error: 'Could not access microphone' }));
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setAudioState((s) => ({ ...s, isRecording: false }));
  };

  const playResponse = () => {
    if (audioState.responseAudio) {
      const audioUrl = URL.createObjectURL(audioState.responseAudio);
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  const stopPlaying = () => {
    // optional: track current Audio instance & stop it
  };

  const clearError = () => setAudioState((s) => ({ ...s, error: null }));

  const reset = () => {
    stopRecording();
    setAudioState({
      isRecording: false,
      isProcessing: false,
      error: null,
      responseAudio: null,
    });
  };

  return {
    audioState,
    startRecording,
    stopRecording,
    playResponse,
    stopPlaying,
    clearError,
    reset,
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
    return await res.blob(); // reply audio
  } catch (e) {
    console.error(e);
    return null;
  }
}
