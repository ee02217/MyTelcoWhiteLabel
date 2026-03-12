/**
 * Theme Loader Types
 */

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

export interface LogoConfig {
  light: string;
  dark: string;
  favicon?: string;
}

export interface FontFamily {
  sans: string;
  mono: string;
}

export interface HeadingFontWeights {
  h1: string;
  h2: string;
  h3: string;
  h4: string;
  h5: string;
  h6: string;
}

export interface TypographyConfig {
  fontFamily: FontFamily;
  headings?: {
    fontFamily?: string;
    fontWeight?: HeadingFontWeights;
  };
}

export interface SemanticTextTokens {
  primary: string;
  secondary: string;
  disabled: string;
  inverse: string;
}

export interface SemanticBackgroundTokens {
  primary: string;
  secondary: string;
  tertiary: string;
}

export interface SemanticBorderTokens {
  default: string;
  focus: string;
}

export interface SemanticTokens {
  text: SemanticTextTokens;
  background: SemanticBackgroundTokens;
  border: SemanticBorderTokens;
}

export interface BrandingConfig {
  operatorId: string;
  name: string;
  logo: LogoConfig;
  colors: {
    primary: ColorPalette;
    secondary: ColorPalette;
    accent: ColorPalette;
    success?: ColorPalette;
    warning?: ColorPalette;
    error?: ColorPalette;
    neutral: ColorPalette;
  };
  typography: TypographyConfig;
  semanticTokens?: SemanticTokens;
  cssVariables?: Record<string, string>;
  version: string;
  lastUpdated: string;
  // Internal caching
  cachedAt?: number;
}
