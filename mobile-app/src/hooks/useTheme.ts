import { useState, useEffect, useCallback } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

export type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('app_theme');
    return (saved as Theme) || 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  // Sync theme with document and appearance
  useEffect(() => {
    const updateResolvedTheme = () => {
      if (theme === 'system') {
        setResolvedTheme(Appearance.getColorScheme());
      } else {
        setResolvedTheme(theme);
      }
    };

    updateResolvedTheme();

    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (theme === 'system') {
        setResolvedTheme(colorScheme);
      }
    });

    return () => subscription.remove();
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    if (resolvedTheme) {
      document.documentElement.setAttribute('data-theme', resolvedTheme);
    }
  }, [resolvedTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('app_theme', newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [resolvedTheme, setTheme]);

  return {
    theme,
    resolvedTheme: resolvedTheme || 'light',
    isDark: resolvedTheme === 'dark',
    setTheme,
    toggleTheme,
  };
}
