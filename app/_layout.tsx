
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@/hooks/useTheme";
import * as Notifications from 'expo-notifications';
import { Platform, AppState, NativeModules, Alert, View, StyleSheet, DeviceEventEmitter } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { router } from "expo-router";
import AnimatedSplashScreen from './splash';
import MobileAds from 'react-native-google-mobile-ads';
import * as ExpoCamera from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import AdBanner from '@/components/ui/AdBanner';

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

          // 1. Notifications
          try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            if (existingStatus !== 'granted') {
              const { status: finalStatus } = await Notifications.requestPermissionsAsync();
              console.log("Notification permission status:", finalStatus);
            }
          } catch (e) { console.error("Error requesting notifications:", e); }

          // Give a small breathing room between system prompts
          await new Promise(r => setTimeout(r, 500));

          // 2. Camera (for QR)
          try {
            const { status: camStatus } = await ExpoCamera.Camera.getCameraPermissionsAsync();
            if (camStatus !== 'granted') {
              await ExpoCamera.Camera.requestCameraPermissionsAsync();
            }
          } catch (e) { console.error("Error requesting camera:", e); }

          await new Promise(r => setTimeout(r, 500));

          // 3. Photo Library (for Medication images)
          try {
            const { status: libStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
            if (libStatus !== 'granted') {
              await ImagePicker.requestMediaLibraryPermissionsAsync();
            }
          } catch (e) { console.error("Error requesting photos:", e); }

          if (Platform.OS === 'android' && AlarmModule) {
            await new Promise(r => setTimeout(r, 500));

            // 4. Exact Alarm (Android 12+)
            try {
              const canExact = await AlarmModule.canScheduleExactAlarms();
              if (!canExact) {
                await new Promise<void>((resolve) => {
                  Alert.alert(
                    "دقة المواعيد",
                    "لضمان رنين المنبه في الوقت المحدد تماماً، يرجى السماح للتطبيق بضبط المنبهات الدقيقة من الإعدادات.",
                    [
                      { text: "فتح الإعدادات", onPress: () => { AlarmModule.requestExactAlarmPermission(); resolve(); } },
                      { text: "لاحقاً", style: "cancel", onPress: () => resolve() }
                    ]
                  );
                });
              }
            } catch (e) { console.error("Error checking exact alarm:", e); }

            await new Promise(r => setTimeout(r, 800)); // Longer delay before another possible system intent

            // 5. AdMob Initialize
            try {
              await MobileAds().initialize();
              console.log("AdMob initialized");
            } catch (e) {
              console.error("AdMob init error:", e);
            }

            // 6. Battery Optimization
            try {
              const isIgnoring = await AlarmModule.isIgnoringBatteryOptimizations();
              if (!isIgnoring) {
                await new Promise<void>((resolve) => {
                  Alert.alert(
                    "العمل في الخلفية",
                    "لضمان عمل المنبه حتى عندما يكون الهاتف في وضع السكون، يرجى استثناء التطبيق من تحسين البطارية (Battery Optimization).",
                    [
                      { text: "تعديل", onPress: () => { AlarmModule.requestIgnoreBatteryOptimizations(); resolve(); } },
                      { text: "لاحقاً", style: "cancel", onPress: () => resolve() }
                    ]
                  );
                });
              }
            } catch (e) { console.error("Error checking battery optimization:", e); }

            await new Promise(r => setTimeout(r, 800));

            // 6. Draw Over Other Apps (for Fullscreen Alarms)
            try {
              const canDraw = await AlarmModule.canDrawOverlays();
              console.log("Can draw overlays:", canDraw);
              if (!canDraw) {
                await new Promise<void>((resolve) => {
                  Alert.alert(
                    "تنبيهات ملء الشاشة",
                    "لإظهار شاشة تحدي المنبه حتى عندما يكون الهاتف مغلقاً، يرجى تفعيل خاصية 'الظهور فوق التطبيقات الأخرى'.",
                    [
                      { text: "تعديل", onPress: () => { AlarmModule.requestOverlayPermission(); resolve(); } },
                      { text: "لاحقاً", style: "cancel", onPress: () => resolve() }
                    ]
                  );
                });
              }
            } catch (e) { console.error("Error checking overlay permission:", e); }
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
            params: { alarmId: data.alarmId as string, challengeType: data.challengeType as string }
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
              params: { medicationId: parts[0], doseId: parts[1] }
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
          params: { alarmId: data.alarmId as string, challengeType: data.challengeType as string }
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
            params: { medicationId: parts[0], doseId: parts[1] }
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
                params: { alarmId: data.alarmId as string, challengeType: data.challengeType as string }
              });
              break;
            } else if (data.type === 'medication') {
              router.push({
                pathname: '/medication-reminder',
                params: { medicationId: data.medicationId as string, doseId: data.doseId as string }
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
