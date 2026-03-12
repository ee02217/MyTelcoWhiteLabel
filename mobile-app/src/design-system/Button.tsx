import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { tokens } from '../../../../platform-config/design-tokens/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  title: string;
  style?: ViewStyle;
}

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: tokens.color.primary[500],
  },
  secondary: {
    backgroundColor: tokens.color.secondary[500],
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: tokens.color.primary[500],
  },
  ghost: {
    backgroundColor: 'transparent',
  },
};

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: {
    paddingVertical: tokens.spacing[1],
    paddingHorizontal: tokens.spacing[3],
  },
  md: {
    paddingVertical: tokens.spacing[2],
    paddingHorizontal: tokens.spacing[4],
  },
  lg: {
    paddingVertical: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[6],
  },
};

const textSizeStyles: Record<ButtonSize, TextStyle> = {
  sm: { fontSize: 12 },
  md: { fontSize: 16 },
  lg: { fontSize: 18 },
};

export function Button({ variant = 'primary', size = 'md', title, style, ...props }: ButtonProps) {
  const buttonStyle: ViewStyle = {
    borderRadius: Number(tokens.borderRadius.md.replace('rem', '')) * 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...variantStyles[variant],
    ...sizeStyles[size],
  };

  const textColor =
    variant === 'primary' || variant === 'secondary' ? '#ffffff' : tokens.color.primary[500];

  return (
    <TouchableOpacity style={[buttonStyle, style]} {...props}>
      <Text style={[styles.text, { color: textColor }, textSizeStyles[size]]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: tokens.font.weight.medium,
  },
});
