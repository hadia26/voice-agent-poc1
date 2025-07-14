import React from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface RecordingButtonProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  disabled?: boolean;
}

export const RecordingButton: React.FC<RecordingButtonProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  disabled = false,
}) => {
  const { theme } = useTheme();

  return (
    <div className="relative flex items-center justify-center">
      {isRecording && (
        <div className="absolute inset-0 rounded-full animate-ping" 
             style={{ backgroundColor: `${theme.accent}40` }} />
      )}
      
      <button
        onClick={isRecording ? onStopRecording : onStartRecording}
        disabled={disabled}
        className={`
          relative w-20 h-20 rounded-full flex items-center justify-center
          transition-all duration-300 transform hover:scale-110
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          ${isRecording ? 'animate-pulse' : ''}
        `}
        style={{
          backgroundColor: isRecording ? theme.accent : theme.primary,
          boxShadow: `0 8px 32px ${isRecording ? theme.accent : theme.primary}40`,
        }}
      >
        {isRecording ? (
          <Square size={32} color="white" fill="white" />
        ) : (
          <Mic size={32} color="white" />
        )}
      </button>
      
      {isRecording && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ 
                  backgroundColor: theme.accent,
                  animationDelay: `${i * 0.2}s` 
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};