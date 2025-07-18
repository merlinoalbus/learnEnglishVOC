import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUserPreferences } from '../services/authService';
import { useAuth } from '../hooks/integration/useAuth';

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
  const [isDark, setIsDark] = useState(false);
  const { user } = useAuth();

  // Apply theme to DOM
  const applyTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Load theme from user preferences
  useEffect(() => {
    const loadTheme = async () => {
      if (!user?.id) {
        // Default theme for non-authenticated users
        const savedTheme = localStorage.getItem('theme');
        const dark = savedTheme === 'dark';
        setIsDark(dark);
        applyTheme(dark);
        return;
      }

      try {
        const preferences = await getUserPreferences(user.id);
        const dark = preferences?.theme === 'dark' || false;
        setIsDark(dark);
        applyTheme(dark);
      } catch (error) {
        // Fallback to localStorage or default
        const savedTheme = localStorage.getItem('theme');
        const dark = savedTheme === 'dark';
        setIsDark(dark);
        applyTheme(dark);
      }
    };

    loadTheme();
  }, [user?.id]);

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