import { useState, useRef, useCallback } from 'react';
import { AudioState } from '../types';

export const useAudioRecorder = () => {
  const [audioState, setAudioState] = useState<AudioState>({
    isRecording: false,
    isProcessing: false,
    isPlaying: false,
    audioBlob: null,
    responseAudio: null,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const sendAudio = useCallback(async (audioBlob: Blob) => {
    if (!audioBlob) return;

    setAudioState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.wav');

      const response = await fetch(
        'https://d780937a-fd43-4ac4-94de-799bdb823306-00-3542e9irhula5.sisko.replit.dev/transcribe-and-respond',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Failed to process audio');

      const arrayBuffer = await response.arrayBuffer();
      const responseAudioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(responseAudioBlob);

      setAudioState(prev => ({
        ...prev,
        responseAudio: audioUrl,
        isProcessing: false,
      }));

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setAudioState(p => ({ ...p, isPlaying: true }));

      // ✅ CHANGE: automatically start recording again after playback
      audio.onended = () => {
        setAudioState(p => ({ ...p, isPlaying: false }));
        startRecording();
      };

      try {
        await audio.play();
        console.log('🔊 Playback started successfully');
      } catch (err) {
        console.warn('⚠️ Autoplay blocked or playback failed:', err);
        setAudioState(p => ({
          ...p,
          error: 'Autoplay blocked. Tap play to hear the response.',
          isPlaying: false,
        }));
      }
    } catch (err) {
      console.error('❌ sendAudio error:', err);
      setAudioState(prev => ({
        ...prev,
        error: 'Transcription or TTS failed. Please try again.',
        isProcessing: false,
      }));
    }
  }, [startRecording]); // ✅ CHANGE: add startRecording as dependency

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
  }, []);

  const monitorSilence = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    sourceRef.current = source;

    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const checkSilence = () => {
      analyser.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const deviation = dataArray[i] - 128;
        sum += deviation * deviation;
      }
      const rms = Math.sqrt(sum / bufferLength);
      const silenceThreshold = 8;

      if (rms < silenceThreshold) {
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = window.setTimeout(stopRecording, 3000);
        }
      } else if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      if (audioState.isRecording) requestAnimationFrame(checkSilence);
    };

    checkSilence();
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioState(p => ({ ...p, audioBlob, isRecording: false }));
        sendAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setAudioState(p => ({
        ...p,
        isRecording: true,
        error: null,
        responseAudio: null,
        audioBlob: null,
      }));

      monitorSilence(stream);
    } catch {
      setAudioState(p => ({
        ...p,
        error: 'Failed to access microphone. Please check permissions.',
      }));
    }
  }, [sendAudio]);

  const playResponse = useCallback((audioUrl?: string) => {
    const urlToPlay = audioUrl || audioState.responseAudio;
    if (!urlToPlay) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(urlToPlay);
    audioRef.current = audio;

    audio.onplay = () => setAudioState(p => ({ ...p, isPlaying: true }));
    audio.onended = () => setAudioState(p => ({ ...p, isPlaying: false }));

    audio.play().catch(err => {
      console.error('🔊 Manual playback failed:', err);
      setAudioState(p => ({
        ...p,
        isPlaying: false,
        error: 'Could not play audio. Please try again.',
      }));
    });
  }, [audioState.responseAudio]);

  const stopPlaying = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioState(p => ({ ...p, isPlaying: false }));
    }
  }, []);

  const clearError = useCallback(() => {
    setAudioState(p => ({ ...p, error: null }));
  }, []);

  const reset = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioState.responseAudio) {
      URL.revokeObjectURL(audioState.responseAudio);
    }
    setAudioState({
      isRecording: false,
      isProcessing: false,
      isPlaying: false,
      audioBlob: null,
      responseAudio: null,
      error: null,
    });
  }, [audioState.responseAudio]);

  return {
    audioState,
    startRecording,
    stopRecording,
    sendAudio,
    playResponse,
    stopPlaying,
    clearError,
    reset,
  };
};
