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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '450px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Typography variant="h4" style={{ marginBottom: '12px' }}>
          {title}
        </Typography>
        <div style={{ marginBottom: '24px' }}>
          {children}
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'outline' : 'primary'}
            size="sm"
            onClick={onConfirm}
            disabled={loading || confirmDisabled}
            style={variant === 'danger' ? { backgroundColor: '#dc2626', color: 'white', borderColor: '#dc2626' } : undefined}
          >
            {loading ? 'Loading...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
