import { useState, useEffect } from 'react';
import { Theme } from '../types';

const themes: Record<string, Theme> = {
  light: {
      name: 'Light',
  primary: '#4F46E5', // Indigo-700
  secondary: '#2563EB', // Blue-600
  accent: '#059669', // Emerald-600
  background: 'linear-gradient(135deg, #a5b4fc 0%, #cbd5e1 100%)',
 // Indigo-100 → Slate-50
  surface: 'rgba(255, 255, 255, 0.9)', // semi-transparent for layering
  text: '#0F172A', // Slate-900 (deep navy)
  textSecondary: '#475569', // Slate-600    // Clear secondary text (mid-gray)
  },
  dark: {
    name: 'Dark',
    primary: '#a78bfa',
    secondary: '#60a5fa',
    accent: '#34d399',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    surface: 'rgba(30, 41, 59, 0.95)',
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
  },
  blue: {
    name: 'Blue',
    primary: '#3b82f6',
    secondary: '#06b6d4',
    accent: '#8b5cf6',
    background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
    surface: 'rgba(30, 64, 175, 0.9)',
    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
  },
  green: {
    name: 'Green',
    primary: '#10b981',
    secondary: '#059669',
    accent: '#3b82f6',
    background: 'linear-gradient(135deg, #065f46 0%, #064e3b 100%)',
    surface: 'rgba(6, 95, 70, 0.9)',
    text: '#f0fdf4',
    textSecondary: '#bbf7d0',
  },
};

export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<string>('light');

  const availableThemes = Object.keys(themes);

  const applyTheme = (themeName: string) => {
    const theme = themes[themeName];
    if (!theme) return;

    const root = document.documentElement;

    // Set CSS variables
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--secondary', theme.secondary);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--background', theme.background);
    root.style.setProperty('--surface', theme.surface);
    root.style.setProperty('--text', theme.text);
    root.style.setProperty('--text-secondary', theme.textSecondary);

    // Tailwind dark mode toggle
    if (themeName === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('voice-ai-theme') || 'light';
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const switchTheme = (themeName: string) => {
    if (!themes[themeName]) return;
    setCurrentTheme(themeName);
    localStorage.setItem('voice-ai-theme', themeName);
    applyTheme(themeName);
  };

  const cycleTheme = () => {
    const currentIndex = availableThemes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % availableThemes.length;
    const nextTheme = availableThemes[nextIndex];
    switchTheme(nextTheme);
  };

  return {
    theme: themes[currentTheme],
    currentTheme,
    switchTheme,
    cycleTheme, // ⬅️ New helper for one-click theme cycling
    availableThemes,
  };
};
