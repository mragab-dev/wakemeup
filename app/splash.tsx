
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Text, Platform, ColorValue } from 'react-native';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';
import { Brain, Clock } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/store/settingsStore';

interface AnimatedSplashScreenProps {
  onAnimationFinish: () => void;
}

export default function AnimatedSplashScreen({ onAnimationFinish }: AnimatedSplashScreenProps) {
  const { colors, isDark } = useTheme();
  const { t } = useSettingsStore();

  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    ExpoSplashScreen.hideAsync();

    Animated.sequence([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.elastic(1.2),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const timer = setTimeout(() => {
      onAnimationFinish();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onAnimationFinish]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const gradientColors: [ColorValue, ColorValue] = isDark
    ? ['#374151', '#111827']
    : [colors.primaryLight, colors.primary];

  const styles = createStyles(isDark);

  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ rotate: rotation }],
              borderColor: isDark ? 'rgba(135, 206, 235, 0.15)' : 'rgba(255, 255, 255, 0.3)',
              backgroundColor: isDark ? 'rgba(135, 206, 235, 0.1)' : 'rgba(255, 255, 255, 0.2)',
            },
          ]}
        >
          <View style={styles.clockContainer}>
            <Clock size={77} color={"#E0F2FE"} />
            <View style={styles.brainOverlay}>
              <Brain size={48} color={"#E0F2FE"} />
            </View>
          </View>
        </Animated.View>

        <Text style={styles.appName}>
          {t('wakeUpTitle')}
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 3,
  },
  clockContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brainOverlay: {
    position: 'absolute',
    top: (77 - 48) / 2,
    left: (77 - 48) / 2,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
