import { useState, useRef } from 'react';

export default function useVoiceAgent() {
  const [audioState, setAudioState] = useState({
    isRecording: false,         // matches your UI
    isProcessing: false,
    error: null,
  });

  const streamRef = useRef(null);
  const currentAudioRef = useRef(null);
  const stopRequestedRef = useRef(false);

  // Start the automatic conversation loop
  const startRecording = async () => {
    try {
      console.log('🎙 Starting conversation loop...');
      stopRequestedRef.current = false;
      setAudioState({ isRecording: true, isProcessing: false, error: null });

      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      await recordAndSendChunk();
    } catch (err) {
      console.error(err);
      setAudioState((s) => ({ ...s, error: 'Could not access microphone' }));
    }
  };

  // Stop the conversation loop
  const stopRecording = () => {
    console.log('🛑 Stopping conversation...');
    stopRequestedRef.current = true;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setAudioState({ isRecording: false, isProcessing: false, error: null });
  };

  // Record, send to backend, play response, then repeat
  const recordAndSendChunk = async () => {
    if (stopRequestedRef.current) {
      console.log('🛑 Loop stopped by user.');
      return;
    }

    console.log('🎤 Recording chunk...');
    const mediaRecorder = new MediaRecorder(streamRef.current);
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = async () => {
      if (stopRequestedRef.current) return;

      const audioBlob = new Blob(chunks, { type: 'audio/webm' });
      setAudioState((s) => ({ ...s, isProcessing: true }));

      console.log('📤 Sending chunk to backend...');
      const ttsBlob = await sendAudioChunk(audioBlob);

      setAudioState((s) => ({ ...s, isProcessing: false }));

      if (ttsBlob) {
        playAudioAndContinue(ttsBlob);
      } else {
        console.error('❌ No TTS audio received. Trying next...');
        recordAndSendChunk();  // keep going even if error
      }
    };

    mediaRecorder.start();
    setTimeout(() => {
      mediaRecorder.stop();
    }, 2000); // record 2s chunk
  };

  // Play TTS audio, then continue loop
  const playAudioAndContinue = (ttsBlob) => {
    const audioUrl = URL.createObjectURL(ttsBlob);
    const audio = new Audio(audioUrl);
    currentAudioRef.current = audio;

    audio.play();
    audio.onended = () => {
      console.log('✅ Finished playing, starting next recording...');
      if (!stopRequestedRef.current) {
        recordAndSendChunk();
      }
    };
  };

  const clearError = () => setAudioState((s) => ({ ...s, error: null }));

  return {
    audioState,
    startRecording,
    stopRecording,
    clearError,
  };
}

// Send audio to backend and get TTS audio blob
async function sendAudioChunk(audioBlob) {
  const formData = new FormData();
  formData.append('file', audioBlob, 'chunk.webm');
  try {
    const res = await fetch('http://127.0.0.1:8000/transcribe-and-respond', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      console.error('Backend error:', await res.text());
      return null;
    }
    return await res.blob(); // get audio back
  } catch (e) {
    console.error(e);
    return null;
  }
}
