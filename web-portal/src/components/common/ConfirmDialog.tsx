// Confirmation dialog component with flexible content support

import { Button } from '../../design-system/Button';
import { Typography } from '../../design-system/Typography';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  onConfirm: () => void;
  onClose: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  confirmDisabled?: boolean;
  variant?: 'primary' | 'danger';
  children?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  title,
  onConfirm,
  onClose,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  confirmDisabled = false,
  variant = 'primary',
  children,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <Typography variant="h4" style={{ marginBottom: '12px' }}>
          {title}
        </Typography>
        <div style={{ marginBottom: '24px' }}>
          {children}
        </div>
        <div className="row justify-end" style={{ gap: '12px' }}>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'outline' : 'primary'}
            size="sm"
            onClick={onConfirm}
            disabled={loading || confirmDisabled}
            style={variant === 'danger' ? { backgroundColor: 'var(--premium-error)', color: 'white', borderColor: 'var(--premium-error)' } : undefined}
          >
            {loading ? 'Loading...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
