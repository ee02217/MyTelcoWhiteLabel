#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const WCAG_AA_NORMAL = 4.5;
const WCAG_AA_LARGE = 3.0;

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return null;
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function luminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) throw new Error(`Invalid hex color: ${hex}`);
  const channels = [rgb.r, rgb.g, rgb.b].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(fg, bg) {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

const tokensPath = join(process.cwd(), 'platform-config', 'design-system', 'tokens.json');
const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));

const pairs = [
  {
    name: 'Primary text / primary background',
    fg: tokens.color.semantic.text.primary,
    bg: tokens.color.semantic.background.primary,
    min: WCAG_AA_NORMAL,
  },
  {
    name: 'Secondary text / primary background',
    fg: tokens.color.semantic.text.secondary,
    bg: tokens.color.semantic.background.primary,
    min: WCAG_AA_NORMAL,
  },
  {
    name: 'Primary button text / primary button',
    fg: '#ffffff',
    bg: tokens.color.primary[500],
    min: WCAG_AA_LARGE,
  },
  {
    name: 'Secondary button text / secondary button',
    fg: '#ffffff',
    bg: tokens.color.secondary[500],
    min: WCAG_AA_LARGE,
  },
  {
    name: 'Inverse text / neutral-900',
    fg: tokens.color.semantic.text.inverse,
    bg: tokens.color.neutral[900],
    min: WCAG_AA_NORMAL,
  },
];

let failed = 0;
console.log('Running WCAG contrast checks...');
for (const pair of pairs) {
  const ratio = contrastRatio(pair.fg, pair.bg);
  const ok = ratio >= pair.min;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${pair.name}: ${ratio.toFixed(2)}:1 (min ${pair.min}:1)`);
  if (!ok) failed += 1;
}

if (failed > 0) {
  console.error(`Contrast validation failed (${failed} failing pair(s)).`);
  process.exit(1);
}

console.log('All contrast checks passed.');
