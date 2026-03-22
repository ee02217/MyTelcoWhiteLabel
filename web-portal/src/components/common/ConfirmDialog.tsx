// Confirmation dialog component

import { useState } from 'react';
import { Button } from '../../design-system/Button';
import { Typography } from '../../design-system/Typography';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
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
      onClick={onCancel}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Typography variant="h4" style={{ marginBottom: '12px' }}>
          {title}
        </Typography>
        <Typography variant="body" color="secondary" style={{ marginBottom: '24px' }}>
          {message}
        </Typography>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={variant === 'primary' ? 'primary' : 'outline'} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Hook for managing dialog state
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  } | null>(null);

  const confirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      confirmLabel?: string;
      cancelLabel?: string;
      variant?: 'danger' | 'warning' | 'primary';
    }
  ) => {
    setConfig({
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setIsOpen(false);
      },
      ...options,
    });
    setIsOpen(true);
  };

  const cancel = () => {
    setIsOpen(false);
    setConfig(null);
  };

  return {
    isOpen,
    config,
    confirm,
    cancel,
    Dialog: config ? (
      <ConfirmDialog
        open={isOpen}
        title={config.title}
        message={config.message}
        confirmLabel={config.confirmLabel}
        cancelLabel={config.cancelLabel}
        variant={config.variant}
        onConfirm={config.onConfirm}
        onCancel={cancel}
      />
    ) : null,
  };
}
