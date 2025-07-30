import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUserPreferences } from '../services/authService';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // Initialize from localStorage on app start
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  // Apply theme to DOM
  const applyTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Apply theme on component mount and when isDark changes
  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  // Listen to theme reset events (e.g., from logout)
  useEffect(() => {
    const handleThemeReset = () => {
      const savedTheme = localStorage.getItem('theme');
      const shouldBeDark = savedTheme === 'dark';
      setIsDark(shouldBeDark);
    };

    // Listen to custom theme reset event
    window.addEventListener('themeReset', handleThemeReset);
    
    // Listen to storage changes from other tabs/windows
    window.addEventListener('storage', handleThemeReset);

    return () => {
      window.removeEventListener('themeReset', handleThemeReset);
      window.removeEventListener('storage', handleThemeReset);
    };
  }, []);

  const setTheme = (theme: 'light' | 'dark') => {
    const dark = theme === 'dark';
    setIsDark(dark);
    applyTheme(dark);
    localStorage.setItem('theme', theme);
  };

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};