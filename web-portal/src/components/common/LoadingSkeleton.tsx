// Loading skeleton component

import type { CSSProperties } from 'react';

interface LoadingSkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: CSSProperties;
  className?: string;
}

export function LoadingSkeleton({
  width = '100%',
  height = '20px',
  borderRadius = '8px',
  style = {},
  className = '',
}: LoadingSkeletonProps) {
  const combinedStyle: CSSProperties = {
    width,
    height,
    borderRadius,
    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    ...style,
  };

  return (
    <div
      className={className}
      style={combinedStyle}
    />
  );
}

interface SkeletonCardProps {
  lines?: number;
}

export function SkeletonCard({ lines = 3 }: SkeletonCardProps) {
  return (
    <div className="card" style={{ padding: '20px' }}>
      <LoadingSkeleton width="60%" height="24px" style={{ marginBottom: '16px' }} />
      {Array.from({ length: lines }).map((_, i) => (
        <LoadingSkeleton
          key={i}
          width={i === lines - 1 ? '40%' : '100%'}
          height="16px"
          style={{ marginBottom: '10px' }}
        />
      ))}
    </div>
  );
}

interface SkeletonListProps {
  items?: number;
}

export function SkeletonList({ items = 5 }: SkeletonListProps) {
  return (
    <div>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="row py-3"
          style={{ borderBottom: '1px solid var(--premium-border)' }}
        >
          <LoadingSkeleton width="40px" height="40px" borderRadius="50%" />
          <div style={{ flex: 1 }}>
            <LoadingSkeleton width="30%" height="16px" style={{ marginBottom: '6px' }} />
            <LoadingSkeleton width="20%" height="14px" />
          </div>
        </div>
      ))}
    </div>
  );
}
