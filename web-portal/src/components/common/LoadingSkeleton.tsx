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
  borderRadius = '4px',
  style = {},
  className = '',
}: LoadingSkeletonProps) {
  const combinedStyle: CSSProperties = {
    width,
    height,
    borderRadius,
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
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
    <div style={{ padding: '16px', border: '1px solid #eee', borderRadius: '8px' }}>
      <LoadingSkeleton width="60%" height="24px" style={{ marginBottom: '12px' }} />
      {Array.from({ length: lines }).map((_, i) => (
        <LoadingSkeleton
          key={i}
          width={i === lines - 1 ? '40%' : '100%'}
          height="16px"
          style={{ marginBottom: '8px' }}
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
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 0',
            borderBottom: '1px solid #eee',
          }}
        >
          <LoadingSkeleton width="40px" height="40px" borderRadius="50%" />
          <div style={{ flex: 1 }}>
            <LoadingSkeleton width="30%" height="16px" style={{ marginBottom: '4px' }} />
            <LoadingSkeleton width="20%" height="14px" />
          </div>
        </div>
      ))}
    </div>
  );
}
