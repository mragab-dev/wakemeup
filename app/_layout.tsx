
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@/hooks/useTheme";
import * as Notifications from 'expo-notifications';
import { Platform, AppState, NativeModules, Alert, View, StyleSheet, DeviceEventEmitter, I18nManager } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { router } from "expo-router";
import AnimatedSplashScreen from './splash';
import MobileAds from 'react-native-google-mobile-ads';
import * as ExpoCamera from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import AdBanner from '@/components/ui/AdBanner';
import { useSettingsStore } from "@/store/settingsStore";

const { AlarmModule, IntentModule } = NativeModules;

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });
  const [isSplashAnimationFinished, setSplashAnimationFinished] = useState(false);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (isSplashAnimationFinished) {
      (async () => {
        const requestPermissionsSequentially = async () => {
          console.log("Starting sequential permission requests...");

          if (Platform.OS === 'android' && AlarmModule) {
            // 1. Battery Optimization (Most Important)
            try {
              const isIgnoring = await AlarmModule.isIgnoringBatteryOptimizations();
              if (!isIgnoring) {
                await new Promise<void>((resolve) => {
                  Alert.alert(
                    "Background Reliability",
                    "To ensure your alarms ring even when the phone is in sleep mode, please exclude the app from Battery Optimization.",
                    [
                      { text: "Allow ✅", onPress: () => { AlarmModule.requestIgnoreBatteryOptimizations(); resolve(); } },
                      { text: "Deny ❌", style: "cancel", onPress: () => resolve() }
                    ]
                  );
                });
              }
            } catch (e) { console.error("Error checking battery optimization:", e); }

            await new Promise(r => setTimeout(r, 800));

            // 2. Exact Alarm (Android 12+)
            try {
              const canExact = await AlarmModule.canScheduleExactAlarms();
              if (!canExact) {
                await new Promise<void>((resolve) => {
                  Alert.alert(
                    "Precise Timing",
                    "To ensure your alarm rings at the exact scheduled second, please allow the app to set precise alarms.",
                    [
                      { text: "Allow ✅", onPress: () => { AlarmModule.requestExactAlarmPermission(); resolve(); } },
                      { text: "Deny ❌", style: "cancel", onPress: () => resolve() }
                    ]
                  );
                });
              }
            } catch (e) { console.error("Error checking exact alarm:", e); }

            await new Promise(r => setTimeout(r, 800));

            // 3. Draw Over Other Apps (for Fullscreen Alarms)
            try {
              const canDraw = await AlarmModule.canDrawOverlays();
              if (!canDraw) {
                await new Promise<void>((resolve) => {
                  Alert.alert(
                    "Fullscreen Alerts",
                    "To show the alarm challenge screen while your phone is locked, please enable 'Draw over other apps'.",
                    [
                      { text: "Allow ✅", onPress: () => { AlarmModule.requestOverlayPermission(); resolve(); } },
                      { text: "Deny ❌", style: "cancel", onPress: () => resolve() }
                    ]
                  );
                });
              }
            } catch (e) { console.error("Error checking overlay permission:", e); }

            await new Promise(r => setTimeout(r, 800));
          }

          // 4. Notifications
          try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            if (existingStatus !== 'granted') {
              const { status: finalStatus } = await Notifications.requestPermissionsAsync();
              console.log("Notification permission status:", finalStatus);
            }
          } catch (e) { console.error("Error requesting notifications:", e); }

          await new Promise(r => setTimeout(r, 500));

          // 5. Camera (for QR)
          try {
            const { status: camStatus } = await ExpoCamera.Camera.getCameraPermissionsAsync();
            if (camStatus !== 'granted') {
              await ExpoCamera.Camera.requestCameraPermissionsAsync();
            }
          } catch (e) { console.error("Error requesting camera:", e); }

          await new Promise(r => setTimeout(r, 500));

          // 6. Photo Library (for Medication images)
          try {
            const { status: libStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
            if (libStatus !== 'granted') {
              await ImagePicker.requestMediaLibraryPermissionsAsync();
            }
          } catch (e) { console.error("Error requesting photos:", e); }

          if (Platform.OS === 'android') {
            // 7. AdMob Initialize
            try {
              await MobileAds().initialize();
              console.log("AdMob initialized");
            } catch (e) {
              console.error("AdMob init error:", e);
            }

            // 8. Handle RTL
            const isArabic = useSettingsStore.getState().language === 'ar';
            if (isArabic !== I18nManager.isRTL) {
              I18nManager.allowRTL(isArabic);
              I18nManager.forceRTL(isArabic);
            }
          }
          console.log("Permission sequence finished.");
        };

        const checkInitialIntent = async () => {
          if (Platform.OS === 'android' && IntentModule) {
            try {
              const extras = await IntentModule.getIntentExtras();
              console.log("App started/resumed with intent extras:", extras);
              handleIntentExtras(extras);
            } catch (e) {
              console.error("Error checking intent extras:", e);
            }
          }
        };

        await requestPermissionsSequentially();
        await checkInitialIntent();
      })();
    }
  }, [isSplashAnimationFinished]);

  const handleIntentExtras = (extras: any) => {
    if (extras?.openChallenge && extras?.alarmId) {
      if (extras.type === 'medication') {
        console.log("Routing to medication reminder screen from intent extras:", extras);

        // Medical alarmId format: medicationId_doseId
        // But it might have suffixes like _day_3 or _snooze
        let cleanId = extras.alarmId as string;

        // Strip snooze
        if (cleanId.endsWith('_snooze')) {
          cleanId = cleanId.replace('_snooze', '');
        }

        // Strip day suffix (_day_x)
        const dayMatch = cleanId.match(/_day_\d+$/);
        if (dayMatch) {
          cleanId = cleanId.replace(dayMatch[0], '');
        }

        const parts = cleanId.split('_');
        if (parts.length >= 2) {
          router.push({
            pathname: '/medication-reminder',
            params: {
              medicationId: parts[0],
              doseId: parts[1]
            }
          });
          return;
        }
      }

      console.log("Routing to alarm challenge screen from intent extras:", extras);
      router.push({
        pathname: '/alarm-challenge' as any,
        params: {
          alarmId: extras.alarmId,
          challengeType: extras.challengeType || 'none',
          snoozeCount: extras.snoozeCount || '0'
        }
      });
    }
  };

  // Listen for new intents while app is active (Android specific)
  useEffect(() => {
    if (Platform.OS === 'android') {
      console.log("Registering onNewIntent listener");
      const intentSubscription = DeviceEventEmitter.addListener('onNewIntent', (extras) => {
        console.log("New intent received in JS while active:", extras);
        handleIntentExtras(extras);
      });
      return () => {
        console.log("Unregistering onNewIntent listener");
        intentSubscription.remove();
      };
    }
  }, []);


  // Handle notification responses and auto-open screens
  useEffect(() => {
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data;
      if (data?.autoOpen) {
        if (data.type === 'alarm') {
          router.push({
            pathname: '/alarm-challenge',
            params: {
              alarmId: data.alarmId as string,
              challengeType: data.challengeType as string,
              snoozeCount: data.snoozeCount !== undefined ? String(data.snoozeCount) : '0'
            }
          });
        } else if (data.type === 'medication') {
          let cleanId = data.alarmId as string || `${data.medicationId}_${data.doseId}`;

          if (cleanId.startsWith('medication_snooze_')) {
            cleanId = cleanId.replace('medication_snooze_', '');
          }
          if (cleanId.endsWith('_snooze')) {
            cleanId = cleanId.replace('_snooze', '');
          }
          const dayMatch = cleanId.match(/_day_\d+$/);
          if (dayMatch) {
            cleanId = cleanId.replace(dayMatch[0], '');
          }

          const parts = cleanId.split('_');
          if (parts.length >= 2) {
            router.push({
              pathname: '/medication-reminder',
              params: { medicationId: parts[0], doseId: parts[1], alarmId: data.alarmId as string }
            });
          }
        }
      }
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.type === 'alarm') {
        router.push({
          pathname: '/alarm-challenge',
          params: {
            alarmId: data.alarmId as string,
            challengeType: data.challengeType as string,
            snoozeCount: data.snoozeCount !== undefined ? String(data.snoozeCount) : '0'
          }
        });
      } else if (data?.type === 'medication') {
        let cleanId = data.alarmId as string || `${data.medicationId}_${data.doseId}`;

        if (cleanId.startsWith('medication_snooze_')) {
          cleanId = cleanId.replace('medication_snooze_', '');
        }
        if (cleanId.endsWith('_snooze')) {
          cleanId = cleanId.replace('_snooze', '');
        }

        const dayMatch = cleanId.match(/_day_\d+$/);
        if (dayMatch) {
          cleanId = cleanId.replace(dayMatch[0], '');
        }

        const parts = cleanId.split('_');
        if (parts.length >= 2) {
          router.push({
            pathname: '/medication-reminder',
            params: { medicationId: parts[0], doseId: parts[1], alarmId: data.alarmId as string }
          });
        }
      }
    });

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  // Handle app state changes to auto-open screens
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active') {
        const deliveredNotifications = await Notifications.getPresentedNotificationsAsync();
        for (const notification of deliveredNotifications) {
          const data = notification.request.content.data;
          if (data?.autoOpen) {
            if (data.type === 'alarm') {
              router.push({
                pathname: '/alarm-challenge',
                params: {
                  alarmId: data.alarmId as string,
                  challengeType: data.challengeType as string,
                  snoozeCount: data.snoozeCount !== undefined ? String(data.snoozeCount) : '0'
                }
              });
              break;
            } else if (data.type === 'medication') {
              let medId = data.medicationId as string;
              let dId = data.doseId as string;
              let aId = data.alarmId as string;

              // If it's a snooze identifier, extract the real IDs
              if (aId?.startsWith('medication_snooze_')) {
                const parts = aId.replace('medication_snooze_', '').split('_');
                if (parts.length >= 2) {
                  medId = parts[0];
                  dId = parts[1];
                }
              }

              router.push({
                pathname: '/medication-reminder',
                params: { medicationId: medId, doseId: dId, alarmId: aId }
              });
              break;
            }
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  const onAnimationFinish = useCallback(() => {
    setSplashAnimationFinished(true);
  }, []);

  if (!loaded) return null;

  if (!isSplashAnimationFinished) {
    return <AnimatedSplashScreen onAnimationFinish={onAnimationFinish} />;
  }

  return (
    <SafeAreaProvider>
      <RootLayoutNav />
    </SafeAreaProvider>
  );
}

function RootLayoutNav() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerBackTitle: "Back",
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerShadowVisible: false,
          headerTintColor: colors.primary,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="about" options={{ presentation: "card" }} />
        <Stack.Screen name="privacy-policy" options={{ presentation: "card" }} />
        <Stack.Screen name="permissions" options={{ presentation: "card" }} />
        <Stack.Screen
          name="alarm-challenge"
          options={{
            presentation: "fullScreenModal",
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="medication-reminder"
          options={{
            presentation: "fullScreenModal",
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="qr-scanner"
          options={{
            presentation: 'fullScreenModal',
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="alarm-form" options={{ presentation: 'card' }} />
        <Stack.Screen name="medication-form" options={{ presentation: 'card' }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
});
