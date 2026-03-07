
import React from 'react';
import { View, StyleSheet, Animated, TouchableWithoutFeedback, ViewStyle } from 'react-native';
import theme from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
  activeColor?: string;
  inactiveColor?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  style,
  activeColor,
  inactiveColor,
}) => {
  const { colors } = useTheme();
  const finalActiveColor = activeColor || colors.primary;
  const finalInactiveColor = inactiveColor || colors.border;

  const translateX = React.useRef(new Animated.Value(value ? 20 : 0)).current;
  const backgroundColor = React.useRef(new Animated.Value(value ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: value ? 20 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backgroundColor, {
        toValue: value ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [value, translateX, backgroundColor]);

  const backgroundColorInterpolation = backgroundColor.interpolate({
    inputRange: [0, 1],
    outputRange: [finalInactiveColor, finalActiveColor],
  });

  const handleToggle = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleToggle} disabled={disabled}>
      <View style={[styles.container, style, disabled && styles.disabled]}>
        <Animated.View
          style={[
            styles.track,
            {
              backgroundColor: backgroundColorInterpolation,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.thumb,
              {
                transform: [{ translateX }],
              },
            ]}
          />
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'white',
    ...theme.shadows.sm,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Switch;
