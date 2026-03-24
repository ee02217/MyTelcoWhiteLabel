import type { CSSProperties } from 'react';

export const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'var(--color-background-primary)',
    color: 'var(--color-text-primary)',
    padding: 'var(--spacing-8)',
    display: 'grid',
    gap: 'var(--spacing-4)',
  },
  row: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  twoCols: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.6fr 1.4fr',
    gap: 'var(--spacing-4)',
    alignItems: 'start',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-4)',
  },
  input: {
    border: '1px solid var(--color-border-default)',
    borderRadius: 'var(--radius-sm)',
    padding: '6px 8px',
    minWidth: 220,
    background: 'var(--color-background-primary)',
    color: 'var(--color-text-primary)',
  },
  codeBlock: {
    background: 'var(--color-background-secondary)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 10px',
    whiteSpace: 'pre-wrap',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
  },
};
