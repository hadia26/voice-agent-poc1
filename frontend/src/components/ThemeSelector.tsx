import React, { useState, useRef, useEffect } from 'react';
import { Palette, ChevronDown } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export const ThemeSelector: React.FC = () => {
  const { theme, currentTheme, switchTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeSelect = (themeName: string) => {
    switchTheme(themeName);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-200"
        style={{ 
          backgroundColor: theme.surface,
          color: theme.text 
        }}
      >
        <Palette size={20} />
        <span className="hidden sm:inline">{theme.name}</span>
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      
      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-2 w-48 py-2 rounded-lg backdrop-blur-sm border border-white/20 shadow-xl z-50"
          style={{ backgroundColor: theme.surface }}
        >
          {availableThemes.map(themeName => (
            <button
              key={themeName}
              onClick={() => handleThemeSelect(themeName)}
              className={`w-full px-4 py-2 text-left hover:bg-white/10 transition-colors duration-150 ${
                currentTheme === themeName ? 'bg-white/20' : ''
              }`}
              style={{ color: theme.text }}
            >
              <div className="flex items-center justify-between">
                <span>{themeName.charAt(0).toUpperCase() + themeName.slice(1)}</span>
                {currentTheme === themeName && (
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: theme.primary }}
                  />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};