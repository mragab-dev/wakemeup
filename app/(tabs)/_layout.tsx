import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Home, Bell, Pill, BarChart2, Settings } from 'lucide-react-native';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import AdBanner from '@/components/ui/AdBanner';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Approximate height of the adaptive banner
  const bannerHeight = 60;

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom + 5,
            paddingTop: 5,
          },
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerShadowVisible: false,
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '700',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: false, // User complained about "index" header
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="alarms"
          options={{
            title: 'Alarms',
            tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="medications"
          options={{
            title: 'Medications',
            tabBarIcon: ({ color, size }) => <Pill size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Reports',
            tabBarIcon: ({ color, size }) => <BarChart2 size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
          }}
        />
      </Tabs>

      {/* Sticky Ad Banner above the Tab bar */}
      <View style={[styles.adContainer, { bottom: 60 + insets.bottom }]}>
        <AdBanner />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  adContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'transparent',
    alignItems: 'center',
    zIndex: 1000,
    // We'll trust the AdBanner component's internal sizing
  },
});
