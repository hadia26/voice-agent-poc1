import React from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface AudioPlayerProps {
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  isPlaying,
  onPlay,
  onStop,
  disabled = false,
}) => {
  const { theme } = useTheme();

  return (
    <div className="flex items-center gap-4 p-6 rounded-xl backdrop-blur-sm border border-white/20"
         style={{ backgroundColor: theme.surface }}>
      <div className="flex items-center gap-2" style={{ color: theme.textSecondary }}>
        <Volume2 size={20} />
        <span className="text-sm font-medium">AI Response</span>
      </div>
      
      <button
        onClick={isPlaying ? onStop : onPlay}
        disabled={disabled}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center
          transition-all duration-200 transform hover:scale-105
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        `}
        style={{
          backgroundColor: theme.secondary,
          boxShadow: `0 4px 16px ${theme.secondary}40`,
        }}
      >
        {isPlaying ? (
          <Pause size={20} color="white" fill="white" />
        ) : (
          <Play size={20} color="white" fill="white" />
        )}
      </button>
      
      {isPlaying && (
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-current to-transparent rounded-full animate-pulse"
              style={{ 
                height: `${12 + Math.random() * 16}px`,
                color: theme.secondary,
                animationDelay: `${i * 0.1}s` 
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};