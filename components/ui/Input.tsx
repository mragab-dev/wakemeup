
import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import theme from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  errorStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
  leftIcon,
  rightIcon,
  onRightIconPress,
  ...rest
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}

      <View style={[
        styles.inputContainer,
        error ? styles.inputError : null,
      ]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : undefined,
            rightIcon ? styles.inputWithRightIcon : undefined,
            inputStyle,
          ]}
          placeholderTextColor={colors.textSecondary}
          {...rest}
        />

        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={[styles.error, errorStyle]}>{error}</Text>}
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    color: colors.text,
    marginBottom: theme.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    minHeight: 44,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.fontSizes.md,
    color: colors.text,
  },
  inputWithLeftIcon: {
    paddingLeft: theme.spacing.xs,
  },
  inputWithRightIcon: {
    paddingRight: theme.spacing.xs,
  },
  leftIcon: {
    paddingLeft: theme.spacing.md,
  },
  rightIcon: {
    paddingRight: theme.spacing.md,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.error,
    marginTop: theme.spacing.xs,
  },
});

export default Input;