import React from 'react';
import { useTheme } from '../hooks/useTheme';

interface WaveformAnimationProps {
  isActive: boolean;
}

export const WaveformAnimation: React.FC<WaveformAnimationProps> = ({ isActive }) => {
  const { theme } = useTheme();

  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className={`w-1 bg-gradient-to-t from-current to-transparent rounded-full transition-all duration-300 ${
            isActive ? 'animate-pulse' : ''
          }`}
          style={{
            height: isActive ? `${8 + Math.sin(i * 0.5) * 24}px` : '4px',
            color: theme.primary,
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
};