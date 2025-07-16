import { useState, useRef } from 'react';

export default function useVoiceAgent() {
  const [audioState, setAudioState] = useState({
    isRecording: false,
    isProcessing: false,
    error: null,
  });

  const streamRef = useRef(null);
  const stopRequestedRef = useRef(false);
  const currentAudioRef = useRef(null);

  const startRecording = async () => {
    try {
      console.log('🎙 Starting conversation loop...');
      stopRequestedRef.current = false;
      setAudioState({ isRecording: true, isProcessing: false, error: null });

      // get microphone stream only once
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('🎤 Microphone stream ready');
      }

      await recordAndSendChunk();
    } catch (err) {
      console.error(err);
      setAudioState((s) => ({ ...s, error: 'Could not access microphone' }));
    }
  };

  const stopRecording = () => {
    console.log('🛑 Stopping conversation loop...');
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

  const recordAndSendChunk = async () => {
    if (stopRequestedRef.current) {
      console.log('⏹️ Loop stopped by user.');
      return;
    }

    console.log('🔄 Starting new chunk recording...');
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
      console.log('📤 Sending chunk to backend...');
      setAudioState((s) => ({ ...s, isProcessing: true }));

      const ttsBlob = await sendAudioChunk(audioBlob);

      setAudioState((s) => ({ ...s, isProcessing: false }));

      if (ttsBlob) {
        console.log('✅ Got TTS response, playing...');
        playAudioAndContinue(ttsBlob);
      } else {
        console.error('❌ No TTS audio received. Retrying next chunk...');
        if (!stopRequestedRef.current) {
          recordAndSendChunk(); // retry
        }
      }
    };

    mediaRecorder.start();
    console.log('⏱️ Recording for 2 seconds...');
    setTimeout(() => {
      mediaRecorder.stop();
    }, 2000);
  };

  const playAudioAndContinue = (ttsBlob) => {
    const audioUrl = URL.createObjectURL(ttsBlob);
    const audio = new Audio(audioUrl);
    currentAudioRef.current = audio;

    audio.play();
    console.log('🎧 Playing TTS audio...');

    audio.onended = () => {
      console.log('▶️ Playback ended. Starting next recording...');
      if (!stopRequestedRef.current) {
        recordAndSendChunk();
      }
    };

    audio.onerror = (e) => {
      console.error('❌ Audio playback error:', e);
      if (!stopRequestedRef.current) {
        recordAndSendChunk(); // keep going
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

// Send audio chunk to backend → get TTS audio blob
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

    return await res.blob(); // TTS audio to play
  } catch (err) {
    console.error('Network or server error:', err);
    return null;
  }
}
