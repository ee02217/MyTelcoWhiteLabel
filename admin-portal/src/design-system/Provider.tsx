import React, { createContext, useContext } from 'react';
import '../../../platform-config/design-system/tokens.css';

interface DesignSystemContextValue {
  tokens: {
    color: typeof import('../../../platform-config/design-system/tokens').tokens.color;
  };
}

const DesignSystemContext = createContext<DesignSystemContextValue | null>(null);

export function DesignSystemProvider({ children }: { children: React.ReactNode }) {
  // Tokens are injected via CSS variables
  return (
    <DesignSystemContext.Provider value={{ tokens: { color: {} } as any }}>
      {children}
    </DesignSystemContext.Provider>
  );
}

export function useDesignSystem() {
  const context = useContext(DesignSystemContext);
  if (!context) {
    throw new Error('useDesignSystem must be used within DesignSystemProvider');
  }
  return context;
}
