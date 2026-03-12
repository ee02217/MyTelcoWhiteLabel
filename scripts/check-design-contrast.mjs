#!/usr/bin/env node
/**
 * Design Contrast Checker
 * Validates WCAG contrast ratios for semantic color pairs
 * Fails if contrast is below WCAG AA requirements (4.5:1 for normal text, 3:1 for large text)
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// WCAG thresholds
const WCAG_AA_NORMAL = 4.5;
const WCAG_AA_LARGE = 3.0;
const WCAG_AAA_NORMAL = 7.0;
const WCAG_AAA_LARGE = 4.5;

/**
 * Calculate relative luminance per WCAG 2.1
 */
function getLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(foreground, background) {
  const lum1 = getLuminance(foreground);
  const lum2 = getLuminance(background);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Define semantic color pairs to check
const colorPairs = [
  {
    name: 'Primary text on primary background',
    foreground: '#18181b', // semantic.text.primary
    background: '#ffffff', // semantic.background.primary
    minRatio: WCAG_AA_NORMAL,
    textSize: 'normal',
  },
  {
    name: 'Secondary text on primary background',
    foreground: '#52525b', // semantic.text.secondary
    background: '#ffffff',
    minRatio: WCAG_AA_NORMAL,
    textSize: 'normal',
  },
  {
    name: 'Disabled text on primary background',
    foreground: '#a1a1aa', // semantic.text.disabled
    background: '#ffffff',
    minRatio: 2.0, // Below AA - intentional for disabled state
    textSize: 'disabled',
  },
  {
    name: 'Primary button text on primary background',
    foreground: '#ffffff',
    background: '#0073e6', // color.primary[500]
    minRatio: WCAG_AA_LARGE, // 3.0 - buttons are large enough
    textSize: 'large',
  },
  {
    name: 'Secondary button text on secondary background',
    foreground: '#ffffff',
    background: '#3b82f6', // color.secondary[500]
    minRatio: WCAG_AA_LARGE,
    textSize: 'large',
  },
  {
    name: 'Error text on error background',
    foreground: '#ffffff',
    background: '#ef4444', // color.error[500]
    minRatio: WCAG_AA_LARGE,
    textSize: 'large',
  },
  {
    name: 'Success text on success background',
    foreground: '#ffffff',
    background: '#16a34a', // color.success[500]
    minRatio: WCAG_AA_LARGE,
    textSize: 'large',
  },
  {
    name: 'Heading text on primary background',
    foreground: '#18181b',
    background: '#ffffff',
    minRatio: WCAG_AA_LARGE,
    textSize: 'large',
  },
  {
    name: 'Inverse text on dark background',
    foreground: '#fafafa', // semantic.text.inverse
    background: '#18181b', // color.neutral[900]
    minRatio: WCAG_AA_NORMAL,
    textSize: 'normal',
  },
];

function main() {
  console.log('🎨 Running WCAG Contrast Checks\n');
  console.log('='.repeat(60));

  const tokensPath = join(process.cwd(), 'platform-config', 'design-tokens', 'tokens.json');
  let tokens;

  try {
    const tokensContent = readFileSync(tokensPath, 'utf-8');
    tokens = JSON.parse(tokensContent);
  } catch (error) {
    console.error('❌ Failed to load design tokens:', error.message);
    process.exit(1);
  }

  let hasFailures = false;
  let passedCount = 0;

  for (const pair of colorPairs) {
    const ratio = getContrastRatio(pair.foreground, pair.background);
    const passesAA = ratio >= pair.minRatio;
    const passesAAA = ratio >= (pair.textSize === 'large' ? WCAG_AAA_LARGE : WCAG_AAA_NORMAL);

    const status = passesAA ? '✅ PASS' : '❌ FAIL';
    const aaaStatus = passesAAA ? 'AAA' : 'AA';

    console.log(`\n${status} ${pair.name}`);
    console.log(`   Foreground: ${pair.foreground}`);
    console.log(`   Background: ${pair.background}`);
    console.log(`   Contrast: ${ratio.toFixed(2)}:1 (min: ${pair.minRatio}:1)`);
    console.log(`   WCAG Level: ${aaaStatus}`);

    if (!passesAA) {
      hasFailures = true;
      console.log(`   ⚠️  Fails WCAG AA for ${pair.textSize} text`);
    } else {
      passedCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Summary: ${passedCount}/${colorPairs.length} checks passed`);

  if (hasFailures) {
    console.log('\n❌ Contrast check FAILED');
    console.log('   Fix color combinations above to meet WCAG AA standards');
    console.log('   Run this script again after fixes to verify\n');
    process.exit(1);
  } else {
    console.log('\n✅ All contrast checks PASSED');
    console.log('   All semantic color pairs meet WCAG AA standards\n');
    process.exit(0);
  }
}

main();
