import { useState, useRef } from 'react';

export default function useVoiceAgent() {
  const [audioState, setAudioState] = useState({
    isRecording: false,
    isProcessing: false,
    error: null,
    responseAudio: null,
  });
  const mediaRecorderRef = useRef(null);
  const currentAudioRef = useRef(null);
  const streamRef = useRef(null);

  const startRecording = async () => {
    try {
      setAudioState((s) => ({ ...s, error: null }));

      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      mediaRecorderRef.current = new MediaRecorder(streamRef.current);

      mediaRecorderRef.current.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          console.log('🎙 Sending chunk to backend...');
          setAudioState((s) => ({ ...s, isProcessing: true }));

          const ttsBlob = await sendAudioChunk(e.data);
          if (ttsBlob) {
            setAudioState((s) => ({ ...s, responseAudio: ttsBlob }));
            playAudio(ttsBlob);
          }

          setAudioState((s) => ({ ...s, isProcessing: false }));
        }
      };

      mediaRecorderRef.current.onstop = () => {
        setAudioState((s) => ({ ...s, isRecording: false }));
        console.log('🛑 Recorder stopped');
      };

      mediaRecorderRef.current.start(2000); // capture every 2s
      setAudioState((s) => ({ ...s, isRecording: true }));
    } catch (err) {
      console.error(err);
      setAudioState((s) => ({ ...s, error: 'Could not access microphone' }));
    }
  };

  const playAudio = (audioBlob) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    currentAudioRef.current = audio;

    audio.play();
    audio.onended = () => {
      console.log('✅ Finished playing, start recording again...');
      startRecording(); // restart loop
    };
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setAudioState((s) => ({ ...s, isRecording: false }));
  };

  const playResponse = () => {
    if (audioState.responseAudio) {
      playAudio(audioState.responseAudio);
    }
  };

  const stopPlaying = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }
  };

  const clearError = () => setAudioState((s) => ({ ...s, error: null }));

  const reset = () => {
    stopRecording();
    stopPlaying();
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
    return await res.blob(); // backend reply audio
  } catch (e) {
    console.error(e);
    return null;
  }
}
