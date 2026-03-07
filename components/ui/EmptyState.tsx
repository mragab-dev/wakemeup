
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import theme from '@/constants/theme';
import Button from './Button';
import { useTheme } from '@/hooks/useTheme';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  style,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      
      <Text style={styles.title}>{title}</Text>
      
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
      
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          style={styles.button}
        />
      )}
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  iconContainer: {
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: theme.typography.fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  button: {
    marginTop: theme.spacing.md,
  },
});

export default EmptyState;
