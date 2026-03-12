import React from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';
import { rnTokens } from '../../../../platform-config/design-system/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  title: string;
  style?: ViewStyle;
}

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: { paddingVertical: rnTokens.spacingPx[1], paddingHorizontal: rnTokens.spacingPx[3] },
  md: { paddingVertical: rnTokens.spacingPx[2], paddingHorizontal: rnTokens.spacingPx[4] },
  lg: { paddingVertical: rnTokens.spacingPx[3], paddingHorizontal: rnTokens.spacingPx[6] },
};

const textSize: Record<ButtonSize, number> = { sm: 12, md: 16, lg: 18 };

export function Button({ variant = 'primary', size = 'md', title, style, ...props }: ButtonProps) {
  const tone =
    variant === 'secondary'
      ? rnTokens.colors.secondary[500]
      : variant === 'primary'
        ? rnTokens.colors.primary[500]
        : 'transparent';

  const borderColor = variant === 'outline' ? rnTokens.colors.primary[500] : 'transparent';
  const textColor =
    variant === 'primary' || variant === 'secondary' ? '#fff' : rnTokens.colors.primary[500];

  return (
    <TouchableOpacity
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: rnTokens.radiusPx.md,
          backgroundColor: tone,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor,
        },
        sizeStyles[size],
        style,
      ]}
      {...props}
    >
      <Text style={{ color: textColor, fontWeight: '500', fontSize: textSize[size] }}>{title}</Text>
    </TouchableOpacity>
  );
}
