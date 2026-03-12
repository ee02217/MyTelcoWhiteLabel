/**
 * Theme Loader Service
 *
 * Loads and applies operator branding configuration at runtime.
 * Resolution order:
 * 1. Query parameter: ?operatorId=xxx
 * 2. Custom header: X-Operator-ID
 * 3. Environment variable: VITE_OPERATOR_ID
 * 4. LocalStorage: operatorId
 * 5. Fallback: 'default'
 */

import type { BrandingConfig } from './types';

const OPERATOR_STORAGE_KEY = 'operatorId';
const BRANDING_CACHE_KEY = 'brandingCache';
const DEFAULT_OPERATOR = 'default';

// Cache for branding configs
const brandingCache = new Map<string, BrandingConfig>();

/**
 * Get the current operator ID from resolution chain
 */
export function getOperatorId(): string {
  // 1. Check URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const queryOperatorId = urlParams.get('operatorId');
  if (queryOperatorId) {
    return queryOperatorId;
  }

  // 2. Check custom header (if available from server-side rendering)
  // This would be set by the server based on domain/host header
  const metaOperatorId = document
    .querySelector('meta[name="operator-id"]')
    ?.getAttribute('content');
  if (metaOperatorId) {
    return metaOperatorId;
  }

  // 3. Check environment variable
  const envOperatorId = import.meta.env.VITE_OPERATOR_ID;
  if (envOperatorId) {
    return envOperatorId;
  }

  // 4. Check localStorage
  const storedOperatorId = localStorage.getItem(OPERATOR_STORAGE_KEY);
  if (storedOperatorId) {
    return storedOperatorId;
  }

  // 5. Fallback to default
  return DEFAULT_OPERATOR;
}

/**
 * Set the operator ID (persists to localStorage)
 */
export function setOperatorId(operatorId: string): void {
  localStorage.setItem(OPERATOR_STORAGE_KEY, operatorId);
  // Trigger a re-render by dispatching an event
  window.dispatchEvent(new CustomEvent('operator-id-changed', { detail: { operatorId } }));
}

/**
 * Fetch branding configuration for an operator
 */
export async function fetchBranding(operatorId: string): Promise<BrandingConfig> {
  // Check memory cache first
  if (brandingCache.has(operatorId)) {
    return brandingCache.get(operatorId)!;
  }

  // Check localStorage cache
  try {
    const cached = localStorage.getItem(`${BRANDING_CACHE_KEY}_${operatorId}`);
    if (cached) {
      const parsed = JSON.parse(cached) as BrandingConfig;
      // Check if cache is still valid (24 hour expiry)
      const cacheAge = Date.now() - (parsed.cachedAt || 0);
      if (cacheAge < 24 * 60 * 60 * 1000) {
        brandingCache.set(operatorId, parsed);
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }

  // Fetch from API
  try {
    const response = await fetch(`/api/v1/theme/${operatorId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch branding: ${response.status}`);
    }
    const branding = (await response.json()) as BrandingConfig;

    // Cache the result
    branding.cachedAt = Date.now();
    brandingCache.set(operatorId, branding);
    localStorage.setItem(`${BRANDING_CACHE_KEY}_${operatorId}`, JSON.stringify(branding));

    return branding;
  } catch (error) {
    console.error(`Failed to fetch branding for ${operatorId}:`, error);

    // Fallback to default if not already trying default
    if (operatorId !== DEFAULT_OPERATOR) {
      return fetchBranding(DEFAULT_OPERATOR);
    }

    throw error;
  }
}

/**
 * Apply branding CSS variables to the document root
 */
export function applyBrandingVariables(branding: BrandingConfig): void {
  const root = document.documentElement;

  // Apply color tokens
  if (branding.colors) {
    for (const [colorName, palette] of Object.entries(branding.colors)) {
      for (const [shade, color] of Object.entries(palette)) {
        root.style.setProperty(`--color-${colorName}-${shade}`, color as string);
      }
    }
  }

  // Apply typography
  if (branding.typography?.fontFamily) {
    root.style.setProperty('--font-sans', branding.typography.fontFamily.sans);
    root.style.setProperty('--font-mono', branding.typography.fontFamily.mono);
  }

  // Apply semantic tokens
  if (branding.semanticTokens) {
    if (branding.semanticTokens.text) {
      for (const [key, value] of Object.entries(branding.semanticTokens.text)) {
        root.style.setProperty(`--text-${key}`, value);
      }
    }
    if (branding.semanticTokens.background) {
      for (const [key, value] of Object.entries(branding.semanticTokens.background)) {
        root.style.setProperty(`--background-${key}`, value);
      }
    }
    if (branding.semanticTokens.border) {
      for (const [key, value] of Object.entries(branding.semanticTokens.border)) {
        root.style.setProperty(`--border-${key}`, value);
      }
    }
  }

  // Apply custom CSS variables
  if (branding.cssVariables) {
    for (const [key, value] of Object.entries(branding.cssVariables)) {
      root.style.setProperty(key, value);
    }
  }
}

/**
 * Load and apply branding for the current operator
 */
export async function loadAndApplyBranding(): Promise<BrandingConfig> {
  const operatorId = getOperatorId();
  const branding = await fetchBranding(operatorId);
  applyBrandingVariables(branding);

  // Update document title with operator name
  if (branding.name) {
    document.title = `${branding.name} - Admin Portal`;
  }

  return branding;
}

/**
 * Clear branding cache
 */
export function clearBrandingCache(): void {
  brandingCache.clear();
  // Clear localStorage caches
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(BRANDING_CACHE_KEY)) {
      localStorage.removeItem(key);
    }
  }
}

/**
 * Initialize theme loading
 * Call this early in application startup
 */
export async function initializeTheme(): Promise<BrandingConfig> {
  // Listen for operator ID changes
  window.addEventListener('operator-id-changed', async (event) => {
    const { operatorId } = (event as CustomEvent).detail;
    await loadAndApplyBranding();
    console.log(`[Theme] Operator changed to: ${operatorId}`);
  });

  return loadAndApplyBranding();
}

export default {
  getOperatorId,
  setOperatorId,
  fetchBranding,
  applyBrandingVariables,
  loadAndApplyBranding,
  clearBrandingCache,
  initializeTheme,
};
