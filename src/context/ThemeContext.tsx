import React, { createContext, useContext, useEffect, useState } from 'react';
import { updateManifestLink, updateFavicon, updateAppleTouchIcon } from '@/utils/manifestUtils';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Function to update theme-color meta tag dynamically
const updateThemeColorMeta = (isDark: boolean) => {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    // Use colors that match the actual CSS background values
    const color = isDark ? '#000000' : '#f9fafb'; // Dark: pure black, Light: same as before
    metaThemeColor.setAttribute('content', color);
  }
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Get theme from localStorage or default to 'system'
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'system';
  });

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem('theme', theme);

    // Determine if dark mode should be active
    let shouldBeDark = false;
    if (theme === 'dark') {
      shouldBeDark = true;
    } else if (theme === 'light') {
      shouldBeDark = false;
    } else {
      // system theme - check user's device preference
      shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    setIsDark(shouldBeDark);

    // Apply theme to document
    const root = document.documentElement;
    if (shouldBeDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Force style recalculation to prevent cached styles
    root.style.setProperty('--theme-timestamp', Date.now().toString());

    // Update theme-color meta tag dynamically
    updateThemeColorMeta(shouldBeDark);
    // Update manifest dynamically for PWA
    updateManifestLink(shouldBeDark);
    // Update favicon dynamically
    updateFavicon(shouldBeDark);
    // Update apple-touch-icon dynamically for iOS PWA
    updateAppleTouchIcon(shouldBeDark);
  }, [theme]);

  // Listen for system theme changes when using 'system' theme
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setIsDark(mediaQuery.matches);
      const root = document.documentElement;
      if (mediaQuery.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      // Force style recalculation to prevent cached styles
      root.style.setProperty('--theme-timestamp', Date.now().toString());
      
      // Update theme-color meta tag when system theme changes
      updateThemeColorMeta(mediaQuery.matches);
      // Update manifest dynamically when system theme changes
      updateManifestLink(mediaQuery.matches);
      // Update favicon dynamically when system theme changes
      updateFavicon(mediaQuery.matches);
      // Update apple-touch-icon dynamically for iOS PWA
      updateAppleTouchIcon(mediaQuery.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const value = {
    theme,
    setTheme,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
