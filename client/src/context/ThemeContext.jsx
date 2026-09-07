import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('dudi_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return 'dark';
    } catch (_) {
      return 'dark';
    }
  });

  const isDarkMode = theme === 'dark';

  useEffect(() => {
    try {
      localStorage.setItem('dudi_theme', theme);
    } catch (_) {}

    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'dark',
      isDarkMode: true,
      toggleTheme: () => {},
      setTheme: () => {}
    };
  }
  return context;
}
