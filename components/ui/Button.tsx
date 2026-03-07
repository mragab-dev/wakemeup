
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  ColorValue,
  StyleProp,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface ButtonProps extends TouchableOpacityProps {
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  ...rest
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const isGradient = variant === 'primary' || variant === 'secondary';

  const buttonStyles: StyleProp<ViewStyle> = [
    styles.button,
    styles[`${size}Button`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    !isGradient && styles[variant],
    style,
  ];

  const textStyles: TextStyle[] = [
    styles.text,
    styles[`${size}Text`],
    styles[`${variant}Text`],
    textStyle as TextStyle,
  ];

  const gradientColors: [ColorValue, ColorValue, ColorValue] =
    variant === 'primary'
      ? [colors.primaryLight, colors.primary, colors.primaryDark]
      : [colors.secondaryLight, colors.secondary, colors.secondaryDark];

  const ButtonContent = () => (
    <>
      {leftIcon && !loading && <View style={styles.iconWrapper}>{leftIcon}</View>}
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : 'white'}
        />
      ) : (
        title && <Text style={textStyles}>{title}</Text>
      )}
      {rightIcon && !loading && <View style={styles.iconWrapper}>{rightIcon}</View>}
    </>
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={buttonStyles}
      activeOpacity={0.8}
      {...rest}
    >
      {isGradient ? (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <ButtonContent />
        </LinearGradient>
      ) : (
        <ButtonContent />
      )}
    </TouchableOpacity>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  button: {
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 'inherit' as any, // Will inherit from parent button size styles if we move padding there
  },
  smButton: {
    minHeight: 36,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  mdButton: {
    minHeight: 44,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  lgButton: {
    minHeight: 52,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '500',
    textAlign: 'center',
  },
  smText: {
    fontSize: theme.typography.fontSizes.sm,
  },
  mdText: {
    fontSize: theme.typography.fontSizes.md,
  },
  lgText: {
    fontSize: theme.typography.fontSizes.lg,
  },
  primaryText: {
    color: 'white',
  },
  secondaryText: {
    color: 'white',
  },
  outlineText: {
    color: colors.primary,
  },
  ghostText: {
    color: colors.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  ghost: {
    backgroundColor: 'transparent',
    paddingHorizontal: theme.spacing.md,
  },
  iconWrapper: {
    marginHorizontal: theme.spacing.xs,
  },
});

export default Button;
