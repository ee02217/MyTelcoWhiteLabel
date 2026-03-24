interface SIMStatusBadgeProps {
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  size?: 'sm' | 'md';
}

export function SIMStatusBadge({ status, size = 'md' }: SIMStatusBadgeProps) {
  const statusConfig: Record<string, { label: string; badgeClass: string }> = {
    ACTIVE: {
      label: 'Active',
      badgeClass: 'badge badge-success',
    },
    SUSPENDED: {
      label: 'Suspended',
      badgeClass: 'badge badge-warning',
    },
    INACTIVE: {
      label: 'Inactive',
      badgeClass: 'badge badge-neutral',
    },
  };

  const config = statusConfig[status] || statusConfig.INACTIVE;
  const sizeClass = size === 'sm' ? 'badge-sm' : '';

  return (
    <span className={`${config.badgeClass} ${sizeClass}`}>
      <span className={`status-dot ${status === 'ACTIVE' ? 'status-dot-active' : status === 'SUSPENDED' ? 'status-dot-suspended' : 'status-dot-inactive'}`} />
      <span>{config.label}</span>
    </span>
  );
}
