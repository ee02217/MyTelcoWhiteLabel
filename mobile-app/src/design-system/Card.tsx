import React from 'react';
import { View, ViewStyle } from 'react-native';
import { rnTokens } from '../../../platform-config/design-system/tokens';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';
type CardShadow = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  padding?: CardPadding;
  shadow?: CardShadow;
  style?: ViewStyle;
}

const paddingValues: Record<CardPadding, number> = {
  none: 0,
  sm: rnTokens.spacingPx[2],
  md: rnTokens.spacingPx[4],
  lg: rnTokens.spacingPx[6],
};

const shadowStyles: Record<CardShadow, ViewStyle> = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
};

export function Card({ children, padding = 'md', shadow = 'md', style }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: rnTokens.colors.semantic.background.primary,
          borderRadius: rnTokens.radiusPx.lg,
          borderWidth: 1,
          borderColor: rnTokens.colors.semantic.border.default,
          padding: paddingValues[padding],
        },
        shadowStyles[shadow],
        style,
      ]}
    >
      {children}
    </View>
  );
}
