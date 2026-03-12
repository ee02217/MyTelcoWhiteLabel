import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { tokens } from '../../../../platform-config/design-tokens/tokens';

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
  sm: 8,
  md: 16,
  lg: 24,
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
  const cardStyle: ViewStyle = {
    backgroundColor: tokens.semantic.background.primary,
    borderRadius: Number(tokens.borderRadius.lg.replace('rem', '')) * 16,
    padding: paddingValues[padding],
    borderWidth: 1,
    borderColor: tokens.semantic.border.default,
    ...shadowStyles[shadow],
  };

  return <View style={[cardStyle, style]}>{children}</View>;
}
