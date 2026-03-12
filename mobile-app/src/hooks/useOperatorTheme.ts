/**
 * useOperatorTheme Hook
 *
 * React hook for runtime theme resolution in mobile app.
 * Resolution order:
 * 1. Query parameter: ?operatorId=xxx
 * 2. AsyncStorage: operatorId
 * 3. Environment variable: OPERATOR_ID
 * 4. Fallback: 'default'
 */

import { useState, useEffect, useCallback } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OPERATOR_STORAGE_KEY = '@operatorId';
const BRANDING_STORAGE_KEY = '@brandingCache';
const DEFAULT_OPERATOR = 'default';

// Default branding config (inline fallback)
const DEFAULT_BRANDING = {
  operatorId: 'default',
  name: 'MyTelco',
  logo: {
    light: '',
    dark: '',
  },
  colors: {
    primary: {
      50: '#e6f2ff',
      100: '#b3d9ff',
      200: '#80bfff',
      300: '#4da6ff',
      400: '#1a8cff',
      500: '#0073e6',
      600: '#005ab3',
      700: '#004080',
      800: '#00264d',
      900: '#000d1a',
    },
    secondary: {
      50: '#f0f9ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    accent: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    neutral: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
    },
  },
  typography: {
    fontFamily: {
      sans: 'System',
      mono: 'monospace',
    },
  },
  semanticTokens: {
    text: {
      primary: '#18181b',
      secondary: '#52525b',
      disabled: '#a1a1aa',
      inverse: '#fafafa',
    },
    background: {
      primary: '#ffffff',
      secondary: '#f4f4f5',
      tertiary: '#e4e4e7',
    },
    border: {
      default: '#e4e4e7',
      focus: '#0073e6',
    },
  },
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
};

export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface BrandingConfig {
  operatorId: string;
  name: string;
  logo: {
    light: string;
    dark: string;
  };
  colors: {
    primary: ColorPalette;
    secondary: ColorPalette;
    accent: ColorPalette;
    neutral: ColorPalette;
  };
  typography: {
    fontFamily: {
      sans: string;
      mono: string;
    };
  };
  semanticTokens?: {
    text: {
      primary: string;
      secondary: string;
      disabled: string;
      inverse: string;
    };
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    border: {
      default: string;
      focus: string;
    };
  };
  version: string;
  lastUpdated: string;
}

export interface UseOperatorThemeResult {
  operatorId: string;
  branding: BrandingConfig;
  isLoading: boolean;
  error: Error | null;
  colors: ColorPalette | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  setOperatorId: (id: string) => Promise<void>;
  refreshBranding: () => Promise<void>;
}

/**
 * Get the effective operator ID from resolution chain
 */
async function getOperatorId(): Promise<string> {
  try {
    // Check AsyncStorage first
    const stored = await AsyncStorage.getItem(OPERATOR_STORAGE_KEY);
    if (stored) {
      return stored;
    }
  } catch {
    // Ignore storage errors
  }

  // Check environment variable
  const envOperatorId = process.env.OPERATOR_ID;
  if (envOperatorId) {
    return envOperatorId;
  }

  return DEFAULT_OPERATOR;
}

/**
 * Fetch branding from API
 */
async function fetchBranding(operatorId: string): Promise<BrandingConfig> {
  // Try to get from cache first
  try {
    const cached = await AsyncStorage.getItem(`${BRANDING_STORAGE_KEY}_${operatorId}`);
    if (cached) {
      const parsed = JSON.parse(cached) as BrandingConfig;
      // Check cache age (24 hours)
      const cacheAge = Date.now() - (parsed.cachedAt || 0);
      if (cacheAge < 24 * 60 * 60 * 1000) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }

  try {
    // Fetch from API - use environment variable for API base URL
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:8080';
    const response = await fetch(`${baseUrl}/api/v1/theme/${operatorId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch branding: ${response.status}`);
    }

    const branding = (await response.json()) as BrandingConfig;

    // Cache the result
    branding.cachedAt = Date.now();
    await AsyncStorage.setItem(`${BRANDING_STORAGE_KEY}_${operatorId}`, JSON.stringify(branding));

    return branding;
  } catch (error) {
    console.error(`Failed to fetch branding for ${operatorId}:`, error);

    // Fallback to default if not already trying default
    if (operatorId !== DEFAULT_OPERATOR) {
      return fetchBranding(DEFAULT_OPERATOR);
    }

    // Return default branding as last resort
    return DEFAULT_BRANDING as BrandingConfig;
  }
}

/**
 * Get color palette based on system appearance
 */
function getColorPaletteForAppearance(
  branding: BrandingConfig,
  appearance: 'light' | 'dark'
): ColorPalette | null {
  // For now, we return the primary palette
  // In a full implementation, you might have separate light/dark palettes
  return branding.colors?.primary || null;
}

/**
 * Custom hook for operator theme management
 */
export function useOperatorTheme(): UseOperatorThemeResult {
  const [operatorId, setOperatorIdState] = useState<string>(DEFAULT_OPERATOR);
  const [branding, setBranding] = useState<BrandingConfig>(DEFAULT_BRANDING as BrandingConfig);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Get system appearance
  const colorScheme = Appearance.getColorScheme();
  const isDark = colorScheme === 'dark';

  // Load operator ID and branding on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        const id = await getOperatorId();
        setOperatorIdState(id);

        const brandingConfig = await fetchBranding(id);
        setBranding(brandingConfig);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load branding'));
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Listen for appearance changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(() => {
      // Force re-render on appearance change
      setBranding((prev) => ({ ...prev }));
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Computed values
  const colors = branding?.colors?.primary || null;
  const primaryColor = branding?.colors?.primary?.[500] || '#0073e6';
  const secondaryColor = branding?.colors?.secondary?.[500] || '#3b82f6';
  const accentColor = branding?.colors?.accent?.[500] || '#22c55e';

  // Set operator ID and reload branding
  const setOperatorId = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Persist the selection
      await AsyncStorage.setItem(OPERATOR_STORAGE_KEY, id);
      setOperatorIdState(id);

      // Fetch new branding
      const brandingConfig = await fetchBranding(id);
      setBranding(brandingConfig);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to set operator ID'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh branding
  const refreshBranding = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const brandingConfig = await fetchBranding(operatorId);
      setBranding(brandingConfig);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh branding'));
    } finally {
      setIsLoading(false);
    }
  }, [operatorId]);

  return {
    operatorId,
    branding,
    isLoading,
    error,
    colors,
    primaryColor,
    secondaryColor,
    accentColor,
    setOperatorId,
    refreshBranding,
  };
}

export default useOperatorTheme;
