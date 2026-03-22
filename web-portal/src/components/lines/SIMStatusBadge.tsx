interface SIMStatusBadgeProps {
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  size?: 'sm' | 'md';
}

export function SIMStatusBadge({ status, size = 'md' }: SIMStatusBadgeProps) {
  const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    ACTIVE: {
      label: 'Active',
      color: 'bg-green-100 text-green-700',
      icon: '✓',
    },
    SUSPENDED: {
      label: 'Suspended',
      color: 'bg-amber-100 text-amber-700',
      icon: '⏸',
    },
    INACTIVE: {
      label: 'Inactive',
      color: 'bg-gray-100 text-gray-700',
      icon: '✕',
    },
  };

  const config = statusConfig[status] || statusConfig.INACTIVE;
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${config.color} ${sizeClasses}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
