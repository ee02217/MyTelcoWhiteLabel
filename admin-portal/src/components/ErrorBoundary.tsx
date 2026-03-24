import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, Panel, Typography } from '../design-system';

type Props = {
  children: ReactNode;
  fallbackTitle?: string;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Panel title={this.props.fallbackTitle || 'Something went wrong'}>
          <Typography variant="body" color="secondary">
            An unexpected error occurred in this section.
          </Typography>
          <div
            style={{
              background: 'var(--color-background-secondary)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 10px',
              whiteSpace: 'pre-wrap',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 12,
              marginTop: 8,
              color: 'var(--color-danger-500, #e74c3c)',
            }}
          >
            {this.state.error?.message || 'Unknown error'}
          </div>
          <div style={{ marginTop: 12 }}>
            <Button size="sm" variant="outline" onClick={this.handleRetry}>
              Retry
            </Button>
          </div>
        </Panel>
      );
    }

    return this.props.children;
  }
}
