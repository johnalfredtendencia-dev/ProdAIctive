import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';

export const LIGHT_THEME = {
  primary: '#FF5A5F',
  primaryGradient: ['#FF5A5F', '#FF8085'] as const,
  secondary: '#FF8FAB',
  background: '#FAFAFA',
  text: '#2D3436',
  grayText: '#A0A0A0',
  lightGray: '#F5F5F5',
  cardBg: '#FFFFFF',
  accentBlue: '#E3F2FD',
  accentBlueText: '#2196F3',
  accentPink: '#FCE4EC',
  accentPinkText: '#E91E63',
  navBarBg: '#FFFFFF',
  border: '#F0F0F0',
  white: '#FFFFFF',
};

export const DARK_THEME = {
  primary: '#FF6B8B',
  primaryGradient: ['#FF6B8B', '#FF9AAF'] as const,
  secondary: '#FF8FAB',
  background: '#1A1A1A',
  text: '#FFFFFF',
  grayText: '#B0B0B0',
  lightGray: '#2A2A2A',
  cardBg: '#252525',
  accentBlue: '#1A3A52',
  accentBlueText: '#64B5F6',
  accentPink: '#3A2A35',
  accentPinkText: '#FF6B8B',
  navBarBg: '#1F1F1F',
  border: '#333333',
  white: '#FFFFFF',
};

interface ThemeContextType {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  theme: typeof LIGHT_THEME | typeof DARK_THEME;
  colors: typeof LIGHT_THEME | typeof DARK_THEME;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkModeState] = useState(true); // Changed to true for dark mode default
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme preference from storage on app start
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const saved = await SecureStore.getItemAsync('themeMode');
        if (saved !== null) {
          setIsDarkModeState(saved === 'dark');
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
      setIsLoaded(true);
    };

    loadThemePreference();
  }, []);

  // Save theme preference when it changes
  const setIsDarkMode = async (value: boolean) => {
    setIsDarkModeState(value);
    try {
      await SecureStore.setItemAsync('themeMode', value ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        setIsDarkMode,
        theme,
        colors: theme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
