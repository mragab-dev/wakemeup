
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import theme from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'md',
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const paddingStyles = {
    none: styles.paddingNone,
    sm: styles.paddingSm,
    md: styles.paddingMd,
    lg: styles.paddingLg
  };

  return (
    <View style={[
      styles.card,
      styles[variant],
      paddingStyles[padding],
      style
    ]}>
      {children}
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  default: {},
  elevated: {
    ...theme.shadows.md,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  paddingNone: {
    padding: 0,
  },
  paddingSm: {
    padding: theme.spacing.sm,
  },
  paddingMd: {
    padding: theme.spacing.md,
  },
  paddingLg: {
    padding: theme.spacing.lg,
  },
});

export default Card;
