import React from 'react';
import { AlertCircle, CheckCircle, Loader2, Info } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface StatusMessageProps {
  type: 'error' | 'success' | 'loading' | 'info';
  message: string;
  onDismiss?: () => void;
}

export const StatusMessage: React.FC<StatusMessageProps> = ({
  type,
  message,
  onDismiss,
}) => {
  const { theme } = useTheme();

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle size={20} className="text-red-500" />;
      case 'success':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'loading':
        return <Loader2 size={20} className="animate-spin" style={{ color: theme.primary }} />;
      case 'info':
        return <Info size={20} style={{ color: theme.accent }} />;
      default:
        return null;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'error':
        return 'rgba(239, 68, 68, 0.1)';
      case 'success':
        return 'rgba(16, 185, 129, 0.1)';
      case 'loading':
        return `${theme.primary}20`;
      case 'info':
        return `${theme.accent}20`;
      default:
        return `${theme.surface}`;
    }
  };

  return (
    <div
      className="flex items-center gap-3 p-4 rounded-lg backdrop-blur-sm border border-white/20 transition-all duration-300"
      style={{ 
        backgroundColor: getBgColor(),
        color: theme.text 
      }}
    >
      {getIcon()}
      <p className="flex-1 text-sm">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-current opacity-70 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      )}
    </div>
  );
};