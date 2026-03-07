
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Linking, Platform, NativeModules } from 'react-native';
import theme from '@/constants/theme';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import * as Notifications from 'expo-notifications';
import { Bell, AlertTriangle, Settings, ShieldCheck, Bug, X, Battery, Camera, Image } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/store/settingsStore';
import { debugNotifications, testNotification, clearAllAlarmNotifications } from '@/store/alarmStore';
import * as ExpoCamera from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

const { AlarmModule } = NativeModules;

export const AlarmPermissionHelper: React.FC = () => {
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [cameraStatus, setCameraStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [libraryStatus, setLibraryStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [isBatteryOptimized, setIsBatteryOptimized] = useState(false);
  const [showHelper, setShowHelper] = useState(false);
  const { colors } = useTheme();
  const { t } = useSettingsStore();
  const styles = createStyles(colors);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);

    const { status: camStatus } = await ExpoCamera.Camera.getCameraPermissionsAsync();
    setCameraStatus(camStatus);

    const { status: libStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
    setLibraryStatus(libStatus);

    let batteryOptimized = false;
    if (Platform.OS === 'android' && AlarmModule) {
      const isIgnoring = await AlarmModule.isIgnoringBatteryOptimizations();
      batteryOptimized = !isIgnoring;
      setIsBatteryOptimized(batteryOptimized);
    }

    setShowHelper(
      status !== 'granted' ||
      camStatus !== 'granted' ||
      libStatus !== 'granted' ||
      batteryOptimized
    );
  };

  const requestPermissions = async () => {
    const requestPermissionsSequentially = async () => {
      // 1. Notifications
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true, allowCriticalAlerts: true },
        android: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      setPermissionStatus(status);

      // 2. Camera
      const { status: camStatus } = await ExpoCamera.Camera.requestCameraPermissionsAsync();
      setCameraStatus(camStatus);

      // 3. Photo Library
      const { status: libStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setLibraryStatus(libStatus);

      if (Platform.OS === 'android' && AlarmModule) {
        // 4. Exact Alarm
        const canExact = await AlarmModule.canScheduleExactAlarms();
        if (!canExact) {
          await new Promise<void>((resolve) => {
            Alert.alert(
              "دقة المواعيد",
              "لضمان رنين المنبه في الوقت المحدد تماماً، يرجى السماح للتطبيق بضبط المنبهات الدقيقة.",
              [
                { text: "فتح الإعدادات", onPress: () => { AlarmModule.requestExactAlarmPermission(); resolve(); } },
                { text: "لاحقاً", style: "cancel", onPress: () => resolve() }
              ]
            );
          });
        }

        // 5. Battery Optimization
        const isIgnoring = await AlarmModule.isIgnoringBatteryOptimizations();
        if (!isIgnoring) {
          await new Promise<void>((resolve) => {
            Alert.alert(
              "العمل في الخلفية",
              "لضمان عمل المنبه حتى عندما يكون الهاتف في وضع السكون، يرجى استثناء التطبيق من تحسين البطارية.",
              [
                { text: "تعديل", onPress: () => { AlarmModule.requestIgnoreBatteryOptimizations(); resolve(); } },
                { text: "لاحقاً", style: "cancel", onPress: () => resolve() }
              ]
            );
          });
        }

        // 6. Overlay
        const canDraw = await AlarmModule.canDrawOverlays();
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
      }
    };

    await requestPermissionsSequentially();
    checkPermissions();
  };

  const handleDebugNotifications = async () => {
    await debugNotifications();
  };

  const handleTestNotification = async () => {
    await testNotification();
  };

  const handleClearNotifications = async () => {
    const count = await clearAllAlarmNotifications();
    Alert.alert('تم مسح الإشعارات', `تم مسح ${count} من إشعارات المنبه`);
  };

  if (!showHelper) {
    return null;
  }

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <AlertTriangle size={24} color={colors.warning} />
        <Text style={styles.title}>مطلوب صلاحيات التطبيق</Text>
      </View>

      <Text style={styles.description}>
        يحتاج التطبيق لعدة صلاحيات ليعمل بشكل صحيح (الإشعارات، الكاميرا، الصور، والعمل في الخلفية).
      </Text>

      <View style={styles.actions}>
        <Button
          title="منح جميع الصلاحيات"
          onPress={requestPermissions}
          leftIcon={<ShieldCheck size={20} color="white" />}
          fullWidth
        />

        {permissionStatus !== 'granted' && (
          <View style={styles.warningBox}>
            <Bell size={20} color={colors.error} />
            <Text style={styles.warningText}>صلاحية الإشعارات مطلوبة للتنبيهات.</Text>
          </View>
        )}

        {cameraStatus !== 'granted' && (
          <View style={styles.warningBox}>
            <Camera size={20} color={colors.error} />
            <Text style={styles.warningText}>صلاحية الكاميرا مطلوبة لتحديات الـ QR.</Text>
          </View>
        )}

        {libraryStatus !== 'granted' && (
          <View style={styles.warningBox}>
            <Image size={20} color={colors.error} />
            <Text style={styles.warningText}>صلاحية مكتبة الصور مطلوبة لصور الأدوية.</Text>
          </View>
        )}

        {isBatteryOptimized && Platform.OS === 'android' && (
          <View style={styles.warningBox}>
            <Battery size={20} color={colors.error} />
            <Text style={styles.warningText}>تحسين البطارية مفعل. قد لا يرن المنبه في موعده.</Text>
          </View>
        )}

        <Button
          title="فحص الإشعارات (Debug)"
          onPress={handleDebugNotifications}
          variant="outline"
          leftIcon={<Bug size={20} color={colors.primary} />}
          fullWidth
          style={{ marginTop: theme.spacing.sm }}
        />

        <Button
          title="اختبار إشعار (5 ثوانٍ)"
          onPress={handleTestNotification}
          variant="outline"
          leftIcon={<Bell size={20} color={colors.primary} />}
          fullWidth
          style={{ marginTop: theme.spacing.sm }}
        />

        <Button
          title="مسح جميع إشعارات المنبه"
          onPress={handleClearNotifications}
          variant="outline"
          leftIcon={<X size={20} color={colors.error} />}
          fullWidth
          style={{ marginTop: theme.spacing.sm }}
        />
      </View>
    </Card>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    margin: theme.spacing.md,
    backgroundColor: colors.warning + '10',
    borderColor: colors.warning,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: '600',
    color: colors.text,
    marginLeft: theme.spacing.sm,
  },
  description: {
    fontSize: theme.typography.fontSizes.md,
    color: colors.text,
    marginBottom: theme.spacing.md,
    lineHeight: 22,
  },
  actions: {
    marginTop: theme.spacing.md,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '10',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  warningText: {
    fontSize: 12,
    color: colors.error,
    flex: 1,
  },
});

export default AlarmPermissionHelper;
