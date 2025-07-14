export interface AudioState {
  isRecording: boolean;
  isProcessing: boolean;
  isPlaying: boolean;
  audioBlob: Blob | null;
  responseAudio: string | null;
  error: string | null;
  transcription?: string;
}

export interface Theme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
}