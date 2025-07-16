import { useState, useRef } from 'react';

export default function useVoiceAgent() {
  const [audioState, setAudioState] = useState({
    isListening: false,      // renamed for clarity
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
      setAudioState({ isListening: true, isProcessing: false, error: null });

      // Get microphone stream only once
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('🎤 Microphone ready');
      }

      loop(); // 🔄 start loop: record → send → play → repeat
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

    setAudioState({ isListening: false, isProcessing: false, error: null });
  };

  const loop = async () => {
    if (stopRequestedRef.current) {
      console.log('✅ Loop stopped by user.');
      return;
    }

    console.log('🎤 Recording 2 seconds...');
    const mediaRecorder = new MediaRecorder(streamRef.current);
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      if (stopRequestedRef.current) return;

      const audioBlob = new Blob(chunks, { type: 'audio/webm' });
      console.log('📤 Sending to backend...');
      setAudioState((s) => ({ ...s, isProcessing: true }));

      const ttsBlob = await sendAudioChunk(audioBlob);

      setAudioState((s) => ({ ...s, isProcessing: false }));

      if (ttsBlob) {
        console.log('🎧 Playing response...');
        playAudio(ttsBlob);
      } else {
        console.error('❌ TTS failed, retrying...');
        loop(); // retry recording
      }
    };

    mediaRecorder.start();
    setTimeout(() => {
      mediaRecorder.stop();
    }, 2000);
  };

  const playAudio = (ttsBlob) => {
    const audioUrl = URL.createObjectURL(ttsBlob);
    const audio = new Audio(audioUrl);
    currentAudioRef.current = audio;

    audio.play();
    console.log('▶️ Playing...');

    audio.onended = () => {
      console.log('🔄 Finished playing, start recording again');
      loop(); // always restart after playback
    };

    audio.onerror = (e) => {
      console.error('❌ Playback error:', e);
      loop(); // keep going
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

// send to backend → get TTS
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

    return await res.blob();
  } catch (e) {
    console.error('Network/server error:', e);
    return null;
  }
}
