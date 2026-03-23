import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme as darkTheme } from './theme';

const STORAGE_KEY = '@tennishq_theme_mode';

export type ThemeMode = 'dark' | 'light';

export const lightTheme = {
  ...darkTheme,
  bg: '#f5f5f5',
  card: '#ffffff',
  cardAlt: '#f0f0f0',
  cardHover: '#e8e8e8',
  cardElevated: '#ffffff',
  border: '#e0e0e0',
  skeleton: '#e0e0e0',

  glass: 'rgba(0,0,0,0.03)',
  glassBorder: 'rgba(0,0,0,0.08)',
  glassBorderTop: 'rgba(0,0,0,0.1)',
  tabBarBg: 'rgba(245,245,245,0.92)',
  tabBarBorder: 'rgba(0,0,0,0.06)',

  text: '#1a1a1a',
  textSecondary: '#666666',
  textTertiary: '#888888',
  textMuted: '#999999',

  winnerText: '#1a1a1a',
  loserText: '#bbbbbb',
  winnerDot: '#16a34a',

  glassCardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  } as const,
};

interface ThemeContextType {
  mode: ThemeMode;
  colors: typeof darkTheme;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  colors: darkTheme,
  toggleTheme: () => {},
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setModeState(saved);
      }
    });
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode);
  };

  const toggleTheme = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  const colors = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
